# Study Note

Study Note는 개발 및 학습 내용을 빠르게 기록하고, 검색과 태그 필터링으로 다시 찾기 쉽게 만드는 웹 애플리케이션이다.

저장소는 Spec Kit 기반으로 기능 명세와 구현 계획을 먼저 정리한 뒤, 실제 코드를 같은 모노레포 안에서 구현하는 흐름으로 운영된다.

## 목적

- 개발 중 떠오른 내용을 빠르게 기록한다.
- 최근 노트를 빠르게 훑어본다.
- 태그와 검색으로 원하는 노트를 즉시 다시 찾는다.

## 아키텍처 원칙

- 저장소는 `frontend/` 와 `backend/` 로 분리된 모노레포 구조를 따른다.
- frontend는 backend 소스를 직접 import 하지 않는다.
- frontend와 backend는 반드시 HTTP API로만 통신한다.
- 데이터 접근과 파일 저장 책임은 모두 backend가 가진다.
- backend의 모든 JSON 응답은 아래 envelope을 따른다.

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## 현재 상태

현재 저장소에는 Spec Kit 산출물과 실제 애플리케이션 코드가 함께 들어 있다.

- 프론트엔드: `frontend/` React + Vite
- 백엔드: `backend/` Express
- 저장소: SQLite (`backend/src/db/`), 이미지 파일 (`backend/uploads/`)
- 인증: JWT 기반 로그인/회원가입, 계정별 노트 분리, 프로필 조회/수정, 비밀번호 변경
- 노트 기능: CRUD, 검색, 태그 필터, 이미지 붙여넣기, 마크다운 이미지 렌더링, 자동 임시저장
- 배포: AWS 단일 EC2 + k3s + Argo CD core 기반 저비용 MVP 환경 운영 중
- 자동배포: GitHub Actions PR 검증, main 병합 후 ECR publish와 GitOps image tag 갱신
- 품질 체크: Node 내장 test runner 기반 frontend/backend MVP 회귀 테스트와 PR build/test gate
- 현재 외부 접속: `https://study-note.yuna-pa.com`

## 스펙별 현황

### [`001-study-note-app`](specs/001-study-note-app/spec.md)

- 목적: Study Note 기본 MVP 정의
- 핵심 범위: 노트 CRUD, 검색, 태그 필터, 마크다운 렌더링, 인라인 편집
- 현재 상태: 구현 완료, 후속 기능의 기반
- 문서:
  [spec](specs/001-study-note-app/spec.md),
  [plan](specs/001-study-note-app/plan.md),
  [research](specs/001-study-note-app/research.md),
  [data-model](specs/001-study-note-app/data-model.md),
  [quickstart](specs/001-study-note-app/quickstart.md),
  [openapi](specs/001-study-note-app/contracts/openapi.yaml)

### [`002-expand-note-layout`](specs/002-expand-note-layout/spec.md)

- 목적: 노트 작성/조회 레이아웃 가변 폭 지원
- 핵심 범위: composer 폭 조절, 넓게/기본/좁게 전환
- 현재 상태: 구현 완료
- 문서:
  [spec](specs/002-expand-note-layout/spec.md),
  [plan](specs/002-expand-note-layout/plan.md),
  [research](specs/002-expand-note-layout/research.md),
  [data-model](specs/002-expand-note-layout/data-model.md),
  [quickstart](specs/002-expand-note-layout/quickstart.md),
  [tasks](specs/002-expand-note-layout/tasks.md)

### [`003-image-paste-autosave`](specs/003-image-paste-autosave/spec.md)

- 목적: 이미지 붙여넣기와 작성 중 임시저장 지원
- 핵심 범위: 클립보드 이미지 업로드, 마크다운 이미지 렌더링, localStorage draft 복원
- 현재 상태: 구현 완료
- 문서:
  [spec](specs/003-image-paste-autosave/spec.md),
  [plan](specs/003-image-paste-autosave/plan.md),
  [research](specs/003-image-paste-autosave/research.md),
  [data-model](specs/003-image-paste-autosave/data-model.md),
  [quickstart](specs/003-image-paste-autosave/quickstart.md),
  [tasks](specs/003-image-paste-autosave/tasks.md)

### [`004-auth-login`](specs/004-auth-login/spec.md)

- 목적: 인증 도입과 계정별 노트 분리
- 핵심 범위: 회원가입/로그인, JWT 인증, 노트/이미지 API 보호, userId 기반 데이터 격리
- 현재 상태: 구현 완료
- 문서:
  [spec](specs/004-auth-login/spec.md),
  [plan](specs/004-auth-login/plan.md),
  [research](specs/004-auth-login/research.md),
  [data-model](specs/004-auth-login/data-model.md),
  [quickstart](specs/004-auth-login/quickstart.md),
  [tasks](specs/004-auth-login/tasks.md)

### [`005-signup-validation-and-fields`](specs/005-signup-validation-and-fields/spec.md)

- 목적: 회원가입 입력 모델 확장
- 핵심 범위: `name`, `displayName`, `passwordConfirm`, 회원가입 전용 검증 강화
- 현재 상태: 구현 완료
- 문서:
  [spec](specs/005-signup-validation-and-fields/spec.md),
  [plan](specs/005-signup-validation-and-fields/plan.md),
  [research](specs/005-signup-validation-and-fields/research.md),
  [data-model](specs/005-signup-validation-and-fields/data-model.md),
  [quickstart](specs/005-signup-validation-and-fields/quickstart.md),
  [tasks](specs/005-signup-validation-and-fields/tasks.md)

### [`006-account-profile-ui`](specs/006-account-profile-ui/spec.md)

- 목적: 계정 프로필 조회/수정 UI 제공
- 핵심 범위: 프로필 버튼, 전체 화면 프로필 뷰, `GET/PATCH /api/auth/me`, 이름/표시 이름 수정
- 현재 상태: 구현 완료
- 문서:
  [spec](specs/006-account-profile-ui/spec.md),
  [plan](specs/006-account-profile-ui/plan.md),
  [research](specs/006-account-profile-ui/research.md),
  [data-model](specs/006-account-profile-ui/data-model.md),
  [quickstart](specs/006-account-profile-ui/quickstart.md),
  [tasks](specs/006-account-profile-ui/tasks.md)

### [`007-auth-form-reset-and-password-profile`](specs/007-auth-form-reset-and-password-profile/spec.md)

- 목적: 인증 폼 상태 누수 제거와 비밀번호 변경 지원
- 핵심 범위: 로그인/회원가입 탭 전환 시 상태 초기화, 프로필 화면 내 비밀번호 변경, README 정리
- 현재 상태: 구현 완료
- 문서:
  [spec](specs/007-auth-form-reset-and-password-profile/spec.md),
  [plan](specs/007-auth-form-reset-and-password-profile/plan.md),
  [research](specs/007-auth-form-reset-and-password-profile/research.md),
  [data-model](specs/007-auth-form-reset-and-password-profile/data-model.md),
  [quickstart](specs/007-auth-form-reset-and-password-profile/quickstart.md),
  [tasks](specs/007-auth-form-reset-and-password-profile/tasks.md)

### [`008-aws-mvp-deploy`](specs/008-aws-mvp-deploy/spec.md)

- 목적: Study Note를 AWS에 저비용 MVP 형태로 배포
- 핵심 범위: Terraform 최소 AWS 인프라, 단일 EC2, k3s, Argo CD core, Kubernetes manifests, 운영 문서
- 현재 상태: 구현 완료 및 AWS MVP 환경 적용 완료
- 주요 결정:
  - AWS 리전은 `ap-northeast-2` 기준
  - 단일 EC2에서 k3s, Argo CD core, 앱을 함께 운영
  - 컨테이너 이미지는 Amazon ECR 기본안
  - Terraform state는 `008` 범위에서 local-only, locking 없음, single operator 전제
  - 도메인/HTTPS, remote state, HA, observability, 백업 자동화는 후속 spec 후보
- 운영 값:
  - EC2 인스턴스: `i-00e45b6e3c8a1308d`
  - 공인 엔드포인트: `http://3.39.3.103` (Elastic IP)
  - 도메인 엔드포인트: `https://study-note.yuna-pa.com`
  - Argo CD Application: `study-note-mvp` `Synced/Healthy`
- 문서:
  [spec](specs/008-aws-mvp-deploy/spec.md),
  [plan](specs/008-aws-mvp-deploy/plan.md),
  [research](specs/008-aws-mvp-deploy/research.md),
  [data-model](specs/008-aws-mvp-deploy/data-model.md),
  [quickstart](specs/008-aws-mvp-deploy/quickstart.md),
  [contract](specs/008-aws-mvp-deploy/contracts/deployment-contract.md),
  [tasks](specs/008-aws-mvp-deploy/tasks.md)

### [`009-github-actions-deploy`](specs/009-github-actions-deploy/spec.md)

- 목적: 008 AWS 배포 환경 위에 GitHub Actions 기반 자동배포를 추가
- 핵심 범위: PR 검증 workflow, main 병합 후 이미지 build/push, GitOps image tag 갱신, GitHub OIDC, ECR, Argo CD sync, 운영/복구 문서
- 현재 상태: 구현 완료 및 운영 중
- 주요 결정:
  - PR에서는 production 배포를 하지 않고 검증만 수행
  - main 병합 후에만 ECR publish와 GitOps 갱신 수행
  - AWS 인증은 장기 access key 없이 GitHub OIDC 사용
  - Argo CD는 GitOps manifest 변경을 reconcile하고 GitHub Actions는 클러스터에 직접 배포하지 않음
  - 테스트 코드는 후속 `010` spec에서 확장
- 운영 보강:
  - GitOps image tag 갱신 스크립트가 `kustomization.yaml`의 `- name:` 형식을 처리하도록 수정
  - Argo CD core runtime에 필요한 default AppProject와 `server.secretkey` 초기화 반영
  - k3s CoreDNS upstream을 공용 resolver로 고정해 GitHub/Let’s Encrypt DNS 조회 실패를 방지
- 문서:
  [spec](specs/009-github-actions-deploy/spec.md),
  [plan](specs/009-github-actions-deploy/plan.md),
  [research](specs/009-github-actions-deploy/research.md),
  [data-model](specs/009-github-actions-deploy/data-model.md),
  [quickstart](specs/009-github-actions-deploy/quickstart.md),
  [workflow contract](specs/009-github-actions-deploy/contracts/workflow-contract.md),
  [operations contract](specs/009-github-actions-deploy/contracts/operations-contract.md),
  [tasks](specs/009-github-actions-deploy/tasks.md)

### [`010-test-quality-checks`](specs/010-test-quality-checks/spec.md)

- 목적: 테스트와 품질 체크를 MVP 수준으로 도입해 PR 단계에서 기본 회귀를 잡는다.
- 핵심 범위: 백엔드 인증/보호 라우트/JSON envelope/SQLite DB persistence 테스트, 프론트엔드 API URL/이미지 업로드 인증 헤더/Markdown 렌더링 테스트, 기존 `PR Checks` workflow 확장, required status checks 문서화
- 현재 상태: 구현 완료
- 주요 결정:
  - 새 패키지 없이 Node 내장 test runner(`node --test`)를 사용
  - 010에서는 별도 `App tests` job을 만들지 않고 기존 `App and image build` job 안에서 `npm test`를 실행
  - lint/format/coverage/E2E는 승인과 안정화 전까지 required check로 강제하지 않음
- 문서:
  [spec](specs/010-test-quality-checks/spec.md),
  [plan](specs/010-test-quality-checks/plan.md),
  [research](specs/010-test-quality-checks/research.md),
  [data-model](specs/010-test-quality-checks/data-model.md),
  [quickstart](specs/010-test-quality-checks/quickstart.md),
  [quality gate contract](specs/010-test-quality-checks/contracts/quality-gate-contract.md),
  [tasks](specs/010-test-quality-checks/tasks.md)

### [`011-domain-https`](specs/011-domain-https/spec.md)

- 목적: 커스텀 도메인과 HTTPS 적용
- 핵심 범위: Route 53 도메인, Let's Encrypt TLS, Traefik 인그레스 HTTPS 리다이렉트, www 리다이렉트
- 현재 상태: 구현 완료 및 운영 중
- 주요 결정:
  - 도메인: `study-note.yuna-pa.com`
  - Elastic IP: `3.39.3.103` (EC2 stop/start 후에도 IP 불변)
  - HTTPS 리다이렉트: Traefik middleware
- 문서:
  [spec](specs/011-domain-https/spec.md),
  [plan](specs/011-domain-https/plan.md),
  [tasks](specs/011-domain-https/tasks.md)

### [`012-db-migration`](specs/012-db-migration/spec.md)

- 목적: 파일 기반 JSON 저장 구조를 SQLite 데이터베이스로 마이그레이션
- 핵심 범위: better-sqlite3 도입, users/notes 스키마 정의, 데이터 접근 계층 전환, 기존 데이터 이전 스크립트, Kubernetes PVC 설정
- 현재 상태: 구현 완료 및 운영 중
- 주요 결정:
  - SQLite 단일 파일 (`study-note.db`)
  - hostPath PVC (`/var/lib/study-note/backend/`)
  - ECR pull secret 자동 갱신 CronJob 추가 (6시간 주기)
- 문서:
  [spec](specs/012-db-migration/spec.md),
  [plan](specs/012-db-migration/plan.md),
  [tasks](specs/012-db-migration/tasks.md)

## 현재 코드 구조

```text
backend/
  src/
    routes/
    controllers/
    services/
    repositories/
    db/
    utils/
  uploads/

frontend/
  src/
    components/
    services/
    hooks/
    utils/
    styles/

infra/
  terraform/
    environments/mvp/
    modules/
    scripts/
  kubernetes/
    argocd/
    study-note/
  docs/

.github/
  workflows/
```

## 구현된 범위

현재 `main` 기준으로 아래 기능이 반영되어 있다.

1. 노트 작성/수정/삭제
2. 제목/본문 검색
3. 태그 정규화 및 태그 필터
4. 마크다운 렌더링
5. 이미지 붙여넣기 업로드 및 이미지 렌더링
6. 자동 임시저장 및 복원
7. JWT 로그인/회원가입
8. 계정별 노트 분리
9. 프로필 버튼, 프로필 상세 화면, 이름/표시 이름 수정
10. 프로필 화면 내 비밀번호 변경
11. AWS 저비용 MVP 배포 구조
12. Terraform 기반 최소 인프라 정의
13. k3s/Argo CD core 기반 GitOps 배포 구조
14. GitHub Actions PR 검증 및 main 병합 후 배포 workflow
15. 배포/시크릿/복구 운영 문서
16. frontend/backend MVP 자동 테스트와 PR 품질 게이트

## 인증 및 계정 기능

- 회원가입 필드: `name`, `displayName`, `email`, `password`, `passwordConfirm`
- 로그인 방식: 이메일/비밀번호 + JWT localStorage 세션
- 프로필 기능: 현재 사용자 조회, 이름/표시 이름 수정, 현재 비밀번호 확인 기반 비밀번호 변경
- 저장 구조: SQLite (`better-sqlite3`) 기반 데이터베이스

## 실행 방식

fresh clone 직후에는 각 앱 디렉터리에서 먼저 의존성을 설치해야 한다.
`node_modules`는 저장소에 포함하지 않는 것을 원칙으로 하므로, 설치 없이 바로 `npm run dev`를 실행하면 `Cannot find module 'express'`, `vite: not found` 같은 오류가 발생할 수 있다.

실행 흐름은 아래 순서를 기준으로 한다.

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

기본 포트는 프론트엔드 `5173`, 백엔드 `3001`이며, 프론트엔드는 `VITE_API_BASE_URL`이 없으면 `http://localhost:3001`을 사용한다.

자세한 실행 절차와 수동 검증 순서는 [quickstart](specs/001-study-note-app/quickstart.md)를 참고하면 된다.

## 품질 체크

010 기준으로 새 패키지 없이 Node 내장 test runner를 사용한다.

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
npm run build
```

PR에서는 기존 `PR Checks` workflow의 `App and image build` job이 frontend/backend `npm test`, build, backend startup sanity, Docker image sanity를 함께 실행한다. branch protection에는 `Terraform fmt and validate`, `App and image build`, `Kubernetes manifest sanity`를 required status checks로 연결한다.

lint/format/coverage/E2E는 이번 MVP required check가 아니다. 새 도구나 패키지가 필요하면 설치 전에 사용자 승인을 받아야 한다.

## AWS 배포 준비

AWS 배포는 `008-aws-mvp-deploy` 기준으로 관리한다. 목표는 production-grade 고가용성이 아니라, 비용을 낮게 유지하면서 외부 접속 가능한 실제 MVP 환경을 만드는 것이다.

배포 구조는 아래 기준을 따른다.

- AWS 계정: `107015853205`
- 기본 리전: `ap-northeast-2`
- AWS CLI 프로필: `study-note-admin`
- 현재 공인 엔드포인트: `http://3.39.3.103` (Elastic IP)
- 현재 도메인 엔드포인트: `https://study-note.yuna-pa.com`
- 현재 EC2 인스턴스: `i-00e45b6e3c8a1308d`
- 인프라 관리: `infra/terraform/environments/mvp`
- EC2 부트스트랩: `infra/terraform/scripts/ec2-bootstrap.sh`
- 앱 배포 manifests: `infra/kubernetes/study-note`
- Argo CD manifests: `infra/kubernetes/argocd`
- 운영 문서: `infra/docs/operations.md`, `infra/docs/secrets.md`

AWS CLI 인증은 SSO 프로필을 사용한다.

```bash
aws sso login --profile study-note-admin --use-device-code
aws sts get-caller-identity --profile study-note-admin
```

신규 배포, 재생성, 복구 작업 전에는 [008 quickstart](specs/008-aws-mvp-deploy/quickstart.md), [009 quickstart](specs/009-github-actions-deploy/quickstart.md), [operations](infra/docs/operations.md), [secrets](infra/docs/secrets.md)를 먼저 확인한다.

주의할 점:

- `008` 범위의 Terraform state는 local-only다.
- state locking이 없으므로 동시에 여러 명이 Terraform을 실행하지 않는다.
- Argo CD는 core 구성이 기본이며, UI 구성은 후속 확장으로 본다.
- 도메인/HTTPS와 remote state는 이번 MVP의 필수 조건이 아니다.

## 의존성 정책

- 새로운 패키지가 필요하면 자동 설치하지 않는다.
- 먼저 사용자 승인 요청을 해야 한다.
- 가능한 한 기존 의존성과 기본 기능을 우선 사용한다.

## 개발 환경

- 기본 개발 환경: WSL Ubuntu
- shell 친화적인 Linux/WSL 흐름을 우선한다.
- 줄바꿈은 LF 기준으로 유지한다.

## 작업 흐름

이 저장소는 Spec Kit 기반 워크플로를 따른다.

일반적인 진행 순서는 아래와 같다.

1. `specify`로 기능 명세 작성
2. `clarify`로 애매한 요구사항 확정
3. `plan`으로 설계 산출물 생성
4. `tasks`로 구현 작업 분해
5. 구현 및 검증
6. PR 생성 및 병합
7. Jira 이슈 업데이트/종료

필요한 경우 Jira 티켓과 GitHub PR을 연결하고, 작업 완료 후 Jira에 PR 링크를 남기는 운영 흐름도 함께 사용한다.
