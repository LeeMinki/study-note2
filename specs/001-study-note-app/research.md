# Research: Study Note App

## Decision: Use a simple backend layering of routes → controller → service → file repository helper

**Rationale**: This matches the constitution requirement for simple architecture while still isolating file I/O behind one backend-owned seam. It keeps route handlers thin and makes later migration from `data.json` to a database easier.

**Alternatives considered**:
- Routes calling file helpers directly: rejected because persistence details would leak into request handling.
- Full repository/domain/use-case abstraction: rejected because it adds unnecessary layers for a small local app.

## Decision: Keep frontend state local to the app shell and note-card level

**Rationale**: Search text, active tag, inline editing state, and optimistic UI feedback are small, page-local concerns. Local state keeps rendering fast and avoids premature global state infrastructure.

**Alternatives considered**:
- Global state store from the start: rejected because the first release is single-page and single-user.
- Server-driven filter state only: rejected because immediate interaction feedback is a priority.

## Decision: Store canonical timestamps in raw ISO form and format only for display

**Rationale**: ISO timestamps preserve sort reliability and storage neutrality. Display formatting to `YYYY. MM. DD. HH:mm` can stay a frontend concern without changing stored data.

**Alternatives considered**:
- Persisting preformatted timestamps: rejected because it couples storage to presentation.
- Storing only locale-specific strings: rejected because sorting and future migration become harder.

## Decision: Normalize comma-separated tags into trimmed, de-duplicated string arrays

**Rationale**: The UI accepts lightweight comma-separated input, but the persisted representation should be explicit and consistent for filtering and future API use.

**Alternatives considered**:
- Store tags as one raw string: rejected because filtering and validation become error-prone.
- Store objects per tag: rejected because there is no current need for richer tag metadata.

## Decision: Support combined search and tag filtering in backend query handling

**Rationale**: Combined filtering is part of the clarified feature scope. Keeping the backend contract capable of both query types avoids frontend-only assumptions and preserves consistent behavior if storage changes later.

**Alternatives considered**:
- Frontend-only filtering over a full list: acceptable for local data, but rejected as the sole strategy because it weakens the backend ownership boundary.
- Separate endpoints for search and filter: rejected because one combined query endpoint is simpler.

## Decision: Sequence implementation as CRUD first, then filter/search, then Markdown rendering enhancement

**Rationale**: CRUD establishes the core data lifecycle and local persistence first. Filter/search can then build on stable note data. Markdown rendering is last because it may require additional dependency approval and should not block the main workflow.

**Alternatives considered**:
- Markdown rendering in phase 1: rejected because it introduces dependency uncertainty earlier than needed.
- Search/filter before delete/update: rejected because stable CRUD behavior is the foundation for trustworthy results.

## Decision: Treat Markdown rendering as a dependency-sensitive enhancement

**Rationale**: The product scope requires rendered Markdown, but the constitution forbids automatic dependency installation. Planning should therefore preserve Markdown input/output behavior while making package approval an explicit checkpoint if a renderer is needed.

**Alternatives considered**:
- Assume a renderer package immediately: rejected because installation approval has not been granted.
- Skip rendered output entirely: rejected because it conflicts with the clarified specification.
