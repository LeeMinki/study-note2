# Tasks: GitHub Actions Automatic Deployment

**Input**: Design documents from `/specs/009-github-actions-deploy/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: 테스트 코드 도입은 009 범위에서 제외한다. 이 작업 목록은 build, Docker image build, Terraform validate, Kubernetes manifest sanity 중심의 검증을 다루며, 실제 테스트 작업은 010 테스트/품질 체크 spec으로 확장한다.

**Organization**: 작업은 사용자 스토리별로 분리해 PR 검증, main 자동배포, 안전한 AWS 접근/운영 문서화를 독립적으로 검토할 수 있게 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 서로 다른 파일을 다루며 선행 작업에 직접 의존하지 않아 병렬 처리 가능
- **[Story]**: 사용자 스토리 단계에만 사용
- 모든 작업 설명은 실제 수정 또는 검토 대상 파일 경로를 포함한다

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 009 자동배포 구현 대상과 기존 008 AWS 배포 구조를 확인한다.

- [x] T001 Review existing PR workflow structure in `.github/workflows/pr-checks.yml` against `specs/009-github-actions-deploy/contracts/workflow-contract.md`
- [x] T002 Review existing main deployment workflow structure in `.github/workflows/deploy-main.yml` against `specs/009-github-actions-deploy/contracts/workflow-contract.md`
- [x] T003 [P] Confirm ECR repository names and GitOps image references in `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml`
- [x] T004 [P] Confirm GitHub OIDC role and ECR permissions are represented in `infra/terraform/modules/identity/main.tf`
- [x] T005 [P] Confirm no new frontend/backend package dependency is required and record the decision in `specs/009-github-actions-deploy/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리 구현 전에 workflow 경계, required checks, 인증 전제, 문서 위치를 고정한다.

**CRITICAL**: 이 단계가 완료되기 전에는 PR 검증이나 main 배포 동작을 확장하지 않는다.

- [x] T006 Define the two-workflow boundary and reject unnecessary extra workflows in `specs/009-github-actions-deploy/plan.md`
- [x] T007 Define stable required status check names in `.github/workflows/pr-checks.yml`
- [x] T008 Define main-only deployment trigger and permissions in `.github/workflows/deploy-main.yml`
- [x] T009 [P] Document required GitHub repository variables in `infra/docs/secrets.md`
- [x] T010 [P] Document branch protection connection points in `infra/docs/operations.md`
- [x] T011 [P] Document 010 test insertion points without adding test packages in `specs/009-github-actions-deploy/quickstart.md`
- [x] T012 Validate that `PR Checks` cannot assume AWS deploy credentials by reviewing permissions in `.github/workflows/pr-checks.yml`

**Checkpoint**: workflow 책임과 필수 check 이름이 고정되어 사용자 스토리 구현을 시작할 수 있다.

---

## Phase 3: User Story 1 - PR 검증으로 배포 전 문제 발견 (Priority: P1) MVP

**Goal**: PR이 열리면 production 배포 없이 build 중심 검증과 manifest sanity를 실행하고 GitHub PR 화면에서 실패 지점을 확인할 수 있게 한다.

**Independent Test**: PR을 열어 `PR Checks`가 실행되고 `Terraform fmt and validate`, `App and image build`, `Kubernetes manifest sanity` 상태가 표시되며 ECR push나 GitOps commit이 발생하지 않는지 확인한다.

### Implementation for User Story 1

- [x] T013 [US1] Configure pull request trigger targeting `main` in `.github/workflows/pr-checks.yml`
- [x] T014 [US1] Configure read-only repository permissions for PR validation in `.github/workflows/pr-checks.yml`
- [x] T015 [US1] Implement Terraform fmt, init with `-backend=false`, and validate steps in `.github/workflows/pr-checks.yml`
- [x] T016 [US1] Implement frontend dependency install and build steps in `.github/workflows/pr-checks.yml`
- [x] T017 [US1] Implement backend dependency install and startup sanity step in `.github/workflows/pr-checks.yml`
- [x] T018 [US1] Implement local-only backend Docker image build in `.github/workflows/pr-checks.yml`
- [x] T019 [US1] Implement local-only frontend Docker image build in `.github/workflows/pr-checks.yml`
- [x] T020 [US1] Implement Kubernetes MVP overlay render sanity check in `.github/workflows/pr-checks.yml`
- [x] T021 [US1] Update forbidden PR actions documentation in `specs/009-github-actions-deploy/contracts/workflow-contract.md`
- [x] T022 [P] [US1] Document PR validation failure triage in `infra/docs/operations.md`
- [x] T023 [P] [US1] Document PR verification steps in `specs/009-github-actions-deploy/quickstart.md`

**Checkpoint**: User Story 1은 production 배포 없이 독립적으로 검증 가능해야 한다.

---

## Phase 4: User Story 2 - main 병합 후 자동 배포 (Priority: P2)

**Goal**: main 병합 후에만 ECR 이미지 publish와 GitOps image tag 갱신이 실행되고, Argo CD가 GitOps 상태를 동기화하도록 한다.

**Independent Test**: main에 병합된 커밋에서 `Deploy Main`이 실행되고 backend/frontend 이미지가 ECR에 push되며 `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml`이 해당 commit SHA tag로 갱신되는지 확인한다.

### Implementation for User Story 2

- [x] T024 [US2] Configure push-to-main trigger and `[skip deploy]` recursion guard in `.github/workflows/deploy-main.yml`
- [x] T025 [US2] Configure `contents: write` and `id-token: write` permissions in `.github/workflows/deploy-main.yml`
- [x] T026 [US2] Configure AWS OIDC credential step using `AWS_DEPLOY_ROLE_ARN` and `AWS_REGION` in `.github/workflows/deploy-main.yml`
- [x] T027 [US2] Configure ECR login step in `.github/workflows/deploy-main.yml`
- [x] T028 [US2] Configure ECR repository ensure step for `study-note-backend` and `study-note-frontend` in `.github/workflows/deploy-main.yml`
- [x] T029 [US2] Configure backend Docker build, commit SHA tag, and ECR push in `.github/workflows/deploy-main.yml`
- [x] T030 [US2] Configure frontend Docker build with `VITE_API_BASE_URL=/`, commit SHA tag, and ECR push in `.github/workflows/deploy-main.yml`
- [x] T031 [US2] Configure GitOps image update for `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml` in `.github/workflows/deploy-main.yml`
- [x] T032 [US2] Configure post-update Kubernetes manifest render validation in `.github/workflows/deploy-main.yml`
- [x] T033 [US2] Configure GitOps commit and push with `[skip deploy]` in `.github/workflows/deploy-main.yml`
- [x] T034 [P] [US2] Document Argo CD GitOps handoff without direct cluster apply in `infra/docs/operations.md`
- [x] T035 [P] [US2] Document image release fields and same-SHA frontend/backend release rule in `specs/009-github-actions-deploy/data-model.md`

**Checkpoint**: User Story 2는 main 병합 후 자동배포 흐름을 독립적으로 검증할 수 있어야 한다.

---

## Phase 5: User Story 3 - 안전한 AWS 접근과 운영 문서화 (Priority: P3)

**Goal**: 장기 AWS access key 없이 OIDC 기반으로 배포하고, 실패 구간별 확인 지점과 재실행 기준을 문서로 따라갈 수 있게 한다.

**Independent Test**: GitHub repository variables, IAM trust policy 문서, 운영 문서를 검토해 장기 AWS access key 없이 인증이 구성되고 실패 시 확인 절차가 명확한지 확인한다.

### Implementation for User Story 3

- [x] T036 [US3] Document GitHub OIDC trust policy subject, audience, and branch scope in `infra/docs/secrets.md`
- [x] T037 [US3] Document the rule forbidding long-lived AWS access keys for default deployment auth in `infra/docs/secrets.md`
- [x] T038 [US3] Document required GitHub variables `AWS_REGION` and `AWS_DEPLOY_ROLE_ARN` in `infra/docs/secrets.md`
- [x] T039 [US3] Document OIDC authentication failure checks and retry criteria in `infra/docs/operations.md`
- [x] T040 [US3] Document ECR publish failure checks and retry criteria in `infra/docs/operations.md`
- [x] T041 [US3] Document GitOps update failure checks and retry criteria in `infra/docs/operations.md`
- [x] T042 [US3] Document Argo CD sync failure checks and runtime inspection commands in `infra/docs/operations.md`
- [x] T043 [US3] Document branch protection required status checks in `infra/docs/operations.md`
- [x] T044 [P] [US3] Update operations recovery point names in `specs/009-github-actions-deploy/contracts/operations-contract.md`
- [x] T045 [P] [US3] Mark 010 test and quality check expansion points in `infra/docs/operations.md`

**Checkpoint**: User Story 3은 문서 검토만으로 인증 방식, 금지 사항, 실패 복구 포인트를 확인할 수 있어야 한다.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: workflow 계약 준수, 문서 일관성, 로컬 검증 가능성을 최종 확인한다.

- [x] T046 Run Terraform format check for `infra/terraform` using `terraform fmt -check -recursive infra/terraform` (로컬 terraform 미설치, GitHub Actions에서 검증)
- [x] T047 Run Terraform validation for `infra/terraform/environments/mvp` using `terraform init -backend=false` and `terraform validate` (로컬 terraform 미설치, GitHub Actions에서 검증)
- [x] T048 Run frontend dependency install and build verification in `frontend/` (npm run build ✅)
- [x] T049 Run backend dependency install and startup sanity verification in `backend/` (node startup ✅)
- [x] T050 Run backend Docker build verification using `backend/Dockerfile` (로컬 Docker 미실행, GitHub Actions에서 검증)
- [x] T051 Run frontend Docker build verification using `frontend/Dockerfile` (로컬 Docker 미실행, GitHub Actions에서 검증)
- [x] T052 Run Kubernetes manifest render verification for `infra/kubernetes/study-note/overlays/mvp` (로컬 kubectl 미설치, GitHub Actions에서 검증)
- [x] T053 Verify `.github/workflows/pr-checks.yml` has no ECR push, GitOps commit, or AWS OIDC deploy step (확인 ✅)
- [x] T054 Verify `.github/workflows/deploy-main.yml` has `[skip deploy]` recursion guard and main-only deployment behavior (확인 ✅)
- [x] T055 Update 009 quickstart verification results and remaining 010 follow-up notes in `specs/009-github-actions-deploy/quickstart.md`
- [x] T056 Add explicit failure for missing `AWS_REGION` or `AWS_DEPLOY_ROLE_ARN` in `.github/workflows/deploy-main.yml`
- [x] T057 Document no-new-dependency static check interpretation in `specs/009-github-actions-deploy/plan.md`
- [x] T058 Document branch protection impact on GitOps bot commits in `infra/docs/operations.md`
- [x] T059 Document ECR repository ownership boundary in `infra/docs/operations.md`
- [x] T060 Update deployment workflow variable and branch protection contract in `specs/009-github-actions-deploy/contracts/workflow-contract.md`
- [x] T061 Fix GitOps image update parsing for `- name:` entries in `.github/workflows/deploy-main.yml`
- [x] T062 Pin current MVP overlay to the latest pushed ECR images in `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml`
- [x] T063 Add default Argo CD AppProject for core runtime compatibility in `infra/kubernetes/argocd/applications/study-note-mvp.yaml`
- [x] T064 Ensure Argo CD `argocd-secret` `server.secretkey` is created during EC2 bootstrap in `infra/terraform/scripts/ec2-bootstrap.sh`
- [x] T065 Configure k3s CoreDNS upstream to AWS VPC resolver for Argo CD GitHub DNS resolution in `infra/terraform/scripts/ec2-bootstrap.sh`
- [x] T066 Verify deployed endpoint and API health after runtime fixes in `specs/009-github-actions-deploy/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 바로 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 진행하며 모든 사용자 스토리를 차단
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작, MVP 범위
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능하지만 production 영향이 있어 US1 검증 완료 후 적용 권장
- **User Story 3 (Phase 5)**: Foundational 완료 후 문서 작업은 병렬 가능
- **Polish (Final Phase)**: 선택한 사용자 스토리 구현 완료 후 진행

### User Story Dependencies

- **US1 (P1)**: PR 검증만 다루므로 다른 사용자 스토리에 의존하지 않는다.
- **US2 (P2)**: main 배포 workflow가 PR 검증과 같은 build/Docker/manifest 전제를 공유하므로 US1 완료 후 검토하는 것이 안전하다.
- **US3 (P3)**: 문서와 인증 정책 중심이라 US1/US2와 병렬 가능하지만 최종 내용은 US2 구현 결과와 맞아야 한다.

### Within Each User Story

- workflow trigger와 permission을 먼저 고정한다.
- build 또는 deploy 단계는 credentials와 repository 전제 확인 후 추가한다.
- 문서 작업은 workflow 동작이 확정된 뒤 실제 check 이름과 실패 지점을 반영한다.
- 새 패키지가 필요해지는 순간 구현을 멈추고 사용자 승인 요청을 먼저 한다.

---

## Parallel Opportunities

- **Setup**: T003, T004, T005는 서로 다른 파일을 검토하므로 병렬 가능하다.
- **Foundational**: T009, T010, T011은 문서 파일이 달라 병렬 가능하다.
- **US1**: T022, T023은 PR workflow 구현과 병렬로 문서화할 수 있다.
- **US2**: T034, T035는 deploy workflow 세부 구현과 병렬로 문서/모델을 보강할 수 있다.
- **US3**: T044, T045는 `infra/docs/secrets.md` 보강과 병렬로 진행 가능하다.

---

## Parallel Example: User Story 1

```bash
Task: "T022 [P] [US1] Document PR validation failure triage in infra/docs/operations.md"
Task: "T023 [P] [US1] Document PR verification steps in specs/009-github-actions-deploy/quickstart.md"
```

## Parallel Example: User Story 2

```bash
Task: "T034 [P] [US2] Document Argo CD GitOps handoff without direct cluster apply in infra/docs/operations.md"
Task: "T035 [P] [US2] Document image release fields and same-SHA frontend/backend release rule in specs/009-github-actions-deploy/data-model.md"
```

## Parallel Example: User Story 3

```bash
Task: "T044 [P] [US3] Update operations recovery point names in specs/009-github-actions-deploy/contracts/operations-contract.md"
Task: "T045 [P] [US3] Mark 010 test and quality check expansion points in infra/docs/operations.md"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 so PRs can be checked without production impact.
3. Verify US1 independently by opening or updating a PR.

### Incremental Delivery

1. Add US2 only after PR checks are stable because US2 mutates ECR and GitOps state.
2. Add US3 documentation before treating the deployment path as operationally ready.
3. Run Final Phase verification and update quickstart with observed results.

### 010 Expansion Path

1. Keep 009 workflow job names stable for branch protection.
2. Insert frontend/backend/API tests into `App and image build` in 010 after test scope and dependencies are approved.
3. Promote new test checks into branch protection only after 010 defines reliable commands and ownership.
