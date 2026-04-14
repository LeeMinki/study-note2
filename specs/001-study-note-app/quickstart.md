# Quickstart: Study Note App

## Prerequisites

- WSL Ubuntu or equivalent Linux shell environment
- Node.js installed locally
- User approval before installing any missing dependencies

## Repository Layout

```text
frontend/   # React SPA
backend/    # Express API + data.json persistence
```

## Setup Flow

1. Verify whether required dependencies already exist in the repository.
2. If React, Express, Axios, or a Markdown rendering dependency is missing, request user approval before running any install command.
3. Prepare `backend/data.json` with an initial shape such as:

```json
{
  "notes": []
}
```
4. Create the monorepo directories and placeholder entry files before any package installation so the implementation order stays reviewable.
5. After a fresh clone, run `npm install` inside both `backend/` and `frontend/` before `npm run dev`. The repository does not commit `node_modules/`.

## Run Backend

Expected backend responsibilities:

- expose REST endpoints under `/api/notes`
- normalize tags into string arrays
- sort note results by `createdAt` descending
- read/write only through backend-owned file helpers
- return all payloads in `{ success, data, error }`

Example command shape after dependencies are approved and configured:

```bash
cd backend
npm install
npm run dev
```

## Run Frontend

Expected frontend responsibilities:

- call backend only through Axios-based HTTP requests
- render note list cards with title, formatted timestamp, tags, and preview
- support inline editing inside note cards
- support `Ctrl+Enter` and `Cmd+Enter` save shortcuts

Example command shape after dependencies are approved and configured:

```bash
cd frontend
npm install
npm run dev
```

## Manual Verification Order

### Phase 1: Core CRUD

1. Create a note with title, Markdown content, and comma-separated tags.
2. Confirm the created note appears at the top of the list.
3. Edit the note inside its card and save with `Ctrl+Enter` or `Cmd+Enter`.
4. Delete the note and confirm it disappears from the list.

### Phase 2: Filtering and Search

1. Create multiple notes with different tags and contents.
2. Click a tag and confirm only matching notes remain.
3. Enter search text and confirm title/content matches update immediately.
4. Apply both tag filter and search together and confirm combined narrowing.

### Phase 3: Markdown Rendering

1. Confirm stored Markdown source still round-trips through create and update flows.
2. Confirm rendered display is visible in read mode.
3. Confirm preview text remains concise and stable in the note list.

## Notes

- Do not install dependencies automatically.
- After cloning the repository, `npm install` is required in both app directories before any `npm run dev` command.
- If a Markdown renderer is needed, stop and request explicit approval first.
- Use documentation or source-code comments for approval checkpoints; do not rely on JSON comments in `package.json`.
- Keep frontend and backend processes independent throughout local development.
