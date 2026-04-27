# Research: Note Groups

## 1. Group persistence model

**Decision**: Add a dedicated `groups` table and a nullable `notes.group_id` column.

**Rationale**: A group is a first-class user-owned entity with lifecycle operations. A nullable `group_id` on notes directly models the clarified rule that a note can belong to zero or one group. This keeps queries simple and avoids unnecessary join-table complexity.

**Alternatives considered**:
- Store group name directly on notes: rejected because rename/delete would require broad note rewrites and would not model group ownership cleanly.
- Add `note_groups` join table: rejected because multi-group notes are explicitly out of scope.
- Encode group in tags: rejected because groups and tags are separate classification concepts.

## 2. Account isolation and ownership validation

**Decision**: Enforce ownership in backend services and repository queries using `userId` for every group operation and every group-note assignment.

**Rationale**: Authentication and account-separated notes already exist. Keeping group ownership checks in backend services preserves the project boundary and prevents frontend-supplied group ids from crossing accounts.

**Alternatives considered**:
- Trust frontend group options: rejected because a crafted request could assign another user's group.
- Validate only by foreign key: rejected because a valid group id may still belong to another user.

## 3. Group name uniqueness

**Decision**: Add a normalized name per group and enforce unique `(user_id, normalized_name)`.

**Rationale**: The clarified requirement disallows duplicates after trimming and case-insensitive comparison. A normalized value gives deterministic validation and works consistently across create and rename.

**Alternatives considered**:
- Case-sensitive uniqueness: rejected because `Work` and `work` would be confusing duplicate groups.
- Global uniqueness: rejected because different users should be able to use the same personal group names.

## 4. Existing data and schema migration

**Decision**: Existing notes default to `group_id = NULL`. DB initialization should be idempotent and add the nullable column only when absent.

**Rationale**: Current production data already exists in SQLite. A nullable column supports existing notes without user action and aligns with the "group 없음" requirement.

**Alternatives considered**:
- Create a default group and move existing notes into it: rejected because it changes user organization semantics.
- Require manual migration by users: rejected by FR-015.

## 5. Group deletion behavior

**Decision**: Delete group in a backend transaction that first sets related notes to `group_id = NULL`.

**Rationale**: Notes are primary user data and must not be deleted with a group. A transaction keeps the list consistent even if a later operation fails.

**Alternatives considered**:
- Block deletion while notes exist: rejected because it adds friction and was not requested.
- Cascade delete notes: rejected by clarified requirements.
- Rely only on `ON DELETE SET NULL`: useful as a safety net, but explicit update with `user_id` keeps affected note count and ownership clear.

## 6. Filtering responsibility

**Decision**: Apply group, search, and tag filters in the backend query with AND semantics.

**Rationale**: Backend filtering keeps data ownership and query behavior centralized, avoids fetching unnecessary notes, and matches existing `GET /api/notes?search=&tag=` behavior.

**Alternatives considered**:
- Frontend filtering after fetching all notes: rejected because it duplicates logic and weakens backend ownership validation.
- Separate group-specific note endpoint: rejected because existing list endpoint already owns note filtering and combined filters would become fragmented.

## 7. API shape

**Decision**: Add `/api/groups` for group CRUD and extend `/api/notes` with optional `groupId` and `group=none` filters.

**Rationale**: Separate group CRUD keeps resource boundaries clear. Extending the notes list endpoint preserves the current note query model for search/tag and adds only the group dimension.

**Alternatives considered**:
- Nest groups under `/api/notes/groups`: rejected because groups are resources, not note actions.
- Use only query `groupId=none`: rejected to avoid overloading group id semantics with sentinel values.

## 8. Frontend interaction model

**Decision**: Use page-embedded group management, a compact group filter control, and a group select in composer/edit forms.

**Rationale**: The app already favors inline editing and simple local state. Group management should not add a separate navigation hierarchy or modal-heavy workflow for the MVP.

**Alternatives considered**:
- Dedicated group management page: rejected as unnecessary for MVP.
- Modal create/edit/delete flows: rejected by project UX principle unless later complexity requires it.

## 9. Dependency strategy

**Decision**: No new package is needed.

**Rationale**: Existing backend and frontend dependencies can implement forms, API calls, validation, and tests. New dependencies would not reduce meaningful complexity for this scope.

**Alternatives considered**:
- Add form or state management libraries: rejected as overkill for local component state.
- Add migration framework: rejected because one idempotent SQLite migration is enough for MVP.
