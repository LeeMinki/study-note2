# Implementation Plan: Test and Quality Checks

**Branch**: `010-test-quality-checks` | **Date**: 2026-04-17 | **Spec**: [spec.md](/home/hyerin/speckit/study-note2/specs/010-test-quality-checks/spec.md)
**Input**: Feature specification from `/specs/010-test-quality-checks/spec.md`

## Summary

Study Note의 현재 배포 가능 상태 위에 MVP 수준의 테스트와 품질 게이트를 도입한다. 첫 단계는 과한 테스트 체계를 피하고, 기존 009 `PR Checks` workflow를 확장해 build와 test를 우선 required status checks로 연결할 수 있게 만드는 것이다. 백엔드는 인증, 보호 라우트, JSON envelope, local JSON persistence를 먼저 검증하고, 프론트엔드는 최근 회귀가 발생한 API URL 조합, 이미지 업로드 인증 헤더, Markdown 렌더링 같은 서비스/유틸 동작을 우선 검증한다. lint와 format은 구조상 분리하되 새 도구 설치가 필요하면 사용자 승인 후 required check로 승격한다. E2E, 성능 테스트, 고급 보안 스캔, 강제 coverage threshold는 이번 범위 밖이다.

## Technical Context

**Language/Version**: JavaScript, Node.js 22, React SPA with Vite, Express backend
**Primary Dependencies**: Existing frontend/backend npm dependencies only for initial plan; candidate test/lint dependencies require user approval before installation
**Storage**: Backend-owned local JSON files (`backend/data.json`, `backend/users.json`, uploads directory); tests must isolate or restore local file state
**Testing**: MVP baseline should prefer Node.js built-in test runner where practical; any Vitest/Jest/Supertest/ESLint/Prettier adoption requires user approval
**Target Platform**: WSL Ubuntu/Linux local development and GitHub Actions Ubuntu runners
**Project Type**: Web monorepo with separated `frontend/`, `backend/`, `infra/`, and `.github/workflows/`
**Performance Goals**: Local MVP quality checks should finish within 10 minutes; PR quality checks should remain within the existing 15-minute job budget where possible
**Constraints**: No production deploy from PR checks; no new package install without approval; no broad E2E framework in this spec; no strict coverage enforcement
**Scale/Scope**: Single-user MVP app, one frontend package, one backend package, existing AWS/k3s/Argo CD deployment path, existing two-workflow CI/CD structure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass. The feature preserves the `/frontend` and `/backend` monorepo boundary. Frontend tests must validate frontend services/utilities and must not import backend source; backend tests remain inside backend ownership.
- Pass. No backend product endpoint is planned. Backend tests will verify the existing JSON envelope `{ success, data, error }` on success and error paths.
- Pass. Storage ownership remains backend-owned. Any persistence test must isolate local JSON files through backend repository/service boundaries and must not move persistence to frontend.
- Pass. New identifiers and file names will use English naming. Any code comments added during implementation must be Korean.
- Pass with checkpoint. New test/lint/format packages are not assumed. If planning or implementation chooses a package, work must pause for user approval before installation.
- Pass. No new end-user UX is introduced. Quality feedback is limited to developer, reviewer, and operations workflows.
- Pass. The implementation will be split into small slices: backend tests, frontend tests, workflow wiring, required checks docs, and failure triage docs.

## Project Structure

### Documentation (this feature)

```text
specs/010-test-quality-checks/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── quality-gate-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
├── tests/
│   ├── auth.test.js
│   ├── notes.test.js
│   └── persistence.test.js
└── package.json

frontend/
├── src/
│   ├── services/
│   └── utils/
├── tests/
│   ├── apiBase.test.js
│   ├── imagesApi.test.js
│   └── renderMarkdown.test.js
└── package.json

.github/
└── workflows/
    └── pr-checks.yml

infra/
└── docs/
    └── operations.md
```

**Structure Decision**: Keep the existing monorepo shape. Add small package-local `tests/` directories under `backend/` and `frontend/`. Extend the existing `.github/workflows/pr-checks.yml` instead of adding a separate workflow unless implementation discovers a hard separation need.

## Phase 0 Research Output

Research decisions are recorded in [research.md](/home/hyerin/speckit/study-note2/specs/010-test-quality-checks/research.md). Key outcomes:

- Start with MVP tests that can run without a large framework.
- Prioritize backend tests for auth/protected route/envelope/persistence regressions.
- Prioritize frontend tests for pure service and renderer behavior that recently regressed.
- Required status checks start with build and test. lint/format are staged until tooling is approved and stable.
- Reuse 009 `PR Checks`; do not alter `Deploy Main` for PR quality gates.
- Coverage may be measured later but does not block merge in this spec.

## Phase 1 Design Output

### Frontend 테스트 전략

- Scope first: service/util functions with high regression value.
- Initial target areas:
  - API base URL normalization for same-origin deployment and local development.
  - Image upload request behavior, especially Authorization header propagation.
  - Markdown rendering for headings, links, images, inline code, and fenced code blocks.
- Out of first scope:
  - Full browser E2E.
  - Component interaction tests that require DOM test tooling unless user approves the required dependency.
  - Visual regression testing.
- Dependency policy:
  - Prefer Node built-in test runner for pure modules if feasible.
  - If a frontend test runner such as Vitest is needed, pause for user approval before installing.

### Backend 테스트 전략

- Scope first: backend-owned behavior and contracts.
- Initial target areas:
  - Register/login success and failure paths.
  - Protected note/image route authentication failures.
  - JSON envelope shape for success and error responses.
  - Local JSON persistence behavior including empty file and mounted-file fallback cases.
- Test data isolation:
  - Tests must not permanently modify committed `backend/data.json` or `backend/users.json`.
  - If code needs configurable data paths for tests, keep that inside backend repository helpers and preserve production defaults.
- Dependency policy:
  - Prefer Node built-in test runner and built-in `fetch` where practical.
  - If HTTP test helpers are needed, pause for user approval before adding a package.

### lint / format / build / test 역할 분리

| Check type | MVP role | Required now? | Notes |
|------------|----------|---------------|-------|
| build | Confirms frontend/backend production readiness and current Docker sanity path | Yes | Already present in `App and image build`; keep required |
| test | Confirms targeted regressions are caught before merge | Yes | Add to existing PR app job or a clearly named test job |
| lint | Catches style/static issues after tooling is approved | Not initially | Include structure/docs, but do not install or require without approval |
| format | Catches formatting drift after tooling is approved | Not initially | Terraform fmt already exists; JS formatter requires approval if new tool is needed |
| manifest sanity | Confirms Kubernetes render still works | Yes, existing | Keep existing required check from 009 |

### GitHub Actions workflow 반영 방식

- Reuse `.github/workflows/pr-checks.yml`.
- Keep PR checks read-only and production-safe.
- Add test execution after dependency install and before build/image build in the existing `App and image build` job, or split into a stable `App tests` job if required status clarity is better during implementation.
- Do not add AWS OIDC, ECR push, GitOps commit, or cluster mutation to PR validation.
- Leave `.github/workflows/deploy-main.yml` responsible only for main merge image publish and GitOps update.

### required status checks로 연결할 항목

Initial required checks:

- `Terraform fmt and validate`
- `App and image build`
- `Kubernetes manifest sanity`
- Test signal option selected during implementation:
  - Preferred if separate job: `App tests`
  - Acceptable if inside existing job: keep `App and image build` required and make tests fail that job

Staged checks:

- JavaScript lint check after tool approval and stabilization.
- JavaScript format check after tool approval and stabilization.
- Coverage reporting after test tooling is stable, without threshold enforcement.

### 현재 프로젝트 규모에 맞는 최소 품질 게이트

The MVP gate is intentionally small:

1. Existing Terraform and manifest sanity checks remain.
2. Existing frontend/backend build and Docker sanity remain.
3. Add targeted backend tests for highest-risk server behavior.
4. Add targeted frontend utility/service tests for recent regressions.
5. Document local commands and failure triage.

This avoids a large E2E stack, strict coverage policy, and complex test infrastructure.

### 확장 구조

- E2E can be added later as a separate spec after the MVP unit/integration checks are stable.
- Coverage can be collected later and eventually used as a trend signal before becoming a threshold.
- Lint/format can become required checks after user-approved tooling is installed and false positives are low.
- Production smoke checks can be added later and must be separated from PR checks to avoid production mutation from PRs.

## Post-Design Constitution Check

- Pass. Frontend/backend boundaries remain separated; tests are package-local and cross-boundary behavior is handled through HTTP-level behavior or independent package checks.
- Pass. Backend JSON envelope validation is explicitly part of backend tests.
- Pass. Storage remains backend-owned and local JSON-based; test isolation must not introduce a new database.
- Pass. Dependency approval remains a checkpoint for all new test/lint/format packages.
- Pass. No user-facing UX flow is changed.
- Pass. 009 workflow separation is preserved: PR checks validate, main workflow deploys.

## Complexity Tracking

No constitution violations require justification.
