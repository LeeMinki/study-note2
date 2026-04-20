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
- Node.js 22, CommonJS + Express 5, bcryptjs, jsonwebtoken, multer + `better-sqlite3` (신규, NEEDS USER APPROVAL) (012-db-migration)
- SQLite 단일 파일 (`study-note.db`), hostPath PVC (`/var/lib/study-note/backend/`) (012-db-migration)

- Frontend: React SPA with Vite and Axios-based HTTP integration.
- Backend: Node.js 22, Express, local JSON-file persistence owned by the backend.
- Infrastructure: Terraform, single AWS EC2, k3s, Argo CD core, Kubernetes manifests.
- CI/CD: GitHub Actions, GitHub OIDC to AWS, Amazon ECR, GitOps image tag updates.

## Spec Kit Agent Switching

- Current `.specify/integration.json` is expected to point to Codex.
- Existing feature artifacts live under `specs/`, not `.specify/specs/`.
- To switch between Codex and Claude Code, follow `docs/agent-switching-guide.md` and preserve `.specify/memory/constitution.md`.

## Recent Changes
- 012-db-migration: Added Node.js 22, CommonJS + Express 5, bcryptjs, jsonwebtoken, multer + `better-sqlite3` (신규, NEEDS USER APPROVAL)

- 009-github-actions-deploy: PR validation, main deployment workflow, OIDC/ECR/GitOps handoff, and Argo CD runtime fixes are documented.
- 008-aws-mvp-deploy: AWS MVP runtime is applied on `ap-northeast-2` with public endpoint `http://3.38.149.233`.
