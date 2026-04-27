# Implementation Plan: Note Groups

**Branch**: `016-note-groups` | **Date**: 2026-04-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-note-groups/spec.md`

## Summary

노트를 태그와 별개의 단일 계층 그룹으로 정리할 수 있게 한다. 백엔드에 `Group` 도메인과 SQLite 스키마를 추가하고, 기존 `Note`에 nullable `groupId`를 연결한다. 그룹 CRUD, 노트 생성/수정 시 그룹 할당, 그룹/검색/태그 AND 필터링을 모두 계정별 소유권 검증 아래에서 처리한다. 프론트엔드는 현재 노트 관리 화면 안에 그룹 관리/필터/선택 컨트롤을 추가하며, 모달 중심 흐름이나 새 의존성은 도입하지 않는다.

## Technical Context

**Language/Version**: Node.js 22 (backend), React 19 (frontend)
**Primary Dependencies**: Express 5, better-sqlite3, jsonwebtoken, bcryptjs, axios, TipTap v3 (기존 유지, 신규 패키지 없음)
**Storage**: SQLite single-file DB via `better-sqlite3`
**Testing**: Node.js built-in test runner (`node --test`) for backend/frontend MVP checks
**Target Platform**: WSL Ubuntu for development, Linux/k3s for deployed runtime
**Project Type**: Web monorepo (`backend/` Express API + `frontend/` React SPA)
**Performance Goals**: Group list and filtered note list should feel immediate for MVP personal data scale; combined filters must preserve existing latest-first note ordering
**Constraints**: Preserve auth/SSO/session behavior, account isolation, JSON response envelope, backend-owned persistence, no unapproved dependency installation
**Scale/Scope**: Single-user-per-account personal note app; nested groups, multi-group notes, sharing, permissions, colors/icons are out of scope

## Constitution Check

- ✅ **Monorepo boundary**: Frontend will call group/note HTTP APIs only. No frontend imports from backend source.
- ✅ **JSON envelope**: New group endpoints and changed note endpoints return `{ success, data, error }` for success and error paths.
- ✅ **Storage ownership**: SQLite schema, group ownership checks, note group assignment, and filtering stay in backend repositories/services.
- ✅ **Naming**: New code identifiers and files use English names such as `group`, `groupId`, `groupsService`, `dbGroupRepository`; comments remain Korean where needed.
- ✅ **Dependency policy**: No new packages planned. Existing Express, better-sqlite3, axios, React, and Node test runner are sufficient.
- ✅ **UX policy**: Group management uses inline/page-embedded controls in the existing notes screen; no modal-first flow.
- ✅ **Incremental delivery**: Implementation can be split into DB/repository, API/service, frontend service/state, UI controls, and docs/tests.

## Project Structure

### Documentation (this feature)

```text
specs/016-note-groups/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── groups-api-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.js                         # groups route mount
│   ├── db/index.js                    # groups table, note group_id migration/indexes
│   ├── models/
│   │   ├── group.js                   # group validation/factory
│   │   └── note.js                    # nullable groupId parsing
│   ├── repositories/
│   │   ├── dbGroupRepository.js       # group CRUD and ownership lookup
│   │   └── dbNoteRepository.js        # groupId persistence and group filter
│   ├── services/
│   │   ├── groupsService.js           # group business rules
│   │   └── notesService.js            # group ownership validation before note writes
│   ├── controllers/
│   │   ├── groupsController.js        # group HTTP handlers
│   │   └── notesController.js         # group-related validation status mapping
│   └── routes/
│       └── groupsRoutes.js            # /api/groups
└── tests/
    ├── groups.test.js                 # group CRUD/ownership behavior
    └── notesGroups.test.js            # group assignment/filter behavior

frontend/
├── src/
│   ├── App.jsx                        # groups state, activeGroupFilter, load sequencing
│   ├── components/
│   │   ├── GroupManager.jsx           # inline group create/rename/delete
│   │   ├── GroupFilterBar.jsx         # all/group 없음/group filters
│   │   ├── GroupSelect.jsx            # note composer/edit group selector
│   │   ├── NoteComposer.jsx           # groupId in new note form
│   │   ├── NoteCard.jsx               # group display + edit selector
│   │   └── NoteList.jsx               # combined empty state copy
│   ├── services/
│   │   ├── groupsApi.js               # group HTTP API
│   │   └── notesApi.js                # groupId query/body support
│   └── tests/
│       └── groupsApi.test.js          # URL/query/body behavior
```

**Structure Decision**: Reuse the current monorepo and backend layering. Add the smallest parallel group module to backend (`routes/controller/service/repository/model`) and small frontend components that keep group state local to `App.jsx`.

## Complexity Tracking

No constitution violations. No extra project, dependency, global state manager, nested group model, or multi-group join table is required for the MVP.

## Phase 0: Research

Completed in [research.md](research.md).

Key decisions:
- Add a `groups` table and nullable `notes.group_id`.
- Keep notes at zero-or-one group; no join table.
- Enforce group ownership in backend services before assignment, filtering, update, or delete.
- Use backend filtering for group/search/tag combined filters with AND semantics.
- Delete group by unassigning related notes in a transaction.
- Keep frontend group state local and page-embedded.

## Phase 1: Design

Completed artifacts:
- [data-model.md](data-model.md)
- [contracts/groups-api-contract.md](contracts/groups-api-contract.md)
- [quickstart.md](quickstart.md)

## Backend Plan

### Group 도메인 모델

`Group` represents a single-level, user-owned category:

- `id`: generated group identifier
- `userId`: owner account
- `name`: trimmed display name, max 40 chars
- `normalizedName`: lowercase comparison key for duplicate prevention
- `createdAt`, `updatedAt`: ISO timestamps

Validation:
- Empty or whitespace-only names are rejected.
- Names longer than 40 characters are rejected.
- Duplicate names are rejected per user after trim + case-insensitive normalization.

### User, Note, Group 관계

- `User 1:N Group`
- `User 1:N Note`
- `Group 1:N Note`
- `Note N:0..1 Group`
- Groups and notes cannot cross `userId` boundaries.

### DB 스키마 변경

SQLite initialization adds:

- `groups` table with `id`, `user_id`, `name`, `normalized_name`, `created_at`, `updated_at`
- Unique index on `(user_id, normalized_name)`
- `notes.group_id TEXT NULL REFERENCES groups(id) ON DELETE SET NULL`
- Indexes for `groups(user_id, normalized_name)` and `notes(user_id, group_id, created_at DESC)`

Because current DB initialization uses `CREATE TABLE IF NOT EXISTS`, existing deployed DBs need idempotent migration statements:

- Check `PRAGMA table_info(notes)` for `group_id`; run `ALTER TABLE notes ADD COLUMN group_id TEXT` only when absent.
- Create the `groups` table and indexes with `IF NOT EXISTS`.
- Existing notes naturally have `group_id = NULL`.

### Note 모델의 groupId 추가

`backend/src/models/note.js` accepts optional `groupId`:

- Missing, empty string, or `null` means no group.
- Non-empty value must be a string.
- `createNote()` and `updateNote()` return `groupId`.
- Repository maps `group_id` ↔ `groupId`.

Service-level validation checks that any non-null `groupId` belongs to the same `userId` before insert/update.

### Group CRUD API

Add authenticated `/api/groups` endpoints:

- `GET /api/groups`: list current user's groups, sorted by `name ASC`
- `POST /api/groups`: create group
- `PATCH /api/groups/:groupId`: rename group
- `DELETE /api/groups/:groupId`: delete group and unassign related notes

All responses use the envelope. Unauthorized/cross-account access is returned as not found or validation failure without leaking ownership information.

### Note API groupId 처리

Existing note endpoints change compatibly:

- `GET /api/notes?search=&tag=&groupId=` supports group filtering.
- `GET /api/notes?group=none` or an equivalent contract value filters group 없음 notes.
- `POST /api/notes` accepts optional `groupId`.
- `PATCH /api/notes/:noteId` accepts optional `groupId`; missing, empty string, or `null` is treated as group 없음 to match the existing full-form inline edit flow.

The contract will use `groupId` for real group ids and `group=none` for group 없음 to avoid overloading empty strings.
Malformed group ids return `400`. Valid-looking group ids that do not exist or are not owned by the current user return `404` without exposing ownership information.

### 그룹 삭제 처리

`deleteGroup(userId, groupId)` runs in a backend transaction:

1. Verify group belongs to `userId`.
2. Update `notes SET group_id = NULL WHERE user_id = ? AND group_id = ?`.
3. Delete the group.
4. Return deleted group id and affected note count.

This prevents note loss and keeps account isolation explicit.

### 그룹별 노트 필터링

Filtering is backend-owned:

- `tag` and `search` keep existing behavior.
- `groupId=<id>` adds `AND group_id = ?` after confirming the group belongs to the current user.
- `group=none` adds `AND group_id IS NULL`.
- No group parameter returns all notes.
- All filters combine with AND and preserve `ORDER BY created_at DESC`.

Backend filtering avoids loading all notes on the client and keeps ownership validation centralized.

## Frontend Plan

### Group 관리 UI

Add `GroupManager` as a page-level view opened from a `그룹 관리` button next to the profile button:

- Inline text input for new group.
- List existing groups sorted by name.
- Inline rename mode per group.
- Delete button with a lightweight confirmation pattern using existing button styles.
- Empty state when no groups exist.
- Friendly Korean validation messages for duplicate names and common validation failures.
- Expandable group rows that show note titles for the group and an inline text preview when a note title is clicked.

No modal-first flow. Keep layout consistent with existing panels and controls, but do not keep the management panel on the main notes screen.

### Group 필터 UI

Add `GroupFilterBar` alongside existing search/tag controls:

- `전체`
- `그룹 없음`
- One button/select item per group
- Active group filter can combine with search and tag.
- Clear filters resets search, tag, and group filter together.

### 노트 작성/수정 그룹 선택

Add `GroupSelect` to `NoteComposer` and `NoteCard` edit mode:

- First option: `그룹 없음`
- Group options sorted by name.
- In `NoteComposer`, place the group selector before the title input so users can classify the note before writing the title.
- In `NoteComposer`, allow creating a new group from the selector area and immediately selecting the created group.
- Selected value is stored as `groupId` in form/edit state.
- Ctrl/Cmd + Enter save behavior remains unchanged.

### State flow

`App.jsx` owns:

- `groups`
- `activeGroupFilter` (`all`, `none`, or group id)
- note list filters (`searchText`, `activeTag`, `activeGroupFilter`)

No global state library. After group create/update/delete, reload groups; after delete, reload notes because affected notes may move to group 없음.

## Testing Plan

Backend:

- Group create/list/update/delete success.
- Duplicate group name within same user rejected case-insensitively.
- Cross-account group access rejected.
- Group delete unassigns notes, does not delete notes.
- Note create/update rejects another user's group.
- Combined `search + tag + groupId` and `group=none` filters return expected notes latest-first.

Frontend:

- `groupsApi` request paths and envelope unwrap behavior.
- `notesApi` query params include group filter correctly.
- Group filter value composition does not drop search/tag state.

Manual:

- Create group → assign note → filter by group.
- Rename group → note display and selector update.
- Delete group → notes remain under group 없음.
- Verify another account cannot see or use first account's group.

## Documentation Plan

Update after implementation:

- `README.md`: include 016 feature status and group user workflow.
- `AGENTS.md` / `CLAUDE.md`: active feature summary if implementation changes project behavior.
- `infra/docs/operations.md` only if runtime DB migration verification needs operator notes.
- `specs/016-note-groups/quickstart.md`: keep manual verification steps current.
