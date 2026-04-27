# API Contract: Note Groups

All JSON responses must use:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error responses use:

```json
{
  "success": false,
  "data": null,
  "error": "오류 메시지"
}
```

Authentication:

- All `/api/groups` endpoints require `Authorization: Bearer <jwt>`.
- Changed `/api/notes` endpoints keep the existing JWT requirement.

## Group Object

```json
{
  "id": "group_1770000000000_abcd1234",
  "userId": "user_1770000000000_abcd1234",
  "name": "AWS",
  "createdAt": "2026-04-27T09:00:00.000Z",
  "updatedAt": "2026-04-27T09:00:00.000Z"
}
```

`normalizedName` is internal and must not be required by frontend clients.

## Note Object Change

Existing note responses add `groupId`.

```json
{
  "id": "note_1770000000000_abcd1234",
  "userId": "user_1770000000000_abcd1234",
  "title": "Kubernetes notes",
  "content": "<p>content</p>",
  "tags": ["k8s"],
  "groupId": "group_1770000000000_abcd1234",
  "createdAt": "2026-04-27T09:00:00.000Z",
  "updatedAt": "2026-04-27T09:00:00.000Z"
}
```

Group 없음 notes return:

```json
{
  "groupId": null
}
```

## New Endpoints

### GET /api/groups

List current user's groups sorted by name ascending.

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "group_1770000000000_abcd1234",
      "userId": "user_1770000000000_abcd1234",
      "name": "AWS",
      "createdAt": "2026-04-27T09:00:00.000Z",
      "updatedAt": "2026-04-27T09:00:00.000Z"
    }
  ],
  "error": null
}
```

### POST /api/groups

Create a group for the current user.

**Request**

```json
{
  "name": "AWS"
}
```

Validation:

- `name` is trimmed.
- Empty name -> `400`.
- More than 40 characters -> `400`.
- Duplicate within same account after case-insensitive normalization -> `409`.

**Response 201**

```json
{
  "success": true,
  "data": {
    "id": "group_1770000000000_abcd1234",
    "userId": "user_1770000000000_abcd1234",
    "name": "AWS",
    "createdAt": "2026-04-27T09:00:00.000Z",
    "updatedAt": "2026-04-27T09:00:00.000Z"
  },
  "error": null
}
```

### PATCH /api/groups/:groupId

Rename a group owned by the current user.

**Request**

```json
{
  "name": "Backend"
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "group_1770000000000_abcd1234",
    "userId": "user_1770000000000_abcd1234",
    "name": "Backend",
    "createdAt": "2026-04-27T09:00:00.000Z",
    "updatedAt": "2026-04-27T09:10:00.000Z"
  },
  "error": null
}
```

Error:

- Group not found or not owned by user -> `404`.
- Duplicate name -> `409`.

### DELETE /api/groups/:groupId

Delete a group owned by the current user and unassign related notes.

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "group_1770000000000_abcd1234",
    "unassignedNoteCount": 3
  },
  "error": null
}
```

Error:

- Group not found or not owned by user -> `404`.

## Changed Endpoints

### GET /api/notes

Existing query parameters remain:

- `search`
- `tag`

New query parameters:

- `groupId=<group id>`: return notes in that group.
- `group=none`: return notes with no group.

Rules:

- `search`, `tag`, and group filters combine with AND semantics.
- `groupId` and `group=none` are mutually exclusive. If both are provided, return `400`.
- If `groupId` does not belong to the authenticated user, return `404`.
- Sort remains latest-first by created time.

**Example**

```http
GET /api/notes?search=k3s&tag=aws&groupId=group_1770000000000_abcd1234
```

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "note_1770000000000_abcd1234",
      "userId": "user_1770000000000_abcd1234",
      "title": "K3s on AWS",
      "content": "<p>content</p>",
      "tags": ["aws"],
      "groupId": "group_1770000000000_abcd1234",
      "createdAt": "2026-04-27T09:00:00.000Z",
      "updatedAt": "2026-04-27T09:00:00.000Z"
    }
  ],
  "error": null
}
```

### POST /api/notes

Existing fields remain. Optional `groupId` is added.

**Request**

```json
{
  "title": "K3s",
  "content": "<p>content</p>",
  "tags": ["aws"],
  "groupId": "group_1770000000000_abcd1234"
}
```

Group 없음 request may omit `groupId` or send `null`.

Error:

- `groupId` not found or not owned by user -> `400` or `404`; implementation should keep the message user-friendly and avoid leaking another user's group.

### PATCH /api/notes/:noteId

Existing fields remain. Optional `groupId` updates the note's group.

**Request**

```json
{
  "title": "K3s updated",
  "content": "<p>updated</p>",
  "tags": ["aws", "k8s"],
  "groupId": null
}
```

Rules:

- `groupId: null` unassigns the note.
- Missing `groupId` should be treated as group 없음 only if the existing update model requires full replacement. The implementation should keep note update behavior consistent with existing full-form saves from `NoteCard`.
- Another user's group id is rejected.

## Frontend Contract

### groupsApi

```js
fetchGroups() -> group[]
createGroup({ name }) -> group
updateGroup(groupId, { name }) -> group
deleteGroup(groupId) -> { id, unassignedNoteCount }
```

### notesApi

```js
fetchNotes({ searchText, activeTag, activeGroupFilter }) -> note[]
createNote({ title, content, tags, groupId }) -> note
updateNote(noteId, { title, content, tags, groupId }) -> note
```

`activeGroupFilter` values:

- `"all"`: no group query parameter
- `"none"`: `group=none`
- group id: `groupId=<id>`
