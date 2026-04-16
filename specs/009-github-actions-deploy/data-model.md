# Data Model: GitHub Actions Automatic Deployment

## Validation Workflow

**Represents**: PR-time checks that verify a change without deploying it.

**Fields**:

- `name`: Fixed workflow display name, `PR Checks`.
- `trigger`: Pull requests targeting `main`.
- `permissions`: Read-only repository contents.
- `checks`: Required Check Set entries.
- `productionImpact`: Must be `none`.

**Validation rules**:

- Must not publish images.
- Must not assume AWS deploy role.
- Must not update GitOps manifests.
- Must expose stable job names for branch protection.

## Deployment Workflow

**Represents**: Main-branch release workflow that publishes images and updates GitOps state.

**Fields**:

- `name`: Fixed workflow display name, `Deploy Main`.
- `trigger`: Push to `main`.
- `permissions`: Repository contents write and OIDC token write.
- `imageTag`: Git commit SHA.
- `repositories`: `study-note-backend`, `study-note-frontend`.
- `gitOpsPath`: `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml`.

**Validation rules**:

- Must not run recursively for GitOps tag commits containing `[skip deploy]`.
- Must use OIDC role assumption rather than AWS access keys.
- Must record success/failure in GitHub Actions.

## Deployment Credential Trust

**Represents**: AWS trust boundary allowing GitHub Actions to assume the deploy role.

**Fields**:

- `oidcProvider`: `https://token.actions.githubusercontent.com`.
- `audience`: `sts.amazonaws.com`.
- `subject`: `repo:LeeMinki/study-note2:ref:refs/heads/main`.
- `roleVariable`: `AWS_DEPLOY_ROLE_ARN`.
- `regionVariable`: `AWS_REGION`.

**Validation rules**:

- Trust must be scoped to the repository and main branch.
- Long-lived AWS access keys must not be required for deployment.

## Image Release

**Represents**: A pair of deployable frontend/backend images for one merged commit.

**Fields**:

- `commitSha`: Source Git commit SHA.
- `backendImage`: ECR image reference for `study-note-backend`.
- `frontendImage`: ECR image reference for `study-note-frontend`.
- `publishedAt`: GitHub Actions run time.
- `publishStatus`: `pending`, `published`, or `failed`.

**Relationships**:

- Belongs to one Deployment Workflow run.
- Updates one GitOps State when publish succeeds.

## GitOps State

**Represents**: Declarative deployment target watched by Argo CD.

**Fields**:

- `path`: MVP overlay path.
- `backendTag`: Backend image tag.
- `frontendTag`: Frontend image tag.
- `commitMessageMarker`: `[skip deploy]`.
- `syncConsumer`: Argo CD Application `study-note-mvp`.

**Validation rules**:

- Must reference the same commit SHA for frontend and backend in a single deployment.
- Must render as valid Kubernetes manifests after update.
- Must not trigger infinite workflow recursion.

## Required Check Set

**Represents**: Branch-protection-compatible PR check names.

**Fields**:

- `terraformCheck`: `Terraform fmt and validate`.
- `appBuildCheck`: `App and image build`.
- `manifestCheck`: `Kubernetes manifest sanity`.

**Validation rules**:

- Check names must remain stable unless branch protection documentation is updated.
- Each required check must fail clearly when its responsibility fails.

## Recovery Point

**Represents**: Manual diagnosis or retry boundary after workflow failure.

**Fields**:

- `failureClass`: `pr-validation`, `oidc-auth`, `ecr-publish`, `gitops-update`, `argocd-sync`.
- `firstLogLocation`: GitHub job or cluster command to inspect first.
- `retryRule`: When GitHub Actions rerun is sufficient and when configuration changes are required.

**Validation rules**:

- Every failure class must be documented in quickstart or operations docs.
- Recovery must not require storing long-lived AWS keys.
