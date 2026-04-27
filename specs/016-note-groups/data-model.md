# Data Model: Note Groups

## Entity Relationship Summary

```text
User 1 ── N Group
User 1 ── N Note
Group 1 ── N Note
Note N ── 0..1 Group
```

Rules:

- A group belongs to exactly one user.
- A note belongs to exactly one user.
- A note may reference zero or one group.
- A note can only reference a group owned by the same user.
- Deleting a group unassigns related notes; it never deletes notes.

## SQLite Schema Changes

### groups table

```sql
CREATE TABLE IF NOT EXISTS groups (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_user_normalized_name
  ON groups(user_id, normalized_name);

CREATE INDEX IF NOT EXISTS idx_groups_user_name
  ON groups(user_id, name COLLATE NOCASE ASC);
```

### notes table addition

```sql
ALTER TABLE notes ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notes_user_group_created_at
  ON notes(user_id, group_id, created_at DESC);
```

Implementation note:

- `ALTER TABLE` must be guarded by `PRAGMA table_info(notes)` so it runs only when `group_id` is missing.
- Existing rows receive `NULL` for `group_id` and become group 없음 notes.

## Entity: Group

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | Generated id, e.g. `group_<timestamp>_<random>` |
| `userId` | string | Yes | Owner user id |
| `name` | string | Yes | Trimmed display name |
| `normalizedName` | string | Yes | `name.trim().toLowerCase()` for duplicate checks |
| `createdAt` | string | Yes | ISO timestamp |
| `updatedAt` | string | Yes | ISO timestamp |

Validation:

- `name.trim()` must not be empty.
- `name` max length is 40 characters after trim.
- `normalizedName` must be unique per `userId`.

Repository shape:

```js
findGroupsByUserId(userId)                 -> group[]
findGroupById(groupId)                     -> group | null
findGroupByUserIdAndName(userId, name)     -> group | null
insertGroup(group)                         -> group
updateGroup(group)                         -> group
deleteGroup(groupId)                       -> { id }
```

Return format:

- DB rows use snake_case.
- Application objects use camelCase.
- Lists are sorted by `name` ascending with case-insensitive collation.

## Entity: Note

Existing fields remain:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | Existing note id |
| `userId` | string | Yes | Owner user id |
| `title` | string | Yes | Existing title validation |
| `content` | string | Yes | Existing content behavior |
| `tags` | string[] | Yes | Existing tag normalization |
| `groupId` | string \| null | No | New optional group reference |
| `createdAt` | string | Yes | Existing created time |
| `updatedAt` | string | Yes | Existing updated time |

Validation:

- Missing `groupId`, `null`, or empty string means group 없음.
- Non-empty `groupId` must belong to the same `userId`.
- Tags and group are independent. Changing one must not mutate the other.

Repository changes:

```js
findNotesByUserId(userId, { tag, search, groupId, group }) -> note[]
insertNote(note)                                           -> note
updateNote(note)                                           -> note
```

Query behavior:

- `groupId` adds `AND group_id = ?`.
- `group=none` adds `AND group_id IS NULL`.
- `search`, `tag`, and group filters combine with AND.
- Sort remains `created_at DESC`.

## State Transitions

### Group lifecycle

```text
created -> renamed -> deleted
```

Effects:

- `created`: group appears in group lists and selectors.
- `renamed`: notes keep the same `groupId`; display name changes everywhere.
- `deleted`: related notes become group 없음.

### Note group assignment

```text
group 없음 -> assigned to group
assigned to group A -> assigned to group B
assigned to group -> group 없음
```

Invalid transitions:

- Assign to a non-existent group.
- Assign to another user's group.
- Assign to multiple groups.

## Access Control Model

- Every group query is scoped by authenticated `userId`.
- Group update/delete first verifies group ownership.
- Note create/update validates `groupId` ownership before writing.
- Group filtering validates the group belongs to the authenticated user before returning notes.
- Cross-account group ids should not reveal whether the group exists; they should be treated like unavailable resources.

## Existing Data Handling

- Existing notes have `groupId: null`.
- Existing users have no groups until they create them.
- No user-facing migration step is required.
- No default group is created automatically.
