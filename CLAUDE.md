# Project Guidance For Claude Code

This repository uses Spec Kit. The active local integration is currently Codex, but Claude Code may still work on the repository if the agent-specific command files are regenerated intentionally.

Treat the following as the source of truth for product and implementation context:

- `.specify/memory/constitution.md`
- `specs/**/spec.md`
- `specs/**/plan.md`
- `specs/**/tasks.md`
- `README.md`
- `AGENTS.md`

When working on changes:

- Prefer spec-driven updates over ad-hoc edits.
- Follow the project constitution first.
- Do not install new dependencies without explicit user approval.
- Keep comments and commit messages in Korean.
- Keep identifiers and filenames in English.
- Keep frontend and backend separated; frontend must communicate with backend only through HTTP APIs.

## Active Technologies
- Frontend: React 19 SPA with Vite and Axios-based HTTP integration.
- Backend: Node.js 22, CommonJS + Express 5, bcryptjs, jsonwebtoken, multer + `better-sqlite3`; SQLite 단일 파일 (`study-note.db`), hostPath PVC (`/var/lib/study-note/backend/`).
- Infrastructure: Terraform, single AWS EC2, k3s, Argo CD core, Kubernetes manifests.
- CI/CD: GitHub Actions, GitHub OIDC to AWS, Amazon ECR, GitOps image tag updates.
- Node.js 22 (backend), React 19 (frontend) + Express 5, better-sqlite3, jsonwebtoken, bcryptjs (기존 유지, 신규 패키지 없음) (013-sso-login)
- SQLite — `users` 테이블 `provider`/`provider_id` 컬럼 기존 활용 (013-sso-login)
- SQLite — 스키마 변경 없음 (docs/013-sso-spec-sync)
- React 19 + Vite + TipTap v3 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-font-family`, `@tiptap/extension-text-style`) (015-ui-polish)
- JWT sessionStorage 전환, `isRichContent()` 이중 포맷 감지 (015-ui-polish)
- User-owned single-level note groups with nullable `groupId`, SQLite `groups` table, group CRUD, and group/search/tag AND filtering (016-note-groups)

## Spec Kit Agent Switching

- Current `.specify/integration.json` is expected to point to Codex.
- Existing feature artifacts live under `specs/`, not `.specify/specs/`.
- To switch between Codex and Claude Code, follow `docs/agent-switching-guide.md` and preserve `.specify/memory/constitution.md`.

## Recent Changes
- 016-note-groups: 사용자별 단일 계층 그룹 CRUD, 노트 `groupId` 할당/해제, 그룹 없음 필터, 검색/태그/그룹 AND 필터, 백엔드 계정 격리 테스트와 프론트 그룹 UI 구현
- 015-ui-polish: TipTap v3 WYSIWYG 에디터 도입, CSS 디자인 토큰, 전 UI 한국어화, JWT sessionStorage 전환, 이미지 인증 셀렉터 버그 수정
- 014-security-hardening: 레거시 JSON 마이그레이션 제거, 명시적 CORS/JWT secret 정책, 이미지 인증 접근 제어, 인증 rate limit, PR npm audit 도입
- 013-sso-login: Added Node.js 22 (backend), React 19 (frontend) + Express 5, better-sqlite3, jsonwebtoken, bcryptjs (기존 유지, 신규 패키지 없음)
