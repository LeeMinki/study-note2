# Tasks: Note Groups

**Input**: Design documents from `/specs/016-note-groups/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/groups-api-contract.md, quickstart.md

**Tests**: MVP regression tests are included because the plan requires account-isolation, group-delete, note assignment, and combined-filter verification.

**Organization**: 사용자 지정 흐름을 따른다: 데이터 모델 및 DB 스키마 → 백엔드 API → 노트-그룹 연결 → 프론트엔드 그룹 UI → 필터/검색 통합 → 접근 제어 및 회귀 검증 → 문서화. Tasks remain grouped by user story for independent review.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the 016 feature surface without changing runtime behavior.

- [ ] T001 Review 016 plan/data model/API contract and record implementation assumptions in `specs/016-note-groups/tasks.md`
- [ ] T002 [P] Confirm no new dependency is needed and do not edit `frontend/package.json` or `backend/package.json`
- [ ] T003 [P] Inspect existing note/auth test helper patterns in `backend/tests/helpers/testData.js`

---

## Phase 2: Foundational (Data Model and DB Schema)

**Purpose**: Shared backend data shape that blocks all group stories.

**CRITICAL**: Complete this phase before user story implementation.

- [ ] T004 Add idempotent `groups` table, indexes, and guarded `notes.group_id` migration in `backend/src/db/index.js`
- [ ] T005 [P] Create Group domain model with name normalization, max length 40, id generation, and validation in `backend/src/models/group.js`
- [ ] T006 Update Note domain model to parse nullable `groupId` on create/update in `backend/src/models/note.js`
- [ ] T007 Update note row mapping and insert/update SQL to include nullable `group_id` in `backend/src/repositories/dbNoteRepository.js`
- [ ] T008 [P] Add backend DB persistence tests for groups schema and existing notes defaulting to `groupId: null` in `backend/tests/groups.test.js`
- [ ] T009 Run backend tests for foundational DB/model changes with `npm test` from `backend/`

**Checkpoint**: DB can initialize on new and existing SQLite files; existing notes remain group 없음.

---

## Phase 3: User Story 1 - 그룹을 만들고 관리한다 (Priority: P1) MVP

**Goal**: 로그인한 사용자가 본인 계정 범위 안에서 그룹을 생성, 조회, 이름 수정, 삭제할 수 있다.

**Independent Test**: 새 그룹을 생성하고 목록에서 확인한 뒤 이름을 수정하고 삭제할 수 있으며, 삭제된 그룹의 노트는 삭제되지 않는다.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add group create/list/update/delete service tests including duplicate name rejection in `backend/tests/groups.test.js`
- [ ] T011 [P] [US1] Add group API envelope and auth tests for `/api/groups` in `backend/tests/groupsRoutes.test.js`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement group row mapping and CRUD repository functions in `backend/src/repositories/dbGroupRepository.js`
- [ ] T013 [US1] Implement group create/list/rename/delete business rules in `backend/src/services/groupsService.js`
- [ ] T014 [US1] Implement group HTTP handlers and status mapping in `backend/src/controllers/groupsController.js`
- [ ] T015 [US1] Add authenticated group routes in `backend/src/routes/groupsRoutes.js`
- [ ] T016 [US1] Mount `/api/groups` behind `requireAuth` in `backend/src/app.js`
- [ ] T017 [US1] Implement group deletion transaction that unassigns related notes before deleting the group in `backend/src/repositories/dbGroupRepository.js`
- [ ] T018 [US1] Verify User Story 1 with backend tests and manual `GET/POST/PATCH/DELETE /api/groups` checks using `specs/016-note-groups/quickstart.md`

**Checkpoint**: Group CRUD is fully functional and account-scoped through backend APIs.

---

## Phase 4: User Story 2 - 노트를 그룹에 넣고 변경한다 (Priority: P2)

**Goal**: 사용자가 노트 생성/수정 시 그룹을 선택, 변경, 해제할 수 있다.

**Independent Test**: 노트 작성 시 그룹을 선택해 저장하고, 기존 노트의 그룹을 다른 그룹이나 그룹 없음으로 변경할 수 있다.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add note create/update tests for valid groupId, null groupId, and cross-account group rejection in `backend/tests/notesGroups.test.js`
- [ ] T020 [P] [US2] Add frontend note API body tests for `groupId` create/update payloads in `frontend/tests/groupsApi.test.js`

### Implementation for User Story 2

- [ ] T021 [US2] Add group ownership validation helper for note writes in `backend/src/services/notesService.js`
- [ ] T022 [US2] Persist `groupId` during note create/update in `backend/src/services/notesService.js`
- [ ] T023 [US2] Map group-related validation errors to envelope responses in `backend/src/controllers/notesController.js`
- [ ] T024 [US2] Extend `createNote` and `updateNote` client calls to pass `groupId` in `frontend/src/services/notesApi.js`
- [ ] T025 [P] [US2] Create reusable group selector component in `frontend/src/components/GroupSelect.jsx`
- [ ] T026 [US2] Add `groupId` state, draft persistence compatibility, and group selector to note creation in `frontend/src/components/NoteComposer.jsx`
- [ ] T027 [US2] Add `groupId` edit state, group display, and group selector to inline editing in `frontend/src/components/NoteCard.jsx`
- [ ] T028 [US2] Pass groups into composer/cards from `frontend/src/App.jsx`
- [ ] T029 [US2] Verify User Story 2 manually using quickstart S3 and S4 in `specs/016-note-groups/quickstart.md`

**Checkpoint**: Notes can move between group 없음 and exactly one group without changing tags.

---

## Phase 5: User Story 3 - 그룹별로 노트를 모아본다 (Priority: P3)

**Goal**: 사용자가 그룹, 그룹 없음, 검색어, 태그를 함께 적용해 노트를 최신순으로 모아볼 수 있다.

**Independent Test**: 여러 그룹과 그룹 없는 노트를 만든 뒤 그룹 필터, 태그 필터, 검색어를 동시에 적용해 AND 조건 결과만 표시되는지 확인한다.

### Tests for User Story 3

- [ ] T030 [P] [US3] Add backend note query tests for `groupId`, `group=none`, and `search+tag+group` AND behavior in `backend/tests/notesGroups.test.js`
- [ ] T031 [P] [US3] Add frontend notes query tests for `activeGroupFilter` values `all`, `none`, and group id in `frontend/tests/groupsApi.test.js`

### Implementation for User Story 3

- [ ] T032 [US3] Extend note repository filters for `groupId`, `group=none`, mutual exclusion, and latest-first order in `backend/src/repositories/dbNoteRepository.js`
- [ ] T033 [US3] Validate group filter ownership before note listing in `backend/src/services/notesService.js`
- [ ] T034 [US3] Extend `fetchNotes` query parameter builder for group filters in `frontend/src/services/notesApi.js`
- [ ] T035 [P] [US3] Create group filter UI with `전체`, `그룹 없음`, and group options in `frontend/src/components/GroupFilterBar.jsx`
- [ ] T036 [P] [US3] Create inline group management UI for create/rename/delete in `frontend/src/components/GroupManager.jsx`
- [ ] T037 [US3] Add `groupsApi` client functions for group CRUD in `frontend/src/services/groupsApi.js`
- [ ] T038 [US3] Integrate `groups`, `activeGroupFilter`, group CRUD handlers, and reload sequencing in `frontend/src/App.jsx`
- [ ] T039 [US3] Update clear-filter behavior to reset search, tag, and group filter together in `frontend/src/App.jsx`
- [ ] T040 [US3] Update empty-state copy for combined group/search/tag results in `frontend/src/components/NoteList.jsx`
- [ ] T041 [US3] Add group UI styles using existing tokens in `frontend/src/styles/app.css`
- [ ] T042 [US3] Verify User Story 3 manually using quickstart S5, S6, and S7 in `specs/016-note-groups/quickstart.md`

**Checkpoint**: Group filtering works with existing search and tag filters without losing active filter state.

---

## Phase 6: Access Control and Regression Verification

**Purpose**: Verify account boundaries, existing auth/SSO behavior, and no regression in existing note flows.

- [ ] T043 [P] Add backend cross-account group access tests for list/update/delete/filter/assignment in `backend/tests/groups.test.js`
- [ ] T044 [P] Add backend response envelope assertions for representative group success/error paths in `backend/tests/responseEnvelope.test.js`
- [ ] T045 Run full backend test suite with `npm test` from `backend/`
- [ ] T046 Run full frontend test suite with `npm test` from `frontend/`
- [ ] T047 Run frontend production build with `npm run build` from `frontend/`
- [ ] T048 Run backend startup sanity command from `backend/` with `JWT_SECRET` set
- [ ] T049 Manually verify existing login, Google SSO return handling, note CRUD, tag filtering, search, image rendering, and Ctrl/Cmd + Enter save flows using `specs/016-note-groups/quickstart.md`

---

## Phase 7: Documentation and Polish

**Purpose**: Keep project documentation and operator guidance aligned with 016.

- [ ] T050 [P] Update feature status and implemented range in `README.md`
- [ ] T051 [P] Update active technology/recent changes notes in `AGENTS.md`
- [ ] T052 [P] Update Claude handoff notes for 016 in `CLAUDE.md`
- [ ] T053 Update DB migration and smoke-check notes if needed in `infra/docs/operations.md`
- [ ] T054 Re-check generated docs and contracts for drift against implementation in `specs/016-note-groups/`
- [ ] T055 Run `git diff --check` from repository root

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1; blocks all user stories.
- **Phase 3 US1**: Depends on Phase 2.
- **Phase 4 US2**: Depends on Phase 3 because notes need real groups to assign.
- **Phase 5 US3**: Depends on Phase 4 because filtering needs note-group assignment.
- **Phase 6 Verification**: Depends on desired user stories being complete.
- **Phase 7 Documentation**: Can start after behavior stabilizes; final pass depends on verification.

### User Story Dependencies

- **US1 (P1)**: First MVP slice; can be demoed with group CRUD only.
- **US2 (P2)**: Builds on US1 by assigning notes to groups.
- **US3 (P3)**: Builds on US1/US2 by filtering notes by group together with search/tag.

### Within Each User Story

- Tests before implementation where listed.
- Models/repositories before services.
- Services before controllers/routes.
- API clients before UI integration.
- UI component files before `App.jsx` integration when possible.
- Validate each checkpoint before moving to the next phase.

## Parallel Opportunities

- T003 can run independently while reviewing setup.
- T005 and T008 can run in parallel after T004 shape is known.
- T010 and T011 can run in parallel for US1 tests.
- T012 can run while T014/T015 file scaffolding is prepared, but T013 depends on repository functions.
- T019 and T020 can run in parallel for US2 backend/frontend tests.
- T025 can run in parallel with backend note service work after the group object contract is stable.
- T030 and T031 can run in parallel for US3 query behavior.
- T035 and T036 can run in parallel because they create separate frontend components.
- T043 and T044 can run in parallel during verification.
- T050, T051, and T052 can run in parallel during documentation.

## Parallel Example: User Story 1

```text
Task: "Add group create/list/update/delete service tests including duplicate name rejection in backend/tests/groups.test.js"
Task: "Add group API envelope and auth tests for /api/groups in backend/tests/groupsRoutes.test.js"
Task: "Implement group row mapping and CRUD repository functions in backend/src/repositories/dbGroupRepository.js"
```

## Parallel Example: User Story 2

```text
Task: "Add note create/update tests for valid groupId, null groupId, and cross-account group rejection in backend/tests/notesGroups.test.js"
Task: "Add frontend note API body tests for groupId create/update payloads in frontend/tests/groupsApi.test.js"
Task: "Create reusable group selector component in frontend/src/components/GroupSelect.jsx"
```

## Parallel Example: User Story 3

```text
Task: "Add backend note query tests for groupId, group=none, and search+tag+group AND behavior in backend/tests/notesGroups.test.js"
Task: "Add frontend notes query tests for activeGroupFilter values all, none, and group id in frontend/tests/groupsApi.test.js"
Task: "Create group filter UI with 전체, 그룹 없음, and group options in frontend/src/components/GroupFilterBar.jsx"
Task: "Create inline group management UI for create/rename/delete in frontend/src/components/GroupManager.jsx"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) and validate group CRUD independently.
3. Stop for review if desired; this is the smallest useful group-management increment.

### Incremental Delivery

1. US1: Group CRUD and account-scoped management.
2. US2: Note group assignment and group 없음 handling.
3. US3: Group filtering combined with search/tag.
4. Verification and docs after behavior is stable.

### Review Boundaries

- Backend DB/model/repository work should be reviewed before API/UI work.
- Frontend group UI should be reviewed after API contracts are stable.
- Documentation should be reviewed after test and quickstart verification.

## Notes

- No new dependency installation is planned.
- Frontend must use HTTP APIs only.
- Backend must keep all JSON responses in `{ success, data, error }` envelope form.
- Group UI should stay inline/page-embedded and avoid modal-first flows.
- Existing tags remain independent from groups.
