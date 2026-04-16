# Research: GitHub Actions Automatic Deployment

## Decision: Use two workflow files

**Decision**: Keep `PR Checks` and `Deploy Main` as separate workflow files.

**Rationale**: PR and main have different permissions and side effects. Separating them keeps PR validation from accidentally publishing images or mutating production GitOps state while still keeping the total workflow count minimal.

**Alternatives considered**:

- Single workflow with conditional jobs: lower file count but higher permission and condition complexity.
- Many small workflows: clearer per concern but more operational noise and more required check management.

## Decision: PR workflow performs build-centered validation only

**Decision**: PR validation covers Terraform fmt/validate, app build/startup sanity, Docker image build, and Kubernetes manifest render sanity.

**Rationale**: There are no formal tests yet. These checks provide meaningful release safety without introducing new test dependencies or production side effects.

**Alternatives considered**:

- Add test framework now: deferred to 010 because the user explicitly scoped tests out of this step.
- Deploy preview environment per PR: rejected for cost and complexity.

## Decision: Main workflow publishes images and updates GitOps state

**Decision**: Only main push publishes backend/frontend images to ECR and updates the GitOps overlay image references.

**Rationale**: Main branch represents reviewed production intent. Publishing only from main avoids unreviewed PR images and keeps traceability to merged commits.

**Alternatives considered**:

- Publish images from PR: faster previews but violates production safety and increases registry churn.
- Manual deploy after merge: simpler automation but does not meet automatic deployment goal.

## Decision: Use GitHub OIDC for AWS access

**Decision**: Use GitHub OIDC with a repository/branch-scoped AWS deploy role.

**Rationale**: OIDC avoids storing long-lived AWS access keys in GitHub and aligns with the 008 identity module.

**Alternatives considered**:

- GitHub secrets with AWS access keys: rejected due to long-lived credential risk.
- Manual local deployment only: rejected because deployment success/failure must be visible in GitHub.

## Decision: Use 008 ECR repository structure

**Decision**: Use `study-note-backend` and `study-note-frontend` ECR repositories.

**Rationale**: The 008 MVP already defines separate frontend/backend images and ECR-friendly IAM flow. Keeping repository names stable reduces Argo CD and workflow churn.

**Alternatives considered**:

- Single combined image: simpler registry count but conflicts with existing frontend/backend deployment split.
- GHCR: viable later, but AWS-local ECR simplifies IAM and k3s pull credentials for this MVP.

## Decision: Argo CD sync via GitOps commit

**Decision**: Trigger deployment by committing updated image references to the GitOps overlay watched by Argo CD.

**Rationale**: This preserves Git as the source of truth and avoids exposing Argo CD API/UI or adding direct cluster credentials to GitHub Actions.

**Alternatives considered**:

- GitHub Actions directly applies Kubernetes manifests: simpler immediate deployment but bypasses Argo CD ownership.
- GitHub Actions calls Argo CD CLI/API: requires additional credentials and operational surface.

## Decision: Defer test framework to 010

**Decision**: Keep 009 workflows ready for test insertion but do not add new test packages or required test jobs.

**Rationale**: The user explicitly scoped test code out of the current phase. A later 010 spec can add test dependencies with user approval and promote those checks into required status checks.

**Alternatives considered**:

- Add tests opportunistically: rejected because it changes scope and may require new package approval.
