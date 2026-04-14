# Implementation Plan: Study Note App

**Branch**: `001-study-note-app` | **Date**: 2026-04-14 | **Spec**: [/home/hyerin/speckit/study-note2/specs/001-study-note-app/spec.md](/home/hyerin/speckit/study-note2/specs/001-study-note-app/spec.md)
**Input**: Feature specification from `/specs/001-study-note-app/spec.md`

## Summary

Study Note는 개발 및 학습 내용을 빠르게 기록하고 다시 찾기 위한 단일 사용자 웹 애플리케이션이다.
구현은 `frontend/` React SPA와 `backend/` Node.js + Express API로 엄격히 분리하고,
모든 저장/조회는 `backend/data.json`을 통해 backend가 담당한다. 단계별 구현은
1) core CRUD, 2) 태그 필터링/검색, 3) Markdown 렌더링 보강 순서로 진행한다.

## Technical Context

**Language/Version**: JavaScript with Node.js runtime for backend and modern browser JavaScript for React SPA  
**Primary Dependencies**: React SPA, Express, Axios (`추가 설치 필요 시 사용자 승인 후 진행`)  
**Storage**: `backend/data.json` local JSON file managed only by backend  
**Testing**: Repository-level manual verification via quickstart plus endpoint/flow checks; automated test tooling is deferred until dependency approval  
**Target Platform**: WSL Ubuntu development environment with desktop browser access  
**Project Type**: Web application monorepo with separated frontend and backend  
**Performance Goals**: Note create/edit/search/filter actions should feel immediate for a single-user local dataset; visible list updates should occur within 1 second for normal usage  
**Constraints**: Frontend/backend strict separation, REST-only communication, uniform response envelope, no auto-installed dependencies, inline editing inside note cards, createdAt descending sort, `YYYY. MM. DD. HH:mm` display format  
**Scale/Scope**: Single-user local app, hundreds to low thousands of notes, no authentication, no sync, no collaboration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: `/frontend` and `/backend` remain strictly separated; frontend communicates only through HTTP API calls.
- Pass: All backend contracts in this plan use `{ success: boolean, data: any, error: string | null }`.
- Pass: Persistence stays backend-owned through a file repository helper around `backend/data.json`, allowing later storage replacement.
- Pass: English-only identifiers and React PascalCase / general camelCase naming remain the expected code convention.
- Pass: No dependency installation is assumed in this plan. If React/Express/Axios setup or Markdown rendering requires packages not yet present, user approval must be requested before installation.
- Pass: UX remains inline-first, keyboard-friendly, and avoids unnecessary global state by keeping filters/search/editor state local unless proven necessary.
- Pass: Delivery is broken into reviewable slices: CRUD, filtering/search, then Markdown rendering enhancement.

## Project Structure

### Documentation (this feature)

```text
specs/001-study-note-app/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.js
│   ├── routes/
│   │   └── notesRoutes.js
│   ├── controllers/
│   │   └── notesController.js
│   ├── services/
│   │   └── notesService.js
│   ├── repositories/
│   │   └── fileNoteRepository.js
│   ├── utils/
│   │   ├── responseEnvelope.js
│   │   ├── dateFormat.js
│   │   └── normalizeTags.js
│   └── models/
│       └── note.js
└── data.json

frontend/
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── NoteComposer.jsx
│   │   ├── NoteCard.jsx
│   │   ├── NoteList.jsx
│   │   ├── SearchBar.jsx
│   │   └── TagFilterBar.jsx
│   ├── services/
│   │   └── notesApi.js
│   ├── hooks/
│   │   └── useKeyboardSave.js
│   ├── utils/
│   │   ├── formatDisplayDate.js
│   │   └── previewText.js
│   └── styles/
│       └── app.css
└── public/
```

**Structure Decision**: Web application monorepo structure is selected to match the constitution. Backend owns all file persistence and API logic; frontend stays component-centric and storage-agnostic.

## Phase Plan

### Phase 0: Research

- Confirm the minimal backend layering that still keeps file I/O isolated behind a repository helper.
- Confirm the frontend state strategy for immediate filtering/search without unnecessary global state.
- Confirm the Markdown rollout plan that starts with raw Markdown capture and adds rendered display as a later enhancement without breaking API contracts.
- Confirm local JSON persistence conventions that keep future database replacement straightforward.

### Phase 1: Design

- Define the `Note` entity, normalized tag rules, derived preview behavior, and CRUD lifecycle.
- Define REST contracts for list/create/update/delete and filter/search query behavior under the uniform response envelope.
- Define quickstart flow for WSL Ubuntu covering dependency approval, server start, frontend start, and manual verification order.
- Update agent context after artifacts are generated.

### Phase 2: Incremental Implementation Strategy

1. **Core CRUD**
   Create/list/update/delete notes, persist to `backend/data.json`, render note cards with title/time/tags/preview, and support inline save with `Ctrl/Cmd + Enter`.
2. **Filtering and Search**
   Add tag click filtering, title/content search, and combined filter application with immediate frontend feedback.
3. **Markdown Rendering Enhancement**
   Preserve Markdown input from day one, then add rendered read view in note cards after confirming dependency needs and obtaining approval if external packages are required.

## Post-Design Constitution Check

- Pass: Contracts preserve the response envelope across all CRUD and query endpoints.
- Pass: The design keeps data access exclusively in backend repository/service layers and uses only HTTP from frontend to backend.
- Pass: The implementation sequence preserves simple data flow and inline editing inside note cards.
- Pass: Dependency handling is explicit: React, Express, Axios, and any Markdown renderer remain planning inputs only until user approval is granted for installation.

## Complexity Tracking

No constitution violations are planned. Complexity is intentionally kept low by using one backend repository helper, one notes service, and local component state in the frontend.
