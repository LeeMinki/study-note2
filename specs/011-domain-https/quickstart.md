# Quickstart: 도메인 기반 접속 및 HTTPS 적용

## 전제 조건

- 008 AWS MVP 인프라(`terraform apply`) 완료
- EC2 인스턴스 실행 중, k3s + Argo CD 동작 확인
- 도메인 보유 또는 신규 등록 완료
- cert-manager 설치 사용자 승인 완료
- AWS SSO 로그인 상태: `aws sts get-caller-identity --profile study-note-admin`

## Step 1: Route 53 Hosted Zone 생성 (Terraform)

```bash
# 1. domain_name 변수 설정 (terraform.tfvars)
echo 'domain_name = "your-domain.com"' >> infra/terraform/environments/mvp/terraform.tfvars

# 2. DNS 모듈 plan 확인
cd infra/terraform/environments/mvp
terraform plan -var-file=terraform.tfvars

# 3. 승인 후 apply
terraform apply -var-file=terraform.tfvars
```

## Step 2: 도메인 등록 기관 NS 레코드 설정

```bash
# Route 53이 생성한 NS 레코드 확인
terraform output route53_nameservers
```

출력된 NS 레코드 4개를 도메인 등록 기관(GoDaddy, Namecheap, Route 53 자체 등)의 DNS 설정에 입력한다.

> Route 53에서 도메인을 직접 등록한 경우: NS 레코드가 자동으로 설정된다.

## Step 3: DNS 전파 확인

```bash
# NS 레코드 전파 확인 (수 분~48시간 소요)
dig NS your-domain.com

# A 레코드 확인
dig A your-domain.com

# www CNAME 확인
dig CNAME www.your-domain.com
```

예상 결과:
- `your-domain.com` A 레코드 → EC2 공인 IP
- `www.your-domain.com` CNAME → `your-domain.com`

## Step 4: cert-manager 설치 (승인 후)

```bash
# cert-manager 설치 (EC2에서 또는 kubeconfig 설정 후 로컬에서)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

# 설치 확인 (pod가 Running 상태가 될 때까지 대기)
kubectl get pods -n cert-manager

# CRD 등록 확인
kubectl get crds | grep cert-manager
```

## Step 5: Staging 인증서로 테스트

```bash
# ClusterIssuer (staging) 적용
kubectl apply -f infra/kubernetes/cert-manager/cluster-issuer-staging.yaml

# Certificate 상태 확인
kubectl get certificate -n study-note
kubectl describe certificate study-note-tls -n study-note

# HTTPS 테스트 (staging 인증서는 브라우저 경고 발생 — 정상)
curl -k https://your-domain.com
# 예상: 200 OK (인증서 경고 무시하고 연결됨)
```

## Step 6: Production 인증서 적용

```bash
# ClusterIssuer (production) 적용
kubectl apply -f infra/kubernetes/cert-manager/cluster-issuer-prod.yaml

# Ingress 어노테이션 방식이므로 별도 Certificate YAML은 없다.
# cert-manager가 ingress의 cert-manager.io/cluster-issuer 어노테이션을 읽어 Certificate를 생성한다.
kubectl annotate ingress study-note -n study-note \
  cert-manager.io/cluster-issuer=letsencrypt-prod --overwrite

# 인증서 발급 확인 (Ready: True)
kubectl get certificate -n study-note
# 예상: READY=True

# 인증서 유효 기간 확인
kubectl get secret study-note-tls-secret -n study-note -o jsonpath='{.data.tls\.crt}' \
  | base64 -d | openssl x509 -noout -dates
```

## Step 7: Ingress TLS 설정 + GitOps 반영

```bash
# 수정된 ingress + Traefik HelmChartConfig GitOps 반영
# (Argo CD가 main 브랜치 변경 감지 → 자동 sync)
git add infra/kubernetes/
git commit -m "feat: domain-https ingress TLS 및 Traefik redirect 설정 적용"
git push origin main
```

## Step 8: 전체 검증

```bash
# 1. HTTP → HTTPS 리디렉션 확인
curl -I http://your-domain.com
# 예상: HTTP/1.1 301 + Location: https://your-domain.com/

# 2. HTTPS 접속 확인
curl -I https://your-domain.com
# 예상: HTTP/1.1 200 OK

# 3. www → root 리디렉션 확인
curl -I https://www.your-domain.com
# 예상: 301 → https://your-domain.com/

# 4. 인증서 상세 확인
openssl s_client -connect your-domain.com:443 -servername your-domain.com \
  < /dev/null 2>/dev/null | openssl x509 -noout -issuer -dates
# 예상: issuer=Let's Encrypt, notAfter=90일 후

# 5. 브라우저 확인
# https://your-domain.com 접속 → 잠금 아이콘 표시 확인
```

## 장애 우회 절차

### DNS 전파 중 접속 불가

```bash
# IP로 직접 HTTP 접속 (기존 방식 유지)
curl http://3.38.149.233
```

### 인증서 발급 실패

```bash
# cert-manager 로그 확인
kubectl logs -n cert-manager -l app=cert-manager --tail=50

# Certificate 이벤트 확인
kubectl describe certificate study-note-tls -n study-note

# ACME 챌린지 상태 확인
kubectl get challenges -n study-note
kubectl describe challenge <challenge-name> -n study-note
```

### 인증서 수동 갱신 (긴급)

```bash
# Certificate/Secret 삭제 → cert-manager가 ingress 어노테이션을 보고 자동 재발급
kubectl delete certificate study-note-tls -n study-note

# 또는 annotate로 갱신 트리거
kubectl annotate certificate study-note-tls -n study-note \
  cert-manager.io/issue-temporary-certificate="true" --overwrite
```

### Traefik 리디렉션 일시 해제 (HTTPS 오류 시)

```bash
# HelmChartConfig에서 redirectTo 제거 후 apply
kubectl edit helmchartconfig traefik -n kube-system
# redirectTo 섹션 삭제 후 저장 → Traefik 자동 재시작
```

## EC2 IP 변경 시 DNS 갱신

```bash
# 새 EC2 IP 확인
aws ec2 describe-instances --query 'Reservations[*].Instances[*].PublicIpAddress'

# terraform.tfvars에 반영 후 apply
terraform apply -var-file=terraform.tfvars
# Route 53 A 레코드 자동 갱신

# TTL(300초) 이후 전파 완료 확인
dig A your-domain.com
```

## 011 이후 후속 후보

- 고정 IP(Elastic IP) 도입 — EC2 재생성 시 IP 변경 방지
- HTTPS 강제 적용 (IP 직접 접속 차단)
- Route 53 상태 확인(Health Check) 기반 DNS failover
- 멀티 서브도메인 운영
