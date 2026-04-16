# Workflow Contract: 009 GitHub Actions Automatic Deployment

## PR Checks Workflow

**Workflow name**: `PR Checks`

**File**: `.github/workflows/pr-checks.yml`

**Trigger**:

- `pull_request` targeting `main`

**Permissions**:

- `contents: read`

**Required check names**:

- `Terraform fmt and validate`
- `App and image build`
- `Kubernetes manifest sanity`

**Allowed actions**:

- Checkout source.
- Install existing project dependencies.
- Build frontend.
- Run backend startup sanity.
- Build frontend/backend Docker images with local PR tags.
- Render Kubernetes manifests.
- Validate Terraform format and configuration.

**Forbidden actions**:

- Assume AWS deploy role.
- Login to ECR.
- Push container images.
- Commit GitOps changes.
- Trigger production deployment.

## Deploy Main Workflow

**Workflow name**: `Deploy Main`

**File**: `.github/workflows/deploy-main.yml`

**Trigger**:

- `push` to `main`
- Must skip if the triggering commit message contains `[skip deploy]`.

**Permissions**:

- `contents: write`
- `id-token: write`

**Required repository variables**:

- `AWS_REGION`
- `AWS_DEPLOY_ROLE_ARN`

**Variable handling**:

- If the triggering commit does not contain `[skip deploy]`, missing `AWS_REGION` or `AWS_DEPLOY_ROLE_ARN` must fail the workflow explicitly before image publish.
- `[skip deploy]` commits are the only expected skip path for deployment recursion prevention.

**Image repositories**:

- `study-note-backend`
- `study-note-frontend`

**Required deployment sequence**:

1. Checkout source.
2. Configure AWS credentials by assuming `AWS_DEPLOY_ROLE_ARN` through GitHub OIDC.
3. Login to Amazon ECR.
4. Ensure or use the two ECR repositories.
5. Build backend image tagged with the main commit SHA.
6. Build frontend image tagged with the main commit SHA.
7. Push both images.
8. Update MVP GitOps overlay image names and tags.
9. Render manifests after update.
10. Commit and push GitOps state with `[skip deploy]`.
11. Leave final reconciliation to Argo CD.

**Branch protection note**:

- The GitOps update commit is pushed by `github-actions[bot]`.
- If branch protection blocks that push, the deployment run must fail at the GitOps commit step and operators must either allow the bot push for this path or apply the same image tag update through the documented manual recovery flow.

**Forbidden actions**:

- Store long-lived AWS access keys in GitHub secrets.
- Deploy directly from PR context.
- Bypass GitOps state by directly applying manifests to the cluster.
- Add advanced Argo CD operational features in 009.

## Branch Protection Contract

Recommended required status checks for `main`:

- `Terraform fmt and validate`
- `App and image build`
- `Kubernetes manifest sanity`

Rationale:

- These checks match PR validation responsibilities and are stable names suitable for GitHub branch protection.
- `Deploy Main` is not a required PR check because it only runs after merge.
