<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - Principle slot 1 -> I. Monorepo Boundary Enforcement
  - Principle slot 2 -> II. English Code, Korean Commentary
  - Principle slot 3 -> III. Stable API Contract
  - Principle slot 4 -> IV. Dependency Approval and Storage Simplicity
  - Principle slot 5 -> V. Fast, Predictable UX and Incremental Delivery
- Added sections:
  - Architecture and Runtime Standards
  - Delivery Workflow and Review Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated .specify/templates/plan-template.md
  - ✅ updated .specify/templates/spec-template.md
  - ✅ updated .specify/templates/tasks-template.md
  - ✅ verified .specify/templates/commands/*.md (directory not present; no action needed)
  - ✅ verified runtime guidance docs (README.md, docs/quickstart.md, AGENTS.md not present)
- Follow-up TODOs:
  - None
-->
# Study Note Constitution

## Core Principles

### I. Monorepo Boundary Enforcement
The repository MUST remain a monorepo split into `/frontend` and `/backend`.
Frontend code MUST NOT import, execute, or reference backend source files directly.
Frontend-to-backend communication MUST occur only through HTTP APIs. Data storage,
file persistence, and data access responsibilities MUST remain in the backend. Any
shared contract between the two sides MUST be expressed as API schemas or documented
request/response shapes, never as cross-imported runtime code.

Rationale: This preserves a replaceable service boundary, prevents accidental
tight coupling, and keeps the storage implementation isolated behind backend
interfaces (currently SQLite via `better-sqlite3`).

### II. English Code, Korean Commentary
All variable names, function names, file names, directory names, and component
names MUST be written in English. React component names MUST use PascalCase.
Functions, hooks, ordinary variables, and non-component identifiers MUST use
camelCase. Code comments and commit messages MUST be written in Korean.

Rationale: English identifiers improve consistency across the codebase and common
tooling, while Korean comments and commits keep implementation intent and review
history accessible to the working team.

### III. Stable API Contract
Every backend JSON response MUST use the exact envelope
`{ success: boolean, data: any, error: string | null }`. New endpoints, modified
endpoints, and error paths MUST preserve this shape. Frontend API consumers MUST
parse against this contract and MUST NOT depend on ad hoc response structures.

Rationale: A single response envelope reduces branching in the frontend, makes
error handling predictable, and creates a clean seam for future backend changes.

### IV. Dependency Approval and Storage Simplicity
If new packages or libraries appear necessary, the implementation MUST pause for
user approval before installation. Existing dependencies and platform-default
capabilities MUST be preferred first. Backend persistence MUST stay simple (currently
SQLite single-file via `better-sqlite3`), and code structure MUST keep storage logic
encapsulated in repository modules so the persistence layer can be swapped without
rewriting feature logic.

Rationale: This reduces dependency sprawl, avoids premature framework decisions,
and keeps the storage layer easy to reason about and replace.

### V. Fast, Predictable UX and Incremental Delivery
Implementations MUST optimize for fast rendering, simple data flow, and predictable
interaction. Inline editing MUST be preferred over modal-based editing unless a
modal is clearly required by the task. Unnecessary global state, speculative
abstractions, and broad architectural indirection MUST be avoided. User
interactions MUST remain keyboard-friendly and behaviorally predictable. Work MUST
be delivered in small, reviewable slices.

Rationale: Study Note is a productivity-focused web application; responsiveness,
clarity, and reviewability matter more than ornamental architecture.

## Architecture and Runtime Standards

- The canonical application shape is a web monorepo with `frontend/` and
  `backend/` as first-level project roots.
- Backend modules that perform persistence operations (SQLite queries, file writes)
  MUST isolate that access in backend-owned repositories; route handlers and frontend
  code MUST NOT perform direct persistence operations.
- Feature designs MUST document the HTTP endpoints, payload shapes, and ownership
  of any state transitions that cross the frontend/backend boundary.
- Development workflows, scripts, and quickstart instructions SHOULD target WSL
  Ubuntu and other shell-friendly Linux environments first. Commands SHOULD prefer
  POSIX shell conventions over platform-specific GUI steps when a choice is needed.

## Delivery Workflow and Review Gates

- Every plan, spec, and task list MUST explicitly verify constitution compliance
  before implementation starts and after design changes.
- Feature proposals MUST call out any new dependency request, backend API contract
  change, storage-layer change, or cross-boundary risk during planning.
- Reviews MUST reject work that introduces frontend-to-backend source imports,
  breaks the JSON response envelope, adds unapproved dependencies, or introduces
  avoidable global state / excessive abstraction.
- When editing UX is involved, reviewers MUST confirm that inline editing was
  considered first and that keyboard interaction remains coherent.
- Work SHOULD be split into small, reviewable units with clear file ownership and
  minimal unrelated changes.

## Governance

This constitution supersedes conflicting local conventions for the Study Note
repository. Amendments MUST be recorded by updating this file and any affected
templates in the same change. Versioning follows semantic versioning for governance
documents: MAJOR for incompatible principle redefinitions or removals, MINOR for
new principles or materially expanded guidance, and PATCH for clarifications that
do not change expected behavior. Compliance review is mandatory for every plan,
specification, and implementation review, with explicit checks for architecture
boundaries, naming policy, API response format, dependency approval, UX rules, and
WSL/Linux-oriented workflow guidance.

**Version**: 1.0.0 | **Ratified**: 2026-04-14 | **Last Amended**: 2026-04-14
