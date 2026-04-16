# Tasks: Study Note AWS MVP Deployment

**Input**: Design documents from `/specs/008-aws-mvp-deploy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 테스트 코드 도입은 이번 범위에서 제외한다. 대신 PR 검증, 빌드, 인프라 검증, manifest sanity check 작업만 포함한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 배포용 디렉터리 구조와 기본 문서 뼈대를 만든다.

- [ ] T001 Create infrastructure directory skeleton in `infra/terraform/environments/mvp/`, `infra/terraform/modules/`, `infra/terraform/scripts/`, `infra/kubernetes/argocd/`, `infra/kubernetes/study-note/`, and `infra/docs/`
- [ ] T002 Create root Terraform files in `infra/terraform/environments/mvp/main.tf`, `providers.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, and `terraform.tfvars.example`
- [ ] T003 [P] Create Terraform module placeholders in `infra/terraform/modules/network/`, `infra/terraform/modules/compute/`, and `infra/terraform/modules/identity/`
- [ ] T004 [P] Create Kubernetes manifest skeleton files in `infra/kubernetes/study-note/base/` and `infra/kubernetes/study-note/overlays/mvp/`
- [ ] T005 [P] Create Argo CD manifest skeleton files in `infra/kubernetes/argocd/install/` and `infra/kubernetes/argocd/applications/`
- [ ] T006 [P] Create operations document skeletons in `infra/docs/operations.md` and `infra/docs/secrets.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 user story가 공유하는 배포 기반을 정의한다.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define shared Terraform variables, outputs, and environment conventions in `infra/terraform/environments/mvp/variables.tf` and `infra/terraform/environments/mvp/outputs.tf`
- [ ] T008 [P] Implement minimal network resources in `infra/terraform/modules/network/main.tf`, `variables.tf`, and `outputs.tf`
- [ ] T009 [P] Implement IAM and GitHub OIDC role resources in `infra/terraform/modules/identity/main.tf`, `variables.tf`, and `outputs.tf`
- [ ] T010 Implement EC2, security group, and bootstrap wiring in `infra/terraform/modules/compute/main.tf`, `variables.tf`, and `outputs.tf`
- [ ] T011 Wire `network`, `identity`, and `compute` modules together in `infra/terraform/environments/mvp/main.tf`
- [ ] T012 Create idempotent EC2 bootstrap strategy in `infra/terraform/scripts/ec2-bootstrap.sh`
- [ ] T013 Define registry, runtime config, and secret placeholder rules in `infra/kubernetes/study-note/base/configmap.yaml`, `infra/kubernetes/study-note/base/secret-template.yaml`, and `infra/docs/secrets.md`
- [ ] T014 Document dependency approval checkpoint for any new project package or tool wrapper in `infra/docs/operations.md` and `specs/008-aws-mvp-deploy/quickstart.md`
- [ ] T015 Document local Terraform state limitation, no-locking behavior, and single-operator rule in `infra/docs/operations.md` and `specs/008-aws-mvp-deploy/quickstart.md`

**Checkpoint**: Foundation ready - deployment user stories can now begin

---

## Phase 3: User Story 1 - Public MVP Environment (Priority: P1) 🎯 MVP

**Goal**: 빈 AWS 상태에서 단일 EC2 + k3s + Argo CD + 앱 배포 구조를 통해 외부 공개 엔드포인트를 확보한다.

**Independent Test**: Terraform 적용 후 EC2가 부팅되고, k3s 및 Argo CD가 설치되며, 하나의 공개 ingress 경로로 앱에 접근 가능한지 확인한다.

### Implementation for User Story 1

- [ ] T016 [US1] Implement VPC, public subnet, internet gateway, and route table resources in `infra/terraform/modules/network/main.tf`
- [ ] T017 [US1] Implement EC2 instance profile, security group rules, user data template hookup, and public endpoint outputs in `infra/terraform/modules/compute/main.tf`
- [ ] T018 [US1] Implement GitHub OIDC trust policy and deployment role outputs in `infra/terraform/modules/identity/main.tf`
- [ ] T019 [US1] Finalize root MVP stack assembly and example variables in `infra/terraform/environments/mvp/main.tf` and `infra/terraform/environments/mvp/terraform.tfvars.example`
- [ ] T020 [US1] Implement host bootstrap steps for package prep, k3s install, host data directories, kubeconfig setup, and Argo CD core install in `infra/terraform/scripts/ec2-bootstrap.sh`
- [ ] T021 [US1] Add Argo CD core installation notes and full UI deferral note in `infra/kubernetes/argocd/install/README.md`
- [ ] T022 [P] [US1] Define app namespace and shared kustomization in `infra/kubernetes/study-note/base/namespace.yaml` and `infra/kubernetes/study-note/base/kustomization.yaml`
- [ ] T023 [P] [US1] Define backend workload and service manifests in `infra/kubernetes/study-note/base/backend-deployment.yaml` and `infra/kubernetes/study-note/base/backend-service.yaml`
- [ ] T024 [P] [US1] Define frontend workload and service manifests in `infra/kubernetes/study-note/base/frontend-deployment.yaml` and `infra/kubernetes/study-note/base/frontend-service.yaml`
- [ ] T025 [US1] Define single public ingress path in `infra/kubernetes/study-note/base/ingress.yaml`
- [ ] T026 [US1] Define MVP overlay patches and environment examples in `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml`, `infra/kubernetes/study-note/overlays/mvp/patches/`, and `infra/kubernetes/study-note/overlays/mvp/values.env.example`
- [ ] T027 [US1] Define Argo CD application source for the Study Note overlay in `infra/kubernetes/argocd/applications/study-note-mvp.yaml`
- [ ] T028 [US1] Document external endpoint verification and first deployment flow in `infra/docs/operations.md`

**Checkpoint**: User Story 1 should provide a deployable public MVP environment

---

## Phase 4: User Story 2 - Repeatable App Release Flow (Priority: P2)

**Goal**: PR 검증과 main 병합 후 자동 배포를 분리하고, 이미지 publish와 GitOps 반영이 반복 가능하도록 만든다.

**Independent Test**: PR에서는 검증만 수행되고, main 병합 후에는 이미지 publish와 GitOps 반영 흐름이 정의되어 수동 서버 수정 없이 재배포 가능해야 한다.

### Implementation for User Story 2

- [ ] T029 [US2] Document Amazon ECR as the default MVP registry and GHCR as a deferred alternative in `infra/docs/secrets.md` and `specs/008-aws-mvp-deploy/research.md`
- [ ] T030 [US2] Define frontend and backend container build conventions in `frontend/Dockerfile`, `backend/Dockerfile`, and `.dockerignore`
- [ ] T031 [US2] Define PR validation workflow structure in `.github/workflows/pr-checks.yml`
- [ ] T032 [P] [US2] Add Terraform format and validate checks to `.github/workflows/pr-checks.yml`
- [ ] T033 [P] [US2] Add frontend build, backend startup sanity, and image build checks to `.github/workflows/pr-checks.yml`
- [ ] T034 [P] [US2] Add Kubernetes manifest sanity checks to `.github/workflows/pr-checks.yml`
- [ ] T035 [US2] Define main-branch deployment workflow in `.github/workflows/deploy-main.yml`
- [ ] T036 [US2] Add GitHub OIDC-based AWS authentication steps to `.github/workflows/deploy-main.yml`
- [ ] T037 [US2] Add Amazon ECR login, image publish, and manifest update flow to `.github/workflows/deploy-main.yml`
- [ ] T038 [US2] Add Argo CD reconciliation verification steps to `.github/workflows/deploy-main.yml`
- [ ] T039 [US2] Document protected branch and required status check expectations in `infra/docs/operations.md`
- [ ] T040 [US2] Document secret injection, ECR auth, and no-long-lived-key policy in `infra/docs/secrets.md`

**Checkpoint**: User Story 2 should support repeatable validation and post-merge deployment flow

---

## Phase 5: User Story 3 - Minimal Operations Runbook (Priority: P3)

**Goal**: 다른 팀원도 문서만 보고 초기 배포, 재배포, 기본 점검, 1차 복구를 수행할 수 있게 한다.

**Independent Test**: 운영 문서만으로 초기 배포, 시크릿 준비, 엔드포인트 점검, 실패 지점 구분, 기본 복구 단계를 따라갈 수 있어야 한다.

### Implementation for User Story 3

- [ ] T041 [US3] Write end-to-end bootstrap and first-run guide in `infra/docs/operations.md`
- [ ] T042 [P] [US3] Write secret inventory, rotation, and registry credential handling guide in `infra/docs/secrets.md`
- [ ] T043 [P] [US3] Expand `specs/008-aws-mvp-deploy/quickstart.md` with executable operator steps, local-state limitation, and prerequisites
- [ ] T044 [US3] Document Argo CD core as the MVP default and full UI as a deferred upgrade in `infra/docs/operations.md`
- [ ] T045 [US3] Document optional domain/HTTPS comparison criteria and why it is deferred in `infra/docs/operations.md`
- [ ] T046 [US3] Document recovery procedures for failed bootstrap, failed main deployment, and registry unavailability in `infra/docs/operations.md`
- [ ] T047 [US3] Document backend hostPath persistence expectations for `data.json`, `users.json`, and `uploads/` in `infra/kubernetes/study-note/base/persistent-path-notes.md`
- [ ] T048 [US3] Add follow-up spec candidates for remote state, HA, observability, backups, and test automation in `infra/docs/operations.md`

**Checkpoint**: User Story 3 should leave the environment operable from documentation alone

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 user story에 걸친 마무리와 검증 정리

- [ ] T049 [P] Validate Terraform, workflow, and manifest file references across `infra/terraform/`, `.github/workflows/`, and `infra/kubernetes/`
- [ ] T050 Re-check constitution alignment and dependency approval notes in `specs/008-aws-mvp-deploy/plan.md`, `infra/docs/operations.md`, and `infra/docs/secrets.md`
- [ ] T051 Run quickstart consistency pass in `specs/008-aws-mvp-deploy/quickstart.md` and align it with `infra/docs/operations.md`
- [ ] T052 Record deferred items for future specs, including test code introduction, in `infra/docs/operations.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 base deployment structure being present
- **User Story 3 (Phase 5)**: Depends on User Story 1 and User Story 2 artifacts existing
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependency on later stories
- **User Story 2 (P2)**: Depends on US1 deployable structure and manifest paths
- **User Story 3 (P3)**: Depends on US1 infrastructure path and US2 workflow path being defined

### Within Each User Story

- Terraform modules before root stack wiring completion
- Bootstrap before app and Argo CD runtime assumptions
- Namespace before deployment/service/ingress manifests
- PR validation workflow before deploy workflow hardening
- Secret handling definition before deployment workflow publish steps
- Documentation after the concrete deployment and CI/CD structure exists

### Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel
- Foundational module tasks `T008` and `T009` can run in parallel before compute wiring settles
- US1 workload manifest tasks `T023` and `T024` can run in parallel after namespace structure exists
- US2 PR check subtasks `T032`, `T033`, and `T034` can run in parallel after workflow skeleton exists
- US3 documentation tasks `T042` and `T043` can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch workload manifest tasks together after namespace and base structure exist:
Task: "Define backend workload and service manifests in infra/kubernetes/study-note/base/backend-deployment.yaml and infra/kubernetes/study-note/base/backend-service.yaml"
Task: "Define frontend workload and service manifests in infra/kubernetes/study-note/base/frontend-deployment.yaml and infra/kubernetes/study-note/base/frontend-service.yaml"
```

---

## Parallel Example: User Story 2

```bash
# Launch PR validation sub-checks together after the workflow skeleton exists:
Task: "Add Terraform format and validate checks to .github/workflows/pr-checks.yml"
Task: "Add frontend build, backend startup sanity, and image build checks to .github/workflows/pr-checks.yml"
Task: "Add Kubernetes manifest sanity checks to .github/workflows/pr-checks.yml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm single EC2 bootstrap, k3s, Argo CD, and one public endpoint path

### Incremental Delivery

1. Deliver infra skeleton and bootstrap base
2. Deliver public MVP deployment path (US1)
3. Deliver repeatable PR/main automation (US2)
4. Deliver operator runbooks and recovery guidance (US3)
5. Finish with cross-cutting validation and deferred-item capture

### Parallel Team Strategy

1. One developer handles Terraform base and bootstrap
2. One developer handles Kubernetes manifests and Argo CD application definitions
3. One developer handles GitHub Actions and secrets documentation
4. Merge into runbook and final validation after shared foundations are stable

---

## Notes

- 테스트 코드 도입 작업은 의도적으로 포함하지 않았다.
- 테스트 자동화 확장은 후속 spec 후보로만 남긴다.
- 모든 작업은 기존 `/frontend`와 `/backend` 경계를 건드리지 않는 배포/운영 레이어 중심이다.
- 새 패키지 설치가 필요해지면 구현 단계에서 먼저 사용자 승인을 받아야 한다.
