# Feature Specification: Test and Quality Checks

**Feature Branch**: `010-test-quality-checks`
**Created**: 2026-04-17
**Status**: Draft
**Input**: User description: "Study Note 프로젝트에 테스트와 품질 체크를 도입하고 싶다. 현재 배포 가능한 상태에서 한 단계 나아가, 코드 변경 시 기본 품질을 자동으로 검증할 수 있어야 한다. GitHub PR 단계에서 실패하는 변경을 미리 잡을 수 있어야 한다. required status checks에 연결할 수 있는 구조를 만든다. 테스트 도입 범위는 MVP 수준으로 시작하고, 과한 테스트 체계는 피한다."

## Clarifications

### Session 2026-04-17

- Q: What is the initial test scope? → A: MVP 수준으로만 도입한다.
- Q: Which frontend/backend tests are prioritized first? → A: 백엔드 인증·보호 라우트·JSON envelope·local JSON persistence 테스트를 먼저 두고, 프론트엔드는 API URL 조합, 이미지 업로드 인증 헤더, Markdown 렌더링처럼 최근 회귀가 발생한 유틸/서비스 동작을 우선 검증한다.
- Q: Which checks become required status checks first and how is coverage handled? → A: PR required checks는 build와 test를 우선 강제한다. lint와 format은 체크 구조에 포함하되, 새 도구나 패키지가 필요하면 사용자 승인 후 안정화된 뒤 required로 승격한다. coverage는 측정할 수 있어도 이번 단계에서 강제 목표를 두지 않는다.
- Q: Are E2E tests included? → A: E2E 테스트는 이번 범위 밖이다.
- Q: How should GitHub Actions be changed? → A: 009에서 만든 workflow를 최대한 재사용하거나 확장한다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 최소 자동 테스트로 회귀 방지 (Priority: P1)

개발자는 Study Note 코드를 변경한 뒤 최소 자동 테스트를 실행해 인증, 노트 저장, 이미지 업로드, 마크다운 렌더링처럼 최근 문제가 발생했던 핵심 동작이 깨지지 않았는지 확인할 수 있다.

**Why this priority**: 테스트가 전혀 없는 상태에서는 배포 후 수동 확인에서만 회귀가 발견된다. MVP 수준의 자동 테스트라도 반복되는 인증/저장/렌더링 문제를 먼저 잡는 것이 가장 큰 가치다.

**Independent Test**: 최소 테스트만 실행해도 프론트엔드와 백엔드 중 필요한 핵심 영역에서 회귀 여부가 pass/fail로 드러나야 한다.

**Acceptance Scenarios**:

1. **Given** 개발자가 로컬에서 품질 체크를 실행하는 상태, **When** 최소 자동 테스트가 실행되면, **Then** 핵심 기능의 성공/실패 결과가 명확히 표시된다.
2. **Given** 인증, 노트 저장, 이미지 업로드, 마크다운 렌더링 중 하나가 깨진 상태, **When** 최소 자동 테스트가 실행되면, **Then** 해당 실패 영역을 식별할 수 있어야 한다.
3. **Given** 아직 대규모 테스트 체계가 없는 상태, **When** 첫 테스트 범위를 도입하면, **Then** 유지 가능한 작은 테스트 집합으로 시작해야 한다.
4. **Given** 테스트 도입 우선순위를 정하는 상태, **When** 첫 범위를 선택하면, **Then** 백엔드 인증·보호 라우트·JSON envelope·local JSON persistence 검증을 먼저 포함하고 프론트엔드는 최근 회귀가 발생한 API URL 조합, 이미지 업로드 인증 헤더, Markdown 렌더링을 우선 포함한다.

---

### User Story 2 - PR 단계 품질 게이트 (Priority: P2)

리뷰어는 GitHub PR에서 lint, format, build, test 중 핵심 품질 체크가 자동 실행된 결과를 보고 merge 가능 여부를 판단할 수 있다.

**Why this priority**: PR 단계에서 실패하는 변경을 미리 잡아야 main 병합 후 배포 실패나 운영 환경 회귀를 줄일 수 있다.

**Independent Test**: PR을 생성했을 때 required status checks에 연결 가능한 품질 체크 결과가 표시되고, 실패한 변경이 merge 전에 발견되면 독립적으로 가치가 있다.

**Acceptance Scenarios**:

1. **Given** 개발자가 PR을 생성한 상태, **When** 자동 품질 체크가 실행되면, **Then** build와 test는 우선 required check로 확인 가능해야 하고 lint와 format은 체크 구조와 승격 기준이 문서화되어야 한다.
2. **Given** 품질 체크가 실패한 상태, **When** 리뷰어가 PR을 확인하면, **Then** 실패한 체크 이름과 확인해야 할 기준이 명확해야 한다.
3. **Given** PR 검증 단계, **When** 품질 체크가 실행되면, **Then** production 배포나 운영 데이터 변경은 발생하지 않아야 한다.
4. **Given** lint 또는 format 도구 도입에 새 패키지가 필요한 상태, **When** required check 승격을 검토하면, **Then** 사용자 승인 없이 설치하거나 merge 차단 조건으로 강제하지 않아야 한다.

---

### User Story 3 - required status checks 운영 기준 정리 (Priority: P3)

운영자는 어떤 체크를 GitHub required status checks에 연결해야 하는지, 실패 시 개발자가 무엇을 확인해야 하는지 문서로 확인할 수 있다.

**Why this priority**: 테스트와 품질 체크가 추가되어도 branch protection과 연결되지 않으면 merge 품질 게이트로 작동하지 않는다.

**Independent Test**: 문서만 보고도 required checks 이름, 목적, 실패 시 확인 기준을 설정하거나 검토할 수 있어야 한다.

**Acceptance Scenarios**:

1. **Given** branch protection을 설정하는 상태, **When** 운영자가 문서를 확인하면, **Then** required status checks에 연결할 체크 이름과 목적을 알 수 있어야 한다.
2. **Given** 품질 체크가 실패한 상태, **When** 개발자가 운영 문서를 확인하면, **Then** lint, format, build, test 중 어느 영역을 먼저 확인할지 알 수 있어야 한다.
3. **Given** main 병합 후 배포 흐름이 존재하는 상태, **When** 품질 체크 정책을 적용하면, **Then** PR 단계 검증과 main 배포의 책임이 혼동되지 않아야 한다.
4. **Given** 기존 009 GitHub Actions workflow가 있는 상태, **When** 010 품질 체크를 추가하면, **Then** 기존 workflow를 대체하기보다 최대한 재사용하거나 확장해야 한다.

### Edge Cases

- 테스트 대상 초기 데이터가 없을 때도 검증은 자체적으로 준비하거나 명확한 사전 조건을 안내해야 한다.
- 인증이 필요한 검증에서 로그인 정보가 유효하지 않으면 사용자 기능 실패와 테스트 준비 실패를 구분해야 한다.
- lint 또는 format 실패는 기능 실패와 구분되어야 하며, 개발자가 수정 위치를 빠르게 찾을 수 있어야 한다.
- build는 통과하지만 테스트가 실패하는 경우와 테스트는 통과하지만 build가 실패하는 경우를 각각 분리해 확인할 수 있어야 한다.
- GitHub PR에서 실행되는 품질 체크는 운영 배포나 운영 데이터 변경을 유발하지 않아야 한다.
- coverage 값이 산출되더라도 이번 MVP에서는 merge 실패 조건으로 사용하지 않아야 한다.
- E2E가 필요한 회귀가 발견되더라도 이번 spec에서는 후속 확장 후보로 기록하고 MVP required check에 포함하지 않아야 한다.
- 외부 배포 환경에 의존하는 smoke check가 추가될 경우, 일시적 네트워크 실패와 실제 기능 실패를 구분해야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST keep the initial test scope at MVP level and avoid a broad test platform in this phase.
- **FR-002**: System MUST prioritize backend tests first for authentication, protected actions, JSON response envelopes, and local JSON persistence behavior.
- **FR-003**: System MUST prioritize frontend tests for API URL composition, authenticated image upload request behavior, and Markdown rendering behavior before broader UI testing.
- **FR-004**: System MUST define which test types are introduced first and explicitly leave E2E tests outside the MVP scope.
- **FR-005**: System MUST define a quality-check structure for lint, format, build, and test, including which checks are required for PR review and which are staged for later enforcement.
- **FR-006**: System MUST require build and test checks first for PR merge readiness.
- **FR-007**: System MUST treat lint and format as part of the target quality-check structure, but MUST NOT require new lint/format tooling before user approval and stabilization.
- **FR-008**: System MUST allow coverage measurement if practical, but MUST NOT enforce a coverage target in this phase.
- **FR-009**: System MUST run the selected core quality checks automatically for GitHub PRs before merge.
- **FR-010**: System MUST reuse or extend the GitHub Actions workflows introduced in 009 where practical instead of creating an unnecessarily separate CI structure.
- **FR-011**: System MUST keep PR validation separate from production deployment; PR checks must not publish images, mutate GitOps state, or deploy to production.
- **FR-012**: System MUST define required status check names that can be connected to GitHub branch protection.
- **FR-013**: System MUST document how developers run the same quality checks locally in the primary Linux/WSL development environment.
- **FR-014**: System MUST document failure interpretation criteria so developers can distinguish lint, format, build, test, manifest, and environment failures.
- **FR-015**: System MUST introduce at least one meaningful automated test where it reduces current regression risk, rather than only adding build-only checks.
- **FR-016**: System MUST keep E2E testing, performance testing, advanced security scanning, and strict coverage policy outside this MVP scope.
- **FR-017**: System MUST avoid installing or adding new project dependencies until the user explicitly approves them.
- **FR-018**: System SHOULD keep the first quality gate simple enough to be maintained by one developer and understood during PR review.
- **FR-019**: System SHOULD leave extension points for future broader E2E, accessibility, security, coverage, and production smoke checks.

### Constitution Alignment *(mandatory)*

- **CA-001**: The feature preserves the `/frontend` and `/backend` boundary. Frontend validation must not directly import backend source files; cross-boundary behavior is validated through HTTP-level behavior or separately scoped checks.
- **CA-002**: No backend product endpoint is required to be added by this specification. Existing backend responses checked by tests must continue to use `{ success: boolean, data: any, error: string | null }`.
- **CA-003**: New testing, linting, or formatting dependencies may be needed during planning or implementation. Any new package is `NEEDS USER APPROVAL` before installation.
- **CA-004**: This feature does not introduce new user-facing editing UX. Quality feedback belongs in developer, reviewer, and operations workflows and must remain predictable.
- **CA-005**: No application storage model change is required. Backend persistence remains local JSON-based for the current MVP, and tests must not require replacing it with a database.

### Scope Boundaries

- **In Scope**: Minimum frontend and backend test strategy, backend-first test priority, focused frontend service/renderer tests, first test type selection, lint/format/build/test check structure, GitHub PR quality checks, required status check definitions, local execution documentation, failure triage documentation, and 009 workflow reuse or extension.
- **Out of Scope**: Large-scale E2E test adoption, performance testing, advanced security scanning, strict coverage enforcement, multi-environment release policy, and complex test infrastructure.

### Key Entities *(include if feature involves data)*

- **Quality Check**: A named validation step with a clear purpose, pass/fail outcome, and developer-facing failure signal.
- **Required Status Check**: A quality check selected for branch protection and required before PR merge.
- **Test Scope**: The agreed MVP boundary for what behavior is tested now and what remains for future specs.
- **Failure Triage Guide**: Documentation that maps failed checks to likely causes and next inspection steps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least one meaningful automated test is added to the quality gate so the project is no longer build-only before PR merge.
- **SC-002**: PR reviewers can identify pass/fail status for required quality checks directly from the PR page before merge.
- **SC-003**: A developer can run the documented local quality checks and identify the failed category within 10 minutes on the primary WSL Ubuntu environment.
- **SC-004**: Required checks cover at least build readiness and one automated test signal for the changed application code.
- **SC-005**: The MVP quality gate does not require large-scale E2E tests, performance tests, advanced security scans, or strict coverage thresholds.
- **SC-006**: Failed quality checks provide enough signal to classify the failure as lint, format, build, test, manifest, or environment related in 100% of documented failure paths.
- **SC-007**: The first required quality gate can be implemented by extending the existing PR workflow rather than introducing more than one new workflow.

## Assumptions

- The first version should reduce real regression risk without introducing a large test platform.
- Existing GitHub PR checks and main deployment workflows are the baseline to extend, not replace.
- Some useful testing or linting tools may require new dependencies, but those choices are deferred to planning and require explicit user approval before installation.
- Build and test are the first required merge-blocking quality signals; lint and format may become required after tooling is approved and stable.
- Coverage may be collected for visibility, but no coverage threshold blocks merge in this spec.
- The primary local development environment is WSL Ubuntu or Linux shell.
- This feature focuses on developer confidence and merge safety, not new end-user product behavior.
