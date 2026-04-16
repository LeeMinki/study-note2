# Study Note AWS MVP 운영 문서

이 문서는 `008-aws-mvp-deploy` 범위의 단일 EC2 기반 저비용 MVP 배포와 1차 복구 절차를 정리한다. 실제 AWS 리소스 생성과 `terraform apply`는 사용자 승인 전까지 실행하지 않는다.

## 범위

포함:

- 단일 AWS 리전
- 단일 EC2 인스턴스
- k3s 단일 노드
- Argo CD core
- Study Note frontend/backend Kubernetes 배포
- 하나의 공인 HTTP 엔드포인트
- GitHub Actions PR 검증과 main 병합 후 배포 초안

제외:

- 고가용성
- 멀티 노드
- 멀티 환경
- 원격 Terraform state와 locking
- 본격 로깅/모니터링 스택
- 테스트 코드 도입

## Terraform state 운영 제한

- `008` MVP에서는 Terraform state를 로컬 파일로 관리한다.
- 원격 state backend와 locking은 구성하지 않는다.
- 동시에 두 명 이상이 `terraform plan` 또는 `terraform apply`를 실행하면 안 된다.
- 실제 `terraform apply`와 AWS 리소스 생성은 사용자 승인 후에만 실행한다.
- 원격 state, locking, 권한 분리는 후속 `009` 후보로 남긴다.

## 의존성 승인 체크포인트

- 저장소 패키지 의존성을 새로 추가해야 하면 설치 전에 사용자 승인을 받는다.
- 로컬 운영 도구(`terraform`, `aws`, `kubectl`)는 문서상 전제 도구이며 저장소 패키지 의존성으로 추가하지 않는다.
- Docker, Terraform, AWS CLI, kubectl 설치는 운영자 PC 준비사항으로 다룬다.

## EC2 bootstrap 전략

- Terraform user data는 `infra/terraform/scripts/ec2-bootstrap.sh`를 EC2 부팅 시 실행한다.
- 스크립트는 `curl`, `ca-certificates`, `jq` 같은 기본 운영 도구만 설치한다.
- k3s는 단일 노드 server 모드로 설치한다.
- kubeconfig는 `/etc/rancher/k3s/k3s.yaml`에 두며, bootstrap 확인은 `kubectl get nodes`로 수행한다.
- 백엔드 로컬 저장소는 `/var/lib/study-note/backend` 아래에 둔다.
- bootstrap 로그는 `/var/log/study-note-bootstrap.log`에서 확인한다.
- 이 스크립트는 EC2 생성 승인 전까지 로컬에서 실행하지 않는다.

## Argo CD와 앱 배포 구조

- Argo CD는 core 설치를 기본으로 한다.
- Argo CD UI는 `008` 범위에서 노출하지 않는다.
- 앱 manifest는 `infra/kubernetes/study-note/overlays/mvp`를 기준으로 배포한다.
- Argo CD Application은 `infra/kubernetes/argocd/applications/study-note-mvp.yaml`에 정의한다.
- 외부 접속은 k3s 기본 Traefik ingress 하나로 제공한다.
- `/api`와 `/uploads`는 backend service로, `/`는 frontend service로 라우팅한다.

## 첫 배포 전 준비

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

## 실제 적용 승인 후 배포 순서

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
- `terraform fmt`, `terraform validate`, frontend build, backend startup sanity, Docker image build, Kubernetes manifest render만 수행한다.
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
| 도메인 + HTTPS | 사용자 접속 보안 강화 | 인증서와 TLS 종료 설계 필요 | `009` 후보 |

`008`에서는 외부 접속 가능성 확인을 우선한다. HTTPS 정식화는 Route 53, ACM, ingress/TLS 구성이 함께 필요하므로 후속 spec으로 분리한다.

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
| `App and image build` | `pr-checks.yml / app-build` | required check로 추가 |
| `Kubernetes manifest sanity` | `pr-checks.yml / manifest-sanity` | required check로 추가 |

주의:
- check 이름은 workflow의 `name:` 필드 값과 **정확히** 일치해야 한다.
- `Deploy Main`은 PR required check가 아니다 — main 병합 후에만 실행된다.
- `Deploy Main`이 만드는 `[skip deploy]` GitOps commit은 `github-actions[bot]`이 main에 push한다. branch protection이 bot push를 막는 경우 `Commit GitOps update` step이 실패하므로, repository rules에서 해당 경로의 bot push를 허용하거나 수동 복구 절차로 image tag를 반영해야 한다.

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
```

**재실행 기준**:
- Argo CD Application이 없으면 `kubectl apply -f infra/kubernetes/argocd/applications/study-note-mvp.yaml`을 실행한다.
- image pull 오류면 ECR pull secret이 올바르게 구성되었는지 확인한다.
- GitOps 상태가 최신인데도 동기화 안 되면 Argo CD에서 수동 Sync를 실행한다.

### Argo CD GitOps 핸드오프 방식 (T034)

GitHub Actions는 절대로 클러스터에 직접 `kubectl apply`하지 않는다.

| 역할 | 담당 |
|------|------|
| 이미지 빌드 및 ECR push | GitHub Actions |
| `kustomization.yaml` image tag 갱신 및 commit | GitHub Actions |
| 클러스터 상태 동기화 | Argo CD (automated sync) |
| 클러스터 직접 apply | **금지** |

Argo CD는 `main` 브랜치의 `infra/kubernetes/study-note/overlays/mvp` 경로를 주기적으로 폴링하며, GitOps 상태 변경을 감지하면 자동으로 동기화한다.

### 010 테스트 확장 지점 (T045)

009 workflow는 빌드 검증 중심이다. 010 spec에서 아래 지점에 테스트를 추가한다:

| 삽입 위치 | 삽입 내용 | workflow 파일 |
|-----------|-----------|---------------|
| 프론트엔드 `npm ci` 이후 | `npm test` (unit/component) | `pr-checks.yml / app-build` |
| 백엔드 `npm ci` 이후 | `npm test` (unit/integration) | `pr-checks.yml / app-build` |
| 백엔드 startup sanity 이후 | API 계약 테스트 | `pr-checks.yml / app-build` |

테스트 check를 branch protection required checks에 추가하는 시점은 010에서 test scope와 의존성 승인 이후로 결정한다.

## 009 이후 후속 spec 후보

- Route 53 + ACM + HTTPS 정식화
- 원격 Terraform state와 DynamoDB locking
- dev/staging/prod 분리
- 다중 노드 또는 고가용성 k3s
- Prometheus/Grafana/Loki 등 본격 관측성
- JSON 데이터와 uploads 백업/복구 자동화
- 테스트 코드 도입과 배포 전 자동 테스트 확장
- 이미지 취약점 스캔과 공급망 보안 강화
