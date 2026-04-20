# Study Note AWS MVP 운영 문서

이 문서는 `008-aws-mvp-deploy`, `009-github-actions-deploy`, `010-test-quality-checks` 범위의 단일 EC2 기반 저비용 MVP 배포, 자동배포, 품질 게이트, 1차 복구 절차를 정리한다. 현재 MVP AWS 리소스는 적용되어 있으며, 신규 생성/재생성/파괴 작업은 사용자 승인 후에만 수행한다.

## 현재 운영 상태

- AWS 계정: `107015853205`
- 리전: `ap-northeast-2`
- EC2 인스턴스: `i-00e45b6e3c8a1308d`
- Elastic IP: `3.39.3.103` (Allocation ID: `eipalloc-038ca8aec00af4542`, Association ID: `eipassoc-0233690141c229769`)
- 공인 엔드포인트: `http://3.39.3.103`
- 앱 상태 확인: `http://3.39.3.103/api/health`
- Argo CD Application: `study-note-mvp` `Synced/Healthy`
- 현재 GitOps overlay image tag는 main 병합 후 `Deploy Main` workflow가 갱신한다.

## 범위

포함:

- 단일 AWS 리전
- 단일 EC2 인스턴스
- k3s 단일 노드
- Argo CD core
- Study Note frontend/backend Kubernetes 배포
- 하나의 공인 HTTP 엔드포인트
- GitHub Actions PR 검증과 main 병합 후 자동배포
- Node 내장 test runner 기반 frontend/backend MVP 회귀 테스트

제외:

- 고가용성
- 멀티 노드
- 멀티 환경
- 원격 Terraform state와 locking
- 본격 로깅/모니터링 스택
- 대규모 E2E/성능/고급 보안/강제 coverage 품질 체계

## Terraform state 운영 제한

- `008` MVP에서는 Terraform state를 로컬 파일로 관리한다.
- 원격 state backend와 locking은 구성하지 않는다.
- 동시에 두 명 이상이 `terraform plan` 또는 `terraform apply`를 실행하면 안 된다.
- 신규 `terraform apply`, `terraform destroy`, AWS 리소스 재생성은 사용자 승인 후에만 실행한다.
- 원격 state, locking, 권한 분리는 후속 spec 후보로 남긴다.

## 의존성 승인 체크포인트

- 저장소 패키지 의존성을 새로 추가해야 하면 설치 전에 사용자 승인을 받는다.
- 로컬 운영 도구(`terraform`, `aws`, `kubectl`)는 문서상 전제 도구이며 저장소 패키지 의존성으로 추가하지 않는다.
- Docker, Terraform, AWS CLI, kubectl 설치는 운영자 PC 준비사항으로 다룬다.

## EC2 bootstrap 전략

- Terraform user data는 `infra/terraform/scripts/ec2-bootstrap.sh`를 EC2 부팅 시 실행한다.
- 스크립트는 `curl`, `ca-certificates`, `jq` 같은 기본 운영 도구만 설치한다.
- k3s는 단일 노드 server 모드로 설치한다.
- CoreDNS upstream은 공용 resolver `1.1.1.1 8.8.8.8`을 사용하도록 보정한다.
- Argo CD core 설치 후 default AppProject와 `argocd-secret` `server.secretkey`를 보장한다.
- ECR pull을 위해 `study-note` namespace의 `ecr-registry` imagePullSecret을 생성/갱신한다.
- kubeconfig는 `/etc/rancher/k3s/k3s.yaml`에 두며, bootstrap 확인은 `kubectl get nodes`로 수행한다.
- 백엔드 로컬 저장소는 `/var/lib/study-note/backend` 아래에 둔다.
- bootstrap 로그는 `/var/log/study-note-bootstrap.log`에서 확인한다.
- 이 스크립트는 EC2 user data로 실행되며, 복구 시에는 EC2 내부에서만 수동 재실행한다.

## Argo CD와 앱 배포 구조

- Argo CD는 core 설치를 기본으로 한다.
- Argo CD UI는 `008` 범위에서 노출하지 않는다.
- 앱 manifest는 `infra/kubernetes/study-note/overlays/mvp`를 기준으로 배포한다.
- Argo CD Application은 `infra/kubernetes/argocd/applications/study-note-mvp.yaml`에 정의한다.
- 외부 접속은 k3s 기본 Traefik ingress 하나로 제공한다.
- `/api`와 `/uploads`는 backend service로, `/`는 frontend service로 라우팅한다.

## 신규 배포 또는 재생성 전 준비

1. AWS 계정과 결제 설정을 확인한다.
2. 운영자 public IP를 확인하고 `ssh_ingress_cidr`에 `/32`로 넣는다.
3. Ubuntu 22.04 LTS 계열 AMI ID를 확인해 `ami_id`에 넣는다.
4. GitHub Actions OIDC용 repository owner/name/branch가 `terraform.tfvars`와 맞는지 확인한다.
5. `JWT_SECRET` 실제 값을 안전한 별도 경로에 준비한다.
6. `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN` GitHub Actions variable 준비 계획을 확인한다.

## 수동 인프라 검증 순서

아래 명령은 리소스를 만들지 않는 검증이다.

```bash
cd infra/terraform/environments/mvp
terraform fmt -recursive ../..
terraform init -backend=false
terraform validate
terraform plan -var-file=terraform.tfvars
```

주의:

- `terraform plan`은 AWS API 조회가 필요할 수 있다.
- `terraform apply`는 사용자 승인 후에만 실행한다.

## 신규 적용 또는 재생성 절차

1. `terraform.tfvars.example`을 참고해 추적되지 않는 `terraform.tfvars`를 만든다.
2. 사용자 승인 후 `terraform apply -var-file=terraform.tfvars`를 실행한다.
3. output의 `public_endpoint`를 기록한다.
4. EC2 bootstrap 로그를 확인한다.
5. k3s node 상태를 확인한다.
6. Argo CD core 상태를 확인한다.
7. Study Note overlay를 Argo CD Application으로 등록한다.
8. 공인 endpoint로 접속한다.

EC2 접속 후 확인 예시:

```bash
sudo tail -f /var/log/study-note-bootstrap.log
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get nodes
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get pods -A
```

## GitHub Actions 운영 흐름

### PR 검증

- PR에서는 운영 배포를 실행하지 않는다.
- `terraform fmt`, `terraform validate`, frontend test/build, backend test/startup sanity, Docker image build, Kubernetes manifest render를 수행한다.
- PR 검증 결과는 보호 브랜치 required status checks에 연결할 수 있다.

### main 병합 후 배포

- main push에서만 이미지 publish와 GitOps manifest update를 수행한다.
- AWS 인증은 GitHub Actions OIDC로 assume한 role을 사용한다.
- `[skip deploy]` 커밋이 아닌데 `AWS_REGION` 또는 `AWS_DEPLOY_ROLE_ARN` 변수가 없으면 workflow는 명시적으로 실패해야 한다.
- 이미지는 Amazon ECR에 push한다.
- workflow는 `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml`의 image tag를 갱신한다.
- Argo CD core는 main의 GitOps 경로 변경을 reconcile한다.
- workflow가 만든 tag update commit은 `[skip deploy]`를 포함해 재귀 배포를 막는다.

### ECR repository 소유 경계

- `009` MVP에서는 ECR repository 이름을 `study-note-backend`, `study-note-frontend`로 고정한다.
- Terraform은 GitHub Actions OIDC role과 ECR 접근 권한을 관리한다.
- main 배포 workflow는 두 repository가 없으면 생성할 수 있다.
- ECR repository 자체를 Terraform으로 엄격히 소유해야 하는 요구는 후속 spec에서 분리한다.

## 도메인과 HTTPS 비교 기준

| 선택 | 장점 | 단점 | `008` 판단 |
|------|------|------|------------|
| 공인 IP HTTP | 가장 빠르고 저렴함 | 보안과 사용자 신뢰 약함 | 기본 MVP 경로 |
| 도메인 + HTTP | 접속 주소가 안정적임 | DNS 준비 필요 | 선택사항 |
| 도메인 + HTTPS | 사용자 접속 보안 강화 | 인증서와 TLS 종료 설계 필요 | 후속 spec 후보 |

현재 MVP는 공인 IP HTTP 접속을 기본 운영 경로로 사용한다. HTTPS 정식화는 Route 53, ACM, ingress/TLS 구성이 함께 필요하므로 후속 spec으로 분리한다.

## 1차 복구 절차

### Bootstrap 실패

1. EC2에 SSH 접속한다.
2. `/var/log/study-note-bootstrap.log`를 확인한다.
3. k3s 설치 여부를 확인한다.
4. 실패 원인을 수정한 뒤 bootstrap 스크립트를 수동 재실행한다.

```bash
sudo bash /var/lib/cloud/instance/scripts/part-001
```

### k3s는 있으나 앱이 뜨지 않음

```bash
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get pods -A
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl describe pod -n study-note <pod-name>
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl logs -n study-note <pod-name>
```

### main 배포 workflow 실패

1. GitHub Actions job 중 실패 위치를 확인한다.
2. OIDC 인증 실패면 `AWS_DEPLOY_ROLE_ARN`, branch trust 조건을 확인한다.
3. ECR push 실패면 ECR 권한과 repository 이름을 확인한다.
4. manifest update 실패면 `kustomization.yaml` 변경 내용을 확인한다.

### ECR 또는 registry 문제

- ECR repository 존재 여부를 확인한다.
- `aws ecr get-login-password` 기반 인증이 가능한지 확인한다.
- image tag가 overlay에 반영됐는지 확인한다.
- GHCR 전환은 `008`에서 즉시 수행하지 않고 후속 결정으로 남긴다.

## 009 GitHub Actions 자동배포 운영 가이드

### branch protection required checks 설정 (T043)

GitHub → 저장소 → Settings → Branches → main 브랜치 보호 규칙에 아래 check 이름을 추가한다:

| check 이름 | 대응 job | 등록 여부 |
|------------|----------|-----------|
| `Terraform fmt and validate` | `pr-checks.yml / terraform` | required check로 추가 |
| `App and image build` | `pr-checks.yml / app-build` | required check로 추가. 010 기준 frontend/backend `npm test`도 이 job에서 함께 실행 |
| `Kubernetes manifest sanity` | `pr-checks.yml / manifest-sanity` | required check로 추가 |

주의:
- check 이름은 workflow의 `name:` 필드 값과 **정확히** 일치해야 한다.
- `Deploy Main`은 PR required check가 아니다 — main 병합 후에만 실행된다.
- 010 MVP에서는 별도 `App tests` job을 만들지 않는다. 테스트 실패는 `App and image build` required check 실패로 표시된다.
- JS lint/format/coverage/E2E는 010 MVP required check가 아니며, 새 도구 설치가 필요하면 사용자 승인 후 별도 spec 또는 후속 작업으로 승격한다.
- `Deploy Main`이 만드는 `[skip deploy]` GitOps commit은 `github-actions[bot]`이 main에 push한다. branch protection이 bot push를 막는 경우 `Commit GitOps update` step이 실패하므로, repository rules에서 해당 경로의 bot push를 허용하거나 수동 복구 절차로 image tag를 반영해야 한다.

## 010 테스트/품질 체크 운영 가이드

### 로컬 실행 기준

```bash
cd backend
npm test
node -e "const { createApp } = require('./src/app'); const app = createApp(); const server = app.listen(0, () => server.close());"
```

```bash
cd frontend
npm test
npm run build
```

### 실패 분류 기준

| 실패 영역 | 먼저 확인할 위치 | merge 차단 |
|-----------|------------------|------------|
| backend test | `backend/tests/`, `backend/src/services/`, `backend/src/repositories/`, `backend/src/middleware/` | Yes |
| frontend test | `frontend/tests/`, `frontend/src/services/`, `frontend/src/utils/` | Yes |
| build | `frontend/package.json`, import/export, Vite build output | Yes |
| Docker image | `backend/Dockerfile`, `frontend/Dockerfile`, build context | Yes |
| manifest | `infra/kubernetes/study-note/overlays/mvp` | Yes |
| terraform | `infra/terraform` formatting, `infra/terraform/environments/mvp` validation | Yes |
| lint/format | 도구 승인 여부와 후속 설정 | No in 010 |
| environment | Node 22, npm install, GitHub Actions runner, local shell 권한 | Depends on failed required check |

### 재실행 기준

- 테스트 실패: 관련 test 파일과 source 파일을 수정한 뒤 PR에 push한다.
- dependency install 실패: lockfile과 registry/network 상태를 확인한 뒤 재실행한다.
- 환경성 실패: GitHub Actions 일시 장애 또는 네트워크 문제면 `Re-run failed jobs`를 사용한다.
- lint/format 관련 실패: 010에서는 required check가 아니므로, 새 도구를 도입하려면 사용자 승인 후 별도 변경으로 처리한다.

### OIDC 인증 실패 확인 및 재실행 기준 (T039)

**확인 순서**:

1. GitHub Actions 로그에서 `Check required variables` step이 실패했는지 확인한다.
2. `AWS_REGION` 저장소 변수가 설정되어 있는지 확인한다.
3. `AWS_DEPLOY_ROLE_ARN` 저장소 변수가 정확한 ARN 형식인지 확인한다.
4. `Configure AWS credentials` step 오류를 확인한다.
5. IAM trust policy의 subject 조건이 `repo:LeeMinki/study-note2:ref:refs/heads/main`과 일치하는지 확인한다.
6. workflow `permissions`에 `id-token: write`가 선언되어 있는지 확인한다.

**재실행 기준**: 변수 또는 IAM trust policy를 수정한 뒤 GitHub Actions에서 실패한 run을 `Re-run failed jobs`로 재실행한다.

### ECR 게시 실패 확인 및 재실행 기준 (T040)

**확인 순서**:

1. `Login to Amazon ECR` step이 성공했는지 확인한다.
2. IAM role에 `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:InitiateLayerUpload`, `ecr:PutImage` 권한이 있는지 확인한다.
3. `Ensure ECR repositories` step에서 `study-note-backend`, `study-note-frontend` repository가 생성 또는 확인됐는지 확인한다.
4. image tag(`${{ github.sha }}`) 형식이 ECR 태그 규칙과 충돌하지 않는지 확인한다.

**재실행 기준**: 일시적 네트워크 오류면 바로 재실행한다. 권한 문제면 IAM 정책 수정 후 재실행한다.

### GitOps 갱신 실패 확인 및 재실행 기준 (T041)

**확인 순서**:

1. `Update GitOps image tags` step 로그에서 Python 스크립트 오류를 확인한다.
2. `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml`의 `images:` 블록 구조가 변경되지 않았는지 확인한다.
3. `Validate rendered manifests` step에서 kustomize 렌더 결과가 비어 있지 않은지 확인한다.
4. `Commit GitOps update` step에서 Git push 권한(`contents: write`)이 있는지 확인한다.
5. branch protection 또는 repository rules가 `github-actions[bot]`의 `[skip deploy]` commit push를 막고 있는지 확인한다.

**재실행 기준**: `kustomization.yaml` 구조 변경이 원인이면 Python 스크립트와 YAML 구조를 맞춘 뒤 재실행한다. Git push 오류가 branch protection 때문이면 repository rule을 조정하거나 운영자가 같은 image tag 변경을 PR로 반영한다.

### Argo CD 동기화 실패 확인 및 런타임 점검 (T042)

**확인 순서**:

```bash
# Argo CD Application 상태 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get applications -n argocd

# 앱 상태 상세 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl describe application study-note-mvp -n argocd

# study-note 네임스페이스 Pod 상태 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get pods -n study-note

# image pull 오류 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl describe pod -n study-note <pod-name>

# ECR pull secret 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get secret -n study-note

# Argo CD core 필수 런타임 리소스 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get appproject default -n argocd
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get secret argocd-secret -n argocd -o jsonpath='{.data.server\.secretkey}'

# Argo CD repo-server의 GitHub DNS 조회 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl exec -n argocd deploy/argocd-repo-server -- getent hosts github.com

# k3s CoreDNS upstream 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get configmap coredns -n kube-system -o yaml | rg '1.1.1.1 8.8.8.8'
```

**재실행 기준**:
- Argo CD Application이 없으면 `kubectl apply -f infra/kubernetes/argocd/applications/study-note-mvp.yaml`을 실행한다.
- default AppProject가 없으면 같은 application manifest에 포함된 AppProject 정의를 다시 적용한다.
- `server.secretkey`가 없으면 bootstrap의 `ensure_argocd_secret_key` 로직을 재실행하거나 동일한 값을 수동 생성한다.
- Argo CD가 GitHub repository를 조회하지 못하면 CoreDNS upstream과 EC2 outbound network를 먼저 확인한다.
- image pull 오류면 ECR pull secret이 올바르게 구성되었는지 확인한다.
- GitOps 상태가 최신인데도 동기화 안 되면 Argo CD에서 수동 Sync를 실행한다.

### Argo CD GitOps 핸드오프 방식 (T034)

정상 배포 경로에서 GitHub Actions는 클러스터에 직접 `kubectl apply`하지 않는다.

| 역할 | 담당 |
|------|------|
| 이미지 빌드 및 ECR push | GitHub Actions |
| `kustomization.yaml` image tag 갱신 및 commit | GitHub Actions |
| 클러스터 상태 동기화 | Argo CD (automated sync) |
| 클러스터 직접 apply | 정상 배포 경로에서는 금지 |

Argo CD는 `main` 브랜치의 `infra/kubernetes/study-note/overlays/mvp` 경로를 주기적으로 폴링하며, GitOps 상태 변경을 감지하면 자동으로 동기화한다.

비상 복구에서만 운영자가 EC2 내부 kubeconfig로 `kubectl apply`를 사용할 수 있다. 이 경우 반드시 같은 변경을 Git에 반영해 Argo CD desired state와 런타임 상태가 다시 일치해야 한다.

### 010 테스트 확장 지점 (T045)

009 workflow는 빌드 검증 중심이다. 010 spec에서 아래 지점에 테스트를 추가한다:

| 삽입 위치 | 삽입 내용 | workflow 파일 |
|-----------|-----------|---------------|
| 프론트엔드 `npm ci` 이후 | `npm test` (unit/component) | `pr-checks.yml / app-build` |
| 백엔드 `npm ci` 이후 | `npm test` (unit/integration) | `pr-checks.yml / app-build` |
| 백엔드 startup sanity 이후 | API 계약 테스트 | `pr-checks.yml / app-build` |

테스트 check를 branch protection required checks에 추가하는 시점은 010에서 test scope와 의존성 승인 이후로 결정한다.

## 011 도메인/HTTPS 운영 가이드

### 적용 전 체크리스트

```bash
# 1. 도메인명을 patch 파일에 반영했는지 확인
grep "DOMAIN_PLACEHOLDER" infra/kubernetes/study-note/overlays/mvp/patches/ingress-tls.yaml
grep "DOMAIN_PLACEHOLDER" infra/kubernetes/study-note/overlays/mvp/patches/ingress-www-tls.yaml
# 출력이 있으면 실제 도메인으로 교체 필요

# 2. ClusterIssuer 이메일을 설정했는지 확인
grep "REPLACE_WITH_OPERATOR_EMAIL" infra/kubernetes/cert-manager/cluster-issuer-*.yaml
# 출력이 있으면 실제 이메일로 교체 필요

# 3. terraform.tfvars에 domain_name 설정 여부 확인
grep "domain_name" infra/terraform/environments/mvp/terraform.tfvars
```

### 초기 적용 순서

```bash
# Step 1: Terraform으로 Route 53 Hosted Zone + DNS 레코드 생성
cd infra/terraform/environments/mvp
terraform plan -var-file=terraform.tfvars   # Route 53 리소스 preview
terraform apply -var-file=terraform.tfvars
terraform output route53_nameservers         # NS 레코드 4개 확인

# Step 2: 도메인 등록 기관에서 NS 레코드 교체 (전파 최대 48시간)
# Step 3: DNS 전파 확인
dig A <DOMAIN>                               # EC2 IP 반환 확인
dig CNAME www.<DOMAIN>                       # DOMAIN 반환 확인

# Step 4: 도메인 전용 HTTP→HTTPS 리디렉션 확인
# IP fallback을 유지하기 위해 전역 Traefik redirect 대신 Ingress Middleware를 사용한다.
kubectl get middleware https-redirect -n study-note
kubectl get ingress study-note -n study-note \
  -o jsonpath='{.metadata.annotations.traefik\.ingress\.kubernetes\.io/router\.middlewares}'

# Step 5: cert-manager 설치
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
kubectl wait --for=condition=Available deployment --all -n cert-manager --timeout=120s

# Step 6: ClusterIssuer 적용 (staging 먼저)
kubectl apply -f infra/kubernetes/cert-manager/cluster-issuer-staging.yaml
# ... staging 테스트 후 production 전환
kubectl apply -f infra/kubernetes/cert-manager/cluster-issuer-prod.yaml

# Step 7: ingress TLS 적용 (Argo CD sync 또는 직접 apply)
kubectl apply -k infra/kubernetes/study-note/overlays/mvp
```

현재 운영 값:

| 항목 | 값 |
|------|-----|
| 운영 도메인 | `study-note.yuna-pa.com` |
| www 도메인 | `www.study-note.yuna-pa.com` |
| Route 53 hosted zone | `Z06364843I0SKGHVHRUIH` |
| EC2 Elastic IP | `3.39.3.103` |
| TLS Secret | `study-note-tls-secret` |

### EC2 SSH 접속

운영 편의를 위해 root가 아닌 `studynote` 계정을 사용한다. 로컬 WSL 환경에는 전용 SSH 키가 생성되어 있다.

```bash
ssh -i ~/.ssh/study-note-yuna-pa studynote@study-note.yuna-pa.com
```

`studynote` 계정은 운영 명령 실행을 위해 sudo 권한을 가진다. k3s 상태 확인은 아래처럼 실행한다.

```bash
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl get pods -A
```

현재 EC2 보안그룹은 운영자 출발지 IP만 SSH 인바운드를 허용한다. 접속 위치가 바뀌면 보안그룹의 SSH CIDR을 새 공인 IP로 갱신해야 한다.

### DNS 전파 확인

```bash
# NS 레코드 전파 확인
dig NS <DOMAIN>

# A 레코드 전파 확인
dig A <DOMAIN>
nslookup <DOMAIN>

# www CNAME 확인
dig CNAME www.<DOMAIN>

# 브라우저 DNS 캐시 초기화 (WSL 외부 접속 시)
# Chrome: chrome://net-internals/#dns → Clear host cache
```

### 인증서 상태 확인

```bash
# Certificate 상태 확인 (READY=True 목표)
kubectl get certificate -n study-note

# Certificate 상세 확인 (갱신 스케줄, 챌린지 상태)
kubectl describe certificate study-note-tls -n study-note

# ACME 챌린지 상태 확인 (발급 중일 때)
kubectl get challenges -n study-note
kubectl describe challenge -n study-note <challenge-name>

# 인증서 유효 기간 확인
kubectl get secret study-note-tls-secret -n study-note \
  -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -dates

# cert-manager 로그 확인
kubectl logs -n cert-manager -l app=cert-manager --tail=50
```

### 인증서 갱신 실패 복구

```bash
# 인증서 강제 재발급 (Secret 삭제 → cert-manager 자동 재발급)
kubectl delete secret study-note-tls-secret -n study-note
# cert-manager가 Certificate를 감지하고 새 Secret 생성 (수 분 소요)
kubectl get certificate -n study-note -w   # READY=True 대기

# 챌린지 재시도 트리거
kubectl delete challenge -n study-note --all

# Rate limit 초과 시: 최대 7일 대기 또는 staging으로 전환 후 테스트
```

### Staging → Production 전환

```bash
# 1. staging 인증서 확인 (READY=True, 브라우저 경고 무시)
kubectl get certificate -n study-note

# 2. ingress 어노테이션을 production으로 변경
#    infra/kubernetes/study-note/base/ingress.yaml 에서
#    cert-manager.io/cluster-issuer: letsencrypt-staging
#    → cert-manager.io/cluster-issuer: letsencrypt-prod 로 수정 후 apply

# 3. staging Secret 삭제 → production Secret 자동 생성
kubectl delete secret study-note-tls-secret -n study-note
kubectl get certificate -n study-note -w   # production 인증서 발급 대기
```

### 장애 시 임시 우회

| 장애 유형 | 우회 방법 |
|----------|---------|
| DNS 전파 미완료 | `http://3.39.3.103` IP 직접 접속 |
| cert-manager 인증서 발급 실패 | 도메인 Ingress Middleware 어노테이션 제거 후 HTTP 운영 |
| Traefik TLS 오류 | Ingress에서 https-redirect Middleware 어노테이션 제거 → HTTP-only로 복귀 |
| 인증서 만료 임박 | 강제 재발급 절차 실행 |

**Traefik 리디렉션 일시 해제**:

HTTP→HTTPS 리디렉션은 전역 HelmChartConfig 대신 도메인 Ingress 전용 Middleware로 구현되어 있다. IP fallback(`http://3.39.3.103`)은 영향을 받지 않는다.

```bash
# study-note Ingress에서 https-redirect Middleware 어노테이션 제거 → HTTP-only로 복귀
kubectl annotate ingress study-note -n study-note \
  traefik.ingress.kubernetes.io/router.middlewares- --overwrite
kubectl annotate ingress study-note-www -n study-note \
  traefik.ingress.kubernetes.io/router.middlewares- --overwrite

# 재활성화: Argo CD sync 또는 아래 명령으로 어노테이션 복원
kubectl annotate ingress study-note -n study-note \
  traefik.ingress.kubernetes.io/router.middlewares=study-note-https-redirect@kubernetescrd --overwrite
```

### EC2 IP 변경 시 DNS 갱신

현재 EC2에는 Elastic IP(`3.39.3.103`)가 할당되어 있다. **stop/start 사이클로는 IP가 바뀌지 않는다.**

EC2 인스턴스가 **재생성(terminate → new)** 되면 Elastic IP 연결(Association)이 해제된다. 이 경우 아래 절차로 재연결한다:

```bash
# 새 인스턴스 ID 확인
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].{ID:InstanceId,State:State.Name}' \
  --profile study-note-admin

# Elastic IP 재연결
aws ec2 associate-address \
  --instance-id <new-instance-id> \
  --allocation-id eipalloc-038ca8aec00af4542 \
  --profile study-note-admin

# DNS는 Route 53 A 레코드가 이미 3.39.3.103을 가리키므로 변경 불필요
dig A study-note.yuna-pa.com   # 3.39.3.103 확인
```

### 도메인 등록 만료 주의사항

**도메인이 만료되면 DNS가 해제되어 서비스 전체 접속이 불가능해진다.**

- 도메인 등록 기관에서 자동 갱신(Auto-Renew)을 활성화한다.
- 매년 갱신 이메일을 확인하고 결제 정보를 최신으로 유지한다.
- Route 53에서 도메인을 직접 등록한 경우: AWS Billing 알림을 설정한다.

## EC2 스케줄 운영

EC2는 비용 절감을 위해 평일/주말 공통으로 자동 스케줄이 적용되어 있다.

| 스케줄 이름 | cron | 동작 | 타임존 |
|-------------|------|------|--------|
| `study-note-mvp-ec2-start-0900` | `cron(0 9 * * ? *)` | 시작 | Asia/Seoul |
| `study-note-mvp-ec2-stop-1800` | `cron(0 18 * * ? *)` | 중지 | Asia/Seoul |

**구현 방식**: EventBridge Scheduler → SSM Automation (`AWS-StartEC2Instance` / `AWS-StopEC2Instance`)

- SSM Automation 실행용 IAM Role: `arn:aws:iam::107015853205:role/study-note-mvp-ec2-ssm-scheduler-role`
- 대상 EC2: `i-00e45b6e3c8a1308d`
- Elastic IP가 할당되어 있으므로 재시작 후에도 IP(`3.39.3.103`)와 도메인이 유지된다.

**스케줄 외 수동 시작/중지**:

```bash
# 수동 시작
aws ec2 start-instances --instance-ids i-00e45b6e3c8a1308d --profile study-note-admin

# 수동 중지
aws ec2 stop-instances --instance-ids i-00e45b6e3c8a1308d --profile study-note-admin

# 상태 확인
aws ec2 describe-instance-status --instance-ids i-00e45b6e3c8a1308d --profile study-note-admin
```

## 011 이후 후속 spec 후보

- IP 직접 접속 차단 — 보안그룹에서 HTTP/HTTPS를 도메인 경유만 허용
- Route 53 Health Check 기반 DNS failover
- Argo CD 자동 sync 연동 (현재: 수동 kubectl apply 필요)

## 009 이후 후속 spec 후보

- Route 53 + ACM + HTTPS 정식화
- 원격 Terraform state와 DynamoDB locking
- dev/staging/prod 분리
- 다중 노드 또는 고가용성 k3s
- Prometheus/Grafana/Loki 등 본격 관측성
- JSON 데이터와 uploads 백업/복구 자동화
- 테스트 코드 도입과 배포 전 자동 테스트 확장
- 이미지 취약점 스캔과 공급망 보안 강화
