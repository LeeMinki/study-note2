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
- Frontend: React SPA with Vite and Axios-based HTTP integration.
- Backend: Node.js 22, CommonJS + Express 5, bcryptjs, jsonwebtoken, multer + `better-sqlite3`; SQLite 단일 파일 (`study-note.db`), hostPath PVC (`/var/lib/study-note/backend/`).
- Infrastructure: Terraform, single AWS EC2, k3s, Argo CD core, Kubernetes manifests.
- CI/CD: GitHub Actions, GitHub OIDC to AWS, Amazon ECR, GitOps image tag updates.

## Spec Kit Agent Switching

- Current `.specify/integration.json` is expected to point to Codex.
- Existing feature artifacts live under `specs/`, not `.specify/specs/`.
- To switch between Codex and Claude Code, follow `docs/agent-switching-guide.md` and preserve `.specify/memory/constitution.md`.

## Recent Changes
- 012-db-migration: 파일 기반 JSON 저장소를 SQLite(`better-sqlite3`)로 전환; dbUserRepository/dbNoteRepository, 스타트업 마이그레이션, PVC 설정, ECR pull secret 자동 갱신 CronJob 추가.
- 011-domain-https: 커스텀 도메인 `study-note.yuna-pa.com` + Let's Encrypt TLS + Elastic IP `3.39.3.103` 적용.
- 009-github-actions-deploy: PR validation, main deployment workflow, OIDC/ECR/GitOps handoff, and Argo CD runtime fixes are documented.
- 008-aws-mvp-deploy: AWS MVP runtime is applied on `ap-northeast-2` with Elastic IP `3.39.3.103` and domain `https://study-note.yuna-pa.com`.
