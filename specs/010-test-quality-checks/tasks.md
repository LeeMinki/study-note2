# Tasks: Test and Quality Checks

**Input**: Design documents from `/specs/010-test-quality-checks/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/quality-gate-contract.md`, `quickstart.md`

**Tests**: This feature explicitly introduces MVP automated tests. Test tasks are included and should be written before wiring them into required PR checks.

**Organization**: Tasks are grouped by user story so MVP tests, PR quality gates, and required-check documentation can be implemented and reviewed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks
- **[Story]**: Maps to the user story from `spec.md`
- Every task includes concrete file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the minimal test tool strategy and create reviewable test locations without installing packages automatically.

- [X] T001 Review existing frontend scripts and dependency constraints in `frontend/package.json`
- [X] T002 Review existing backend scripts and dependency constraints in `backend/package.json`
- [X] T003 Review existing PR workflow insertion points in `.github/workflows/pr-checks.yml`
- [X] T004 [P] Create backend test directory structure in `backend/tests/`
- [X] T005 [P] Create frontend test directory structure in `frontend/tests/`
- [X] T006 Record dependency approval checkpoint for any non-built-in test/lint/format tooling in `specs/010-test-quality-checks/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared test execution conventions and safe test isolation before story-specific tests are added.

**CRITICAL**: No user story test should be wired into PR required checks before this phase is complete.

- [X] T007 Define MVP test command conventions for backend and frontend in `backend/package.json` and `frontend/package.json`
- [X] T008 Define backend test data isolation approach for local JSON files in `backend/tests/helpers/testData.js`
- [X] T009 Define frontend test environment helpers for localStorage, fetch, and environment-like API base inputs in `frontend/tests/helpers/testEnvironment.js`
- [X] T010 Document selected test tool/structure decision and rejected alternatives in `specs/010-test-quality-checks/research.md`
- [X] T011 Update local quickstart commands for test execution in `specs/010-test-quality-checks/quickstart.md`

**Checkpoint**: Test structure and local execution conventions are ready; user story tests can now be implemented.

---

## Phase 3: User Story 1 - 최소 자동 테스트로 회귀 방지 (Priority: P1) MVP

**Goal**: Add small, high-value frontend and backend automated tests that catch the recent regression classes before manual production testing.

**Independent Test**: Run backend and frontend test commands locally and verify failures identify auth/protected route/envelope/persistence or API URL/image upload/Markdown behavior.

### Tests for User Story 1

Backend tests are the first implementation priority for this story. Complete T012-T015 before starting the frontend test tasks unless a dependency approval checkpoint blocks backend progress.

- [X] T012 [P] [US1] Add backend auth success/failure tests in `backend/tests/auth.test.js`
- [X] T013 [P] [US1] Add backend protected route unauthenticated tests in `backend/tests/protectedRoutes.test.js`
- [X] T014 [P] [US1] Add backend JSON envelope tests for representative success/error responses in `backend/tests/responseEnvelope.test.js`
- [X] T015 [P] [US1] Add backend local JSON persistence empty-file and write-fallback tests in `backend/tests/persistence.test.js`
- [X] T016 [P] [US1] Add frontend API base URL normalization tests in `frontend/tests/apiBase.test.js`
- [X] T017 [P] [US1] Add frontend image upload Authorization header tests in `frontend/tests/imagesApi.test.js`
- [X] T018 [P] [US1] Add frontend Markdown rendering tests for images, inline code, and fenced code blocks in `frontend/tests/renderMarkdown.test.js`

### Implementation for User Story 1

- [X] T019 [US1] Ensure backend test command runs all backend MVP tests in `backend/package.json`
- [X] T020 [US1] Ensure frontend test command runs all frontend MVP tests in `frontend/package.json`
- [X] T021 [US1] Verify backend tests do not permanently modify `backend/data.json` or `backend/users.json`
- [X] T022 [US1] Verify frontend tests do not import backend source files from `frontend/tests/`
- [X] T023 [US1] Run local backend test command from `backend/` and update `specs/010-test-quality-checks/quickstart.md` with observed command if changed
- [X] T024 [US1] Run local frontend test command from `frontend/` and update `specs/010-test-quality-checks/quickstart.md` with observed command if changed

**Checkpoint**: MVP automated tests exist and are independently runnable without requiring production deployment.

---

## Phase 4: User Story 2 - PR 단계 품질 게이트 (Priority: P2)

**Goal**: Run build and test checks automatically in GitHub PRs while keeping PR validation production-safe.

**Independent Test**: Open or update a PR and verify selected test checks run before merge, fail the PR on test failure, and do not publish images or mutate GitOps state.

### Tests for User Story 2

- [X] T025 [US2] Add backend test execution step to `.github/workflows/pr-checks.yml`
- [X] T026 [US2] Add frontend test execution step to `.github/workflows/pr-checks.yml`
- [X] T027 [US2] Verify test steps run before frontend/backend build and Docker image sanity in `.github/workflows/pr-checks.yml`

### Implementation for User Story 2

- [X] T028 [US2] Decide whether tests stay inside `App and image build` or split into `App tests` and document the decision in `specs/010-test-quality-checks/contracts/quality-gate-contract.md`
- [X] T029 [US2] Keep PR workflow permissions read-only and verify no AWS OIDC/ECR/GitOps mutation is added in `.github/workflows/pr-checks.yml`
- [X] T030 [US2] Document lint and format as staged checks that require approval before new tooling installation in `specs/010-test-quality-checks/quickstart.md`
- [X] T031 [US2] Update `AGENTS.md` commands to include the finalized frontend/backend test commands
- [X] T032 [US2] Run local workflow-equivalent commands for `backend/package.json`, `frontend/package.json`, `backend/src/app.js`, and `frontend/src/`

**Checkpoint**: PR quality gate runs MVP tests and build checks without conflicting with 009 main deployment.

---

## Phase 5: User Story 3 - required status checks 운영 기준 정리 (Priority: P3)

**Goal**: Document required status check names, responsibilities, and failure triage so branch protection can be configured consistently.

**Independent Test**: A maintainer can read the docs and identify which GitHub checks should be required and how to respond to each failure category.

### Tests for User Story 3

- [X] T033 [US3] Validate that every required check name in `specs/010-test-quality-checks/contracts/quality-gate-contract.md` matches `.github/workflows/pr-checks.yml`
- [X] T034 [US3] Validate that failure categories in `specs/010-test-quality-checks/contracts/quality-gate-contract.md` are covered by `specs/010-test-quality-checks/quickstart.md`

### Implementation for User Story 3

- [X] T035 [US3] Document required status checks and branch protection mapping in `infra/docs/operations.md`
- [X] T036 [US3] Document local developer execution guide in `README.md`
- [X] T037 [US3] Document failure triage for backend test, frontend test, build, manifest, terraform, lint, and format in `infra/docs/operations.md`
- [X] T038 [US3] Document future extension points for E2E, coverage threshold, lint, format, and production smoke checks in `specs/010-test-quality-checks/quickstart.md`
- [X] T039 [US3] Confirm coverage remains non-blocking in `specs/010-test-quality-checks/contracts/quality-gate-contract.md`

**Checkpoint**: Required checks and failure handling are documented enough for branch protection and PR review.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks across documentation, scripts, and CI configuration.

- [X] T040 Run `git diff --check` from repository root for `specs/010-test-quality-checks/tasks.md`
- [X] T041 Run backend test command in `backend/`
- [X] T042 Run frontend test command in `frontend/`
- [X] T043 Run frontend build command in `frontend/`
- [X] T044 Run backend startup sanity command in `backend/`
- [X] T045 Verify `.github/workflows/pr-checks.yml` still has no production deploy, ECR push, or GitOps commit
- [X] T046 Verify no new package was installed without explicit user approval by checking `frontend/package.json`, `frontend/package-lock.json`, `backend/package.json`, and `backend/package-lock.json`
- [X] T047 Update `specs/010-test-quality-checks/quickstart.md` with final validation results
- [X] T048 Re-check `AGENTS.md` for current commands and dependency policy consistency

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user story work.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP scope.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because PR checks need real test commands.
- **User Story 3 (Phase 5)**: Can begin after User Story 2 decisions are stable; docs must match actual check names.
- **Final Phase**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: First deliverable; creates meaningful automated tests.
- **US1 backend-first note**: Complete backend regression tests T012-T015 before frontend tests T016-T018 to preserve the clarified backend-first priority.
- **US2 (P2)**: Requires US1 test commands before workflow wiring.
- **US3 (P3)**: Requires final workflow/check naming from US2.

### Within Each User Story

- Write test files before wiring them into PR required checks.
- Stop for user approval before installing any new test/lint/format dependency.
- Keep backend and frontend test changes in separate files where possible.
- Update documentation after commands and check names are final.

---

## Parallel Opportunities

- T004 and T005 can run in parallel because they create separate package test directories.
- T008 and T009 can run in parallel because backend and frontend helpers are separate.
- T012 through T018 can run in parallel after foundational helpers are ready because they touch separate test files.
- T025 and T026 can be prepared in parallel only if they do not edit the same workflow section simultaneously; otherwise sequence them to avoid conflicts.
- T035, T036, and T038 can run in parallel after check names are finalized because they update different documents.

---

## Parallel Example: User Story 1

```bash
Task: "T012 [P] [US1] Add backend auth success/failure tests in backend/tests/auth.test.js"
Task: "T016 [P] [US1] Add frontend API base URL normalization tests in frontend/tests/apiBase.test.js"
Task: "T018 [P] [US1] Add frontend Markdown rendering tests for images, inline code, and fenced code blocks in frontend/tests/renderMarkdown.test.js"
```

## Parallel Example: User Story 3

```bash
Task: "T035 [US3] Document required status checks and branch protection mapping in infra/docs/operations.md"
Task: "T036 [US3] Document local developer execution guide in README.md"
Task: "T038 [US3] Document future extension points for E2E, coverage threshold, lint, format, and production smoke checks in specs/010-test-quality-checks/quickstart.md"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1 to create meaningful backend/frontend tests.
3. Stop and validate local test commands before modifying PR checks.

### Incremental Delivery

1. Add MVP tests and scripts.
2. Wire tests into PR checks.
3. Document required checks and failure triage.
4. Run final local and workflow-equivalent validation.

### Minimal Quality Gate

The first required quality gate should be:

- Existing `Terraform fmt and validate`
- Existing `Kubernetes manifest sanity`
- Existing `App and image build`
- Test signal through either `App and image build` or a new `App tests` job

Do not add E2E, strict coverage, advanced security scanning, or unapproved lint/format tooling in this spec.
