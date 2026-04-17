# Research: 도메인 기반 접속 및 HTTPS 적용

## 핵심 결정 요약

| 항목 | 결정 | 근거 |
|------|------|------|
| DNS 공급자 | Route 53 | 기존 AWS 통합, Terraform 지원, $0.50/month |
| 인증서 도구 | cert-manager | Kubernetes 표준, Secret 저장, 자동 갱신 |
| ACME 챌린지 | HTTP-01 | 단순, IAM 추가 권한 불필요 |
| HTTP→HTTPS | Traefik HelmChartConfig 전역 리디렉션 | 전역 적용, Middleware 불필요 |
| www 처리 | www → root 리디렉션, 인증서 SAN 커버 | 단순 DNS + 단일 cert |

## DNS 공급자 검토

### Route 53 선택 이유

- 기존 AWS 인프라(EC2, ECR, IAM)와 완전 통합
- Terraform `aws` provider 공식 지원 (`aws_route53_zone`, `aws_route53_record`)
- Hosted Zone 비용: $0.50/month — 월 $1 이하 목표 달성
- 쿼리 비용: 처음 10억 쿼리/월 $0.40/백만 — MVP 규모에서 무시 가능
- 도메인 등록 기관이 Route 53이 아닌 경우: NS 레코드 위임으로 해결

### 도메인 등록 기관 분리 시 처리

기존 등록 기관(GoDaddy, Namecheap 등)에서 도메인을 보유한 경우:
1. Route 53에서 Hosted Zone 생성
2. 생성된 NS(Name Server) 레코드 4개를 기존 등록 기관 DNS 설정에 입력
3. 도메인 소유권은 기존 등록 기관에 유지, DNS 관리만 Route 53으로 위임

## 인증서 도구 검토

### cert-manager vs Traefik 내장 ACME

**cert-manager 선택 이유:**
- 인증서를 Kubernetes Secret으로 저장 → 파드 재시작 후에도 유지
- `Certificate`, `ClusterIssuer` CRD로 선언적 관리 가능
- `kubectl get certificate` 명령으로 갱신 상태 직접 확인
- Traefik과 무관하게 작동 → 나중에 ingress 교체해도 재사용 가능
- 업계 표준, 문서 풍부

**Traefik 내장 ACME (대안):**
- 추가 구성 요소 없음
- k3s HelmChartConfig에서 `certificatesResolvers` 설정
- 인증서는 Traefik 내부 파일(`acme.json`) 또는 설정에 따라 Secret
- 단, Traefik 파드 재시작 시 acme.json 위치 관리 필요
- 상태 확인이 Traefik 로그 의존적

**cert-manager 승인 불가 시 대안**: Traefik HelmChartConfig에 `certificatesResolvers.letsencrypt` 설정으로 구현 가능. 구조는 단순하나 cert-manager 대비 가시성 낮음.

## ACME 챌린지 방식 검토

### HTTP-01 선택 이유

- 포트 80만 열려 있으면 작동 (EC2 보안그룹 확인 필요)
- IAM 추가 권한 불필요
- cert-manager 기본 챌린지 방식
- 단일 도메인 cert에 충분 (www SAN도 개별 챌린지로 처리)

### DNS-01 (대안)

- 포트 80 접근 불가 시 사용
- Route 53 DNS 레코드 수정 권한 IAM 필요 (추가 설정)
- 와일드카드 cert(`*.domain.com`) 가능 — 이번 범위 불필요
- 구성 복잡도 높음

### EC2 포트 80 확인 포인트

```bash
# 보안그룹 인바운드 규칙 확인
aws ec2 describe-security-groups --query 'SecurityGroups[*].IpPermissions'
```

포트 80이 허용되지 않으면 Terraform 보안그룹 수정 또는 DNS-01으로 전환 필요.

## Traefik HTTP→HTTPS 리디렉션 방식

k3s Traefik v2는 `HelmChartConfig`로 설정을 오버라이드할 수 있다:

```yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    ports:
      web:
        redirectTo:
          port: websecure
          permanent: true
```

이 설정은 port 80 전체 트래픽을 443으로 영구 리디렉션(301)한다. 별도 Middleware CRD 없이 전역 적용되어 단순하다.

## cert-manager 버전 및 설치 방식

- 최신 stable: v1.14.x 계열 (2024 기준)
- k3s(Kubernetes 1.26+)와 호환
- 설치 방법: 공식 YAML 매니페스트 or Helm
  - 권장: 공식 YAML 매니페스트 (`kubectl apply -f https://...`) → Argo CD Application으로 관리하거나 bootstrap 스크립트에 포함
- 설치 네임스페이스: `cert-manager`

## Let's Encrypt 제한 사항 인지

- Rate limit: 동일 도메인에 주당 5개 인증서 발급 제한 (production)
- Staging: 제한 없음, 단 브라우저 신뢰 불가 (테스트 전용)
- 인증서 유효 기간: 90일, cert-manager가 30일 전부터 갱신 시도
- 갱신 재시도: 실패 시 지수 백오프로 자동 재시도

## 비용 추정

| 항목 | 월 비용 |
|------|---------|
| Route 53 Hosted Zone | $0.50 |
| Route 53 DNS 쿼리 (MVP 규모) | $0.00~$0.01 |
| Let's Encrypt 인증서 | $0.00 (무료) |
| cert-manager | $0.00 (오픈소스) |
| **합계** | ~$0.50/month |
