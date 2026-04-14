# Tasks: Study Note App

**Input**: Design documents from `/specs/001-study-note-app/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Explicit automated test tasks are omitted for now because the current plan defers additional test tooling until dependency approval. Each story includes an independent manual verification target.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Frontend tasks MUST never reference direct imports from backend source files
- Backend tasks that change API behavior MUST include response-envelope validation
- For Study Note, implement backend contracts before frontend integration work

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the monorepo skeleton and establish dependency / execution checkpoints before feature work.

- [ ] T001 Create the monorepo source directories in `backend/` and `frontend/` according to `specs/001-study-note-app/plan.md`
- [ ] T002 Create placeholder runtime entry files in `backend/src/app.js` and `frontend/src/App.jsx`
- [ ] T003 Create the initial persistence file in `backend/data.json` with an empty notes collection
- [ ] T004 Record dependency approval checkpoints in `specs/001-study-note-app/quickstart.md`, `README.md`, or implementation comments before any install commands are run
- [ ] T005 Record the manual startup expectations and approval-first dependency policy in `specs/001-study-note-app/quickstart.md` if implementation details change during setup

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build backend-first foundations that all user stories depend on before any frontend integration.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Implement the API envelope helper in `backend/src/utils/responseEnvelope.js`
- [ ] T007 Implement tag normalization logic in `backend/src/utils/normalizeTags.js`
- [ ] T008 Implement canonical date utilities in `backend/src/utils/dateFormat.js` for sorting and `YYYY. MM. DD. HH:mm` formatting support
- [ ] T009 Implement the note model mapper in `backend/src/models/note.js`
- [ ] T010 Implement safe JSON file read/write helpers with write-then-replace behavior in `backend/src/repositories/fileNoteRepository.js`
- [ ] T011 Implement backend note service methods for create/list/update/delete/filter/search in `backend/src/services/notesService.js`
- [ ] T012 Implement note request handlers in `backend/src/controllers/notesController.js`
- [ ] T013 Implement REST routes for `/api/notes` and `/api/notes/:noteId` in `backend/src/routes/notesRoutes.js`
- [ ] T014 Wire the Express app and notes routes in `backend/src/app.js`
- [ ] T015 Validate that backend list responses are sorted by `createdAt` descending and always return `{ success, data, error }` in `backend/src/services/notesService.js`
- [ ] T016 Add a dependency approval checkpoint for React, Express, Axios, and any Markdown renderer in `specs/001-study-note-app/tasks.md` notes or implementation comments before package installation occurs

**Checkpoint**: Backend API contract, file persistence safety, and shared normalization logic are ready for frontend integration.

---

## Phase 3: User Story 1 - 빠른 노트 기록 (Priority: P1) 🎯 MVP

**Goal**: Users can create, edit, and delete notes through the UI with backend-backed persistence and inline save behavior.

**Independent Test**: Start backend and frontend, create a note, edit it inside its list card, save with `Ctrl+Enter` or `Cmd+Enter`, then delete it and confirm the list updates correctly.

### Implementation for User Story 1

- [ ] T017 [US1] Implement the Axios note API client for create/list/update/delete in `frontend/src/services/notesApi.js`
- [ ] T018 [P] [US1] Implement keyboard save detection for Windows and macOS in `frontend/src/hooks/useKeyboardSave.js`
- [ ] T019 [P] [US1] Implement note timestamp formatting in `frontend/src/utils/formatDisplayDate.js`
- [ ] T020 [P] [US1] Implement note preview extraction in `frontend/src/utils/previewText.js`
- [ ] T021 [US1] Implement the note creation form in `frontend/src/components/NoteComposer.jsx`
- [ ] T022 [US1] Implement the note card with inline edit/delete controls in `frontend/src/components/NoteCard.jsx`
- [ ] T023 [US1] Implement the note list container in `frontend/src/components/NoteList.jsx`
- [ ] T024 [US1] Implement page-local note state, CRUD orchestration, and backend loading in `frontend/src/App.jsx`
- [ ] T025 [US1] Add first-release Markdown rendered read mode in `frontend/src/components/NoteCard.jsx` after confirming existing dependencies or obtaining approval for any new renderer
- [ ] T026 [US1] Render the minimal working UI shell and essential layout styles in `frontend/src/styles/app.css`
- [ ] T027 [US1] Verify list cards show title, formatted time, tags, preview text, inline edit state, and rendered Markdown in `frontend/src/components/NoteCard.jsx`

**Checkpoint**: User Story 1 is a working MVP with backend-backed CRUD and first-release Markdown rendering before advanced filtering or rendering polish.

---

## Phase 4: User Story 2 - 최근 노트 훑어보기 (Priority: P2)

**Goal**: Users can visually scan the latest notes quickly through stable ordering and card metadata.

**Independent Test**: Create multiple notes with different timestamps and confirm the newest notes stay first while each card shows correctly formatted time, tags, and preview text.

### Implementation for User Story 2

- [ ] T028 [US2] Refine backend list ordering guarantees in `backend/src/services/notesService.js` for stable `createdAt` descending results
- [ ] T029 [US2] Ensure note preview generation handles empty content and Markdown-heavy content in `frontend/src/utils/previewText.js`
- [ ] T030 [US2] Refine note list rendering for recent-note scanning in `frontend/src/components/NoteList.jsx`
- [ ] T031 [US2] Keep the initial visual styling minimal and readability-focused in `frontend/src/styles/app.css` without delaying functionality

**Checkpoint**: User Stories 1 and 2 together provide a usable recent-note browsing experience without relying on advanced filtering.

---

## Phase 5: User Story 3 - 태그와 검색으로 다시 찾기 (Priority: P3)

**Goal**: Users can narrow notes through tag filtering and title/content search, including combined conditions.

**Independent Test**: With several notes in place, click a tag, apply a search term, verify the result set reflects both conditions together, then clear either condition and confirm immediate recalculation.

### Implementation for User Story 3

- [ ] T032 [US3] Implement combined `search` and `tag` query handling in `backend/src/services/notesService.js`
- [ ] T033 [US3] Expose backend query parameters through `frontend/src/services/notesApi.js`
- [ ] T034 [P] [US3] Implement the top search bar in `frontend/src/components/SearchBar.jsx`
- [ ] T035 [P] [US3] Implement clickable tag filter UI in `frontend/src/components/TagFilterBar.jsx`
- [ ] T036 [US3] Integrate search text, active tag, and combined backend fetch logic in `frontend/src/App.jsx`
- [ ] T037 [US3] Add empty-state handling for no notes and no matching results in `frontend/src/components/NoteList.jsx`

**Checkpoint**: All user stories are independently functional, and search plus tag filtering work together.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish implementation safeguards and hold explicit checkpoints for optional dependency-based enhancement.

- [ ] T038 Add a manual checkpoint in `specs/001-study-note-app/quickstart.md` to stop and request approval before installing any Markdown rendering dependency
- [ ] T039 Improve Markdown rendering fidelity or fallback behavior in `frontend/src/components/NoteCard.jsx` only after dependency approval is granted
- [ ] T040 Re-check backend/frontend separation and response envelope compliance against `specs/001-study-note-app/plan.md`
- [ ] T041 Run the manual verification flow in `specs/001-study-note-app/quickstart.md` and update any mismatched docs in `README.md` or `specs/001-study-note-app/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories
- **User Story 1 (Phase 3)**: Depends on backend foundations and delivers the first working MVP
- **User Story 2 (Phase 4)**: Depends on User Story 1 because it improves the working note list experience
- **User Story 3 (Phase 5)**: Depends on backend foundations and the frontend CRUD shell from User Story 1
- **Polish (Phase 6)**: Depends on all targeted user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Backend API contract and safe JSON persistence must exist first
- **User Story 2 (P2)**: Builds on the CRUD list UI from User Story 1
- **User Story 3 (P3)**: Requires the CRUD shell plus backend query behavior but remains functionally isolated once those prerequisites exist

### Within Each User Story

- Backend API implementation comes before frontend integration
- Dependency installation must stop for user approval when needed
- Minimal working behavior comes before visual polish
- Keyboard save behavior must be wired before declaring inline edit complete
- Time formatting and latest-first ordering must be completed before recent-note review is considered done

### Parallel Opportunities

- `T006`–`T009` can partially proceed in parallel because they touch separate backend utility/model files
- `T017`–`T020` can proceed in parallel once backend foundations are ready
- `T034` and `T035` can proceed in parallel during User Story 3

---

## Parallel Example: User Story 1

```bash
# Parallel utility and frontend helper work after backend foundations:
Task: "T018 Implement keyboard save detection in frontend/src/hooks/useKeyboardSave.js"
Task: "T019 Implement note timestamp formatting in frontend/src/utils/formatDisplayDate.js"
Task: "T020 Implement note preview extraction in frontend/src/utils/previewText.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational backend API and safe persistence
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm create/edit/delete, inline save, latest ordering, essential card data, and rendered Markdown work end-to-end

### Incremental Delivery

1. Backend contracts and file safety first
2. Minimal CRUD UI second
3. Recent-note scanning improvements third
4. Search and tag filter composition fourth
5. Markdown rendering quality enhancement only after dependency approval checkpoint

### Parallel Team Strategy

1. One developer handles backend foundations (`T006`–`T015`)
2. One developer prepares frontend integration helpers (`T017`–`T020`) once the API contract is stable
3. Search bar and tag filter UI can split once User Story 3 begins

---

## Notes

- All tasks follow the required checklist format with IDs and file paths
- Frontend and backend work are explicitly separated
- Backend API contract implementation is scheduled before frontend integration
- JSON file read/write safety is included as a foundational task
- `Ctrl/Cmd + Enter` save handling is explicitly included
- Time formatting, latest-first sorting, tag parsing, tag filtering, and combined search/filter logic are all covered
- Dependency approval checkpoints are included before any new renderer installation and before Markdown rendering quality enhancement
- Minimal working behavior is scheduled before styling and polish
