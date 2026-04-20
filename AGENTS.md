# study-note2 Development Guidelines

Auto-generated from feature plans and curated for this repository. Last updated: 2026-04-17

## Active Technologies

- Frontend: React SPA with Vite, Axios-based HTTP integration, Docker image build.
- Backend: Node.js 22, Express, SQLite (`better-sqlite3`) persistence owned by the backend.
- Infrastructure: Terraform for AWS MVP infrastructure, k3s on a single EC2 instance, Argo CD core for GitOps reconciliation.
- CI/CD: GitHub Actions, GitHub OIDC to AWS, Amazon ECR images `study-note-backend` and `study-note-frontend`.
- Runtime manifests: Kubernetes YAML and Kustomize overlays under `infra/kubernetes/`.
- Quality checks: Node built-in `node --test` MVP tests for backend auth/protected routes/SQLite DB persistence and frontend API URL/image upload/Markdown rendering; new test/lint dependencies require approval before installation.

## Project Structure

```text
backend/
  src/
    db/
  Dockerfile
  package.json

frontend/
  src/
  Dockerfile
  package.json

infra/
  terraform/
  kubernetes/
  docs/

.github/
  workflows/

specs/
  001-study-note-app/
  002-expand-note-layout/
  003-image-paste-autosave/
  004-auth-login/
  005-signup-validation-and-fields/
  006-account-profile-ui/
  007-auth-form-reset-and-password-profile/
  008-aws-mvp-deploy/
  009-github-actions-deploy/
  010-test-quality-checks/
  011-domain-https/
  012-db-migration/
```

## Commands

```bash
# Frontend
cd frontend
npm ci
npm test
npm run build

# Backend
cd backend
npm ci
npm test
node -e "const { createApp } = require('./src/app'); const app = createApp(); const server = app.listen(0, () => server.close());"

# Docker image sanity
docker build -t study-note-backend:local -f backend/Dockerfile backend
docker build -t study-note-frontend:local -f frontend/Dockerfile frontend

# Terraform MVP validation
terraform fmt -check -recursive infra/terraform
terraform -chdir=infra/terraform/environments/mvp init -backend=false
terraform -chdir=infra/terraform/environments/mvp validate

# Kubernetes manifest sanity
kubectl kustomize infra/kubernetes/study-note/overlays/mvp
```

## Code Style

- Keep frontend and backend strictly separated. Frontend code must call backend only through HTTP APIs.
- Keep backend JSON responses in `{ success, data, error }` envelope form.
- Use English identifiers and filenames. Use PascalCase for React components and camelCase for variables/functions.
- Write code comments and commit messages in Korean.
- Do not install new packages without user approval.
- Prefer simple local state, direct data flow, and small reviewable changes.

## Deployment Notes

- PR workflows must validate only; they must not publish images or deploy production.
- Main merge workflows may publish images to ECR and update GitOps state.
- AWS access should use GitHub OIDC, not long-lived AWS access keys.
- Argo CD should reconcile from GitOps manifests; avoid direct cluster mutation from deployment workflows unless explicitly planned.
- Current MVP endpoint is `https://study-note.yuna-pa.com` (`http://3.39.3.103` Elastic IP) on EC2 `i-00e45b6e3c8a1308d` in `ap-northeast-2`.
- Argo CD core runtime needs the default AppProject, `argocd-secret` `server.secretkey`, and CoreDNS upstream resolution to GitHub.
- Terraform state, tfvars, MCP config, and local credentials must never be committed.

## Recent Changes
- 012-db-migration: Migrated from JSON-file storage to SQLite (`better-sqlite3`); added `dbUserRepository`/`dbNoteRepository`, startup migration script, Kubernetes PVC config, and ECR pull secret auto-refresh CronJob.
- 011-domain-https: Applied custom domain `study-note.yuna-pa.com` with Let's Encrypt TLS, Traefik HTTPS/www redirect middleware, and Elastic IP `3.39.3.103`.
- 010-test-quality-checks: Implemented Node built-in MVP tests, frontend/backend `npm test` scripts, existing 009 PR workflow test steps, and required checks documentation.
- 009-github-actions-deploy: Implemented PR checks, main deployment workflow, OIDC/ECR/GitOps handoff, runtime GitOps image tag fixes, and Argo CD core recovery notes.
- 008-aws-mvp-deploy: Applied AWS MVP deployment with Terraform, single EC2 k3s, Argo CD core, ECR integration, and runtime operations docs.
- 002-007: Added layout, image paste/autosave, authentication, profile, and password-management increments on top of the Study Note baseline.
- 001-study-note-app: Established the Study Note frontend/backend monorepo application baseline.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
