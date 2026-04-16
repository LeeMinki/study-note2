# Operations Contract: 009 Automatic Deployment

## Required GitHub Settings

- Repository variable `AWS_REGION` is set to the AWS MVP region.
- Repository variable `AWS_DEPLOY_ROLE_ARN` is set to the 008 deploy role ARN.
- No long-lived AWS access key is required for deployment.
- Branch protection can require:
  - `Terraform fmt and validate`
  - `App and image build`
  - `Kubernetes manifest sanity`

## Failure Classes

### PR Validation Failure

**First checks**:

- Identify failed required check name.
- Inspect frontend/backend build logs.
- Inspect Terraform validate output.
- Inspect Kubernetes manifest render output.

**Retry rule**:

- Rerun after code or manifest fix.
- Do not rerun as production deployment.

### OIDC Authentication Failure

**First checks**:

- `AWS_REGION` exists.
- `AWS_DEPLOY_ROLE_ARN` exists.
- Workflow has `id-token: write`.
- AWS IAM trust policy allows `repo:LeeMinki/study-note2:ref:refs/heads/main`.

**Retry rule**:

- Fix GitHub variable or IAM trust policy, then rerun failed workflow.

### ECR Publish Failure

**First checks**:

- ECR login step succeeded.
- Deploy role has ECR publish permissions.
- Repository names match `study-note-backend` and `study-note-frontend`.

**Retry rule**:

- If transient, rerun workflow.
- If permission or repository naming issue, fix configuration first.

### GitOps Update Failure

**First checks**:

- `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml` was updated.
- Image entries use the supported `- name:` structure.
- Rendered manifest is non-empty.
- Commit includes `[skip deploy]` to prevent recursion.

**Retry rule**:

- Fix manifest update logic or conflicting Git state, then rerun workflow.

### Argo CD Sync Failure

**First checks**:

- Argo CD Application `study-note-mvp` exists.
- Argo CD default AppProject exists.
- `argocd-secret` contains `server.secretkey`.
- Argo CD repo-server can resolve `github.com` through k3s CoreDNS.
- k3s node is ready.
- `study-note` namespace exists.
- ECR pull secret exists.
- Pods can pull the published image tags.

**Retry rule**:

- If GitOps state is correct, inspect cluster/Argo CD status.
- If image tags are wrong, fix GitOps state and let Argo CD reconcile again.

## 010 Test Expansion Points

- Add frontend tests to `App and image build` before frontend build.
- Add backend tests to `App and image build` before backend startup sanity.
- Add API contract tests after backend startup sanity.
- Promote test jobs into required checks only after 010 defines test scope and dependencies.
