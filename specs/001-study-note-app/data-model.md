# Data Model: Study Note App

## Entity: Note

### Fields

| Field | Type | Required | Rules |
|------|------|----------|-------|
| `id` | string | Yes | Unique backend-generated identifier |
| `title` | string | Yes | Trimmed; may be short but must not be empty after trimming |
| `content` | string | Yes | Markdown source text; may be empty string |
| `tags` | string[] | Yes | Trimmed, normalized, de-duplicated values; empty entries removed |
| `createdAt` | string | Yes | ISO timestamp used for canonical sorting |
| `updatedAt` | string | Yes | ISO timestamp refreshed on every successful edit |

### Derived / Presentation Fields

| Field | Type | Source | Purpose |
|------|------|--------|---------|
| `formattedCreatedAt` | string | derived from `createdAt` | `YYYY. MM. DD. HH:mm` display in frontend |
| `previewText` | string | derived from `content` | Short text preview in note cards |
| `renderedContent` | string or rendered view | derived from `content` | Markdown read presentation after rendering enhancement |

### Validation Rules

- `title` must be trimmed before persistence.
- `content` is stored as authored Markdown source.
- `tags` are created from comma-separated user input and normalized into string array form.
- Duplicate tags with the same normalized value must collapse into one stored tag.
- Empty or whitespace-only tags must not be stored.
- `updatedAt` must be greater than or equal to `createdAt`.

## State Transitions

### Create

- Input: title, content, comma-separated tags
- Backend actions:
  - normalize title/content/tags
  - assign `id`
  - set `createdAt` and `updatedAt` to current timestamp
  - persist in `data.json`

### Update

- Input: note identifier plus edited title/content/tags
- Backend actions:
  - preserve `createdAt`
  - replace mutable fields
  - refresh `updatedAt`
  - persist entire collection safely

### Delete

- Input: note identifier
- Backend actions:
  - remove note from collection
  - persist remaining notes

## Query Model

### List Notes

- Default order: `createdAt` descending
- Optional query inputs:
  - `tag`: exact normalized tag match
  - `search`: substring match against title and content
- If both are present, both conditions must apply together

## Persistence Shape

`backend/data.json` should keep a simple top-level document such as:

```json
{
  "notes": []
}
```

This keeps file reads/writes straightforward while allowing future migration to another storage layer with minimal frontend impact.
