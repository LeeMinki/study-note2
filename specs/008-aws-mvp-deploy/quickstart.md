# Quickstart: Study Note AWS MVP Deployment

## 목적

아무 인프라도 없는 AWS 상태에서 Study Note를 저비용 MVP로 배포하기 위한 첫 실행 흐름을 정리한다. 목표는 단일 EC2, 단일 k3s, 단일 공인 엔드포인트, GitHub Actions 기반 배포 자동화까지 도달하는 것이다.

## 1. 사전 준비

필수 준비 항목:

- AWS 계정과 결제 설정
- GitHub 저장소 관리자 권한
- WSL Ubuntu 또는 Linux 셸 환경
- 로컬 실행 도구:
  - `terraform`
  - `aws`
  - `kubectl`
  - `git`
- GitHub Actions OIDC 설정에 사용할 AWS IAM 권한

주의:

- 이번 계획은 저장소의 새 npm 패키지 설치를 전제로 하지 않는다.
- 로컬 실행 도구가 추가로 필요하더라도 이는 운영 도구이며, 저장소 의존성 설치와는 별개다.
- 구현 단계에서 새 프로젝트 패키지가 필요해지면 먼저 사용자 승인을 받아야 한다.

## 2. 예상 디렉터리 구조

```text
infra/
├── terraform/
│   ├── environments/mvp/
│   ├── modules/
│   └── scripts/ec2-bootstrap.sh
├── kubernetes/
│   ├── argocd/
│   └── study-note/
└── docs/
```

## 3. 첫 배포 순서

1. `infra/terraform/environments/mvp`에 MVP용 변수 파일을 준비한다.
2. Terraform으로 VPC, 보안 그룹, EC2, IAM 리소스를 생성한다.
3. EC2 부트스트랩에서 k3s와 Argo CD 설치가 완료될 때까지 확인한다.
4. GitHub Actions OIDC용 AWS role trust policy와 저장소 권한을 연결한다.
5. 기본 이미지 저장소로 Amazon ECR을 준비한다.
6. frontend/backend 컨테이너 이미지를 빌드하고 ECR에 publish 가능한 상태로 만든다.
7. `infra/kubernetes/study-note/overlays/mvp`에 배포 리소스를 정리한다.
8. Argo CD가 해당 Git 경로를 바라보도록 애플리케이션 소스를 등록한다.
9. 외부 공인 엔드포인트로 접속 가능한지 확인한다.

## 3-1. Terraform state 제한

- `008` 범위에서는 Terraform state를 로컬 파일로 관리한다.
- state locking은 제공하지 않는다.
- 동시에 두 명 이상이 Terraform을 실행하는 운영 방식은 허용하지 않는다.
- 원격 state와 locking은 후속 spec으로 분리한다.

## 4. GitHub Actions 목표 상태

### PR 검증

- Terraform 포맷/기본 검증
- frontend build
- backend startup sanity
- frontend/backend Docker image build
- Kubernetes manifest sanity check

이 단계에서는:

- AWS 리소스를 변경하지 않는다.
- 프로덕션 이미지를 publish하지 않는다.
- 프로덕션 배포를 실행하지 않는다.

### main 병합 후 배포

- GitHub OIDC로 AWS 인증
- Amazon ECR 로그인
- 이미지 build 및 publish
- GitOps 경로의 배포 반영
- Argo CD reconcile 확인

## 5. 시크릿/환경변수 원칙

- AWS 인증은 장기 access key를 기본안으로 사용하지 않는다.
- GitHub Actions는 OIDC로 AWS role을 assume한다.
- 기본 컨테이너 저장소는 Amazon ECR로 둔다.
- 애플리케이션 시크릿은 Git 추적 manifest에 평문으로 저장하지 않는다.
- backend JWT secret, registry auth, 런타임 환경변수는 `infra/docs/secrets.md`에 관리 규칙을 문서화한다.

## 6. 외부 접속 원칙

- 초기 MVP는 하나의 공인 엔드포인트만 제공한다.
- 커스텀 도메인과 HTTPS는 선택사항이다.
- 첫 검증은 공인 IP 또는 임시 DNS 수준으로도 충분하다.
- 도메인/HTTPS는 비용, 운영 복잡도, 초기 검증 편의성을 비교한 뒤 후속 적용 여부를 결정한다.

## 7. 운영 문서 산출물

반드시 함께 작성할 문서:

- `infra/docs/operations.md`
- `infra/docs/secrets.md`
- `specs/008-aws-mvp-deploy/contracts/deployment-contract.md`

## 8. 후속 spec으로 남기는 항목

- Route 53 및 HTTPS 정식화
- 원격 Terraform state 및 locking
- `dev/staging/prod` 분리
- 다중 노드 또는 고가용성
- 본격 로깅/모니터링 스택
- 백업/복구 자동화

## 9. 검증 완료 기준

- Terraform으로 인프라를 반복 생성 가능한 상태
- EC2에서 k3s와 Argo CD가 기동된 상태
- GitHub Actions PR 체크가 보호 브랜치 조건으로 연결 가능한 상태
- main 병합 후 이미지 publish와 배포 반영 흐름이 정의된 상태
- 외부에서 Study Note 첫 화면 접근 가능 상태
