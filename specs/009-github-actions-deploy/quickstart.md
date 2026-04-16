# Quickstart: GitHub Actions Automatic Deployment

## Preconditions

- 008 AWS MVP infrastructure has been applied.
- EC2 k3s and Argo CD core are installed.
- Argo CD Application `study-note-mvp` exists.
- GitHub repository variables are configured:
  - `AWS_REGION`
  - `AWS_DEPLOY_ROLE_ARN`
- No long-lived AWS access key is stored as the default deployment credential.

## PR Verification Flow

1. Create a branch from `main`.
2. Push a code or deployment manifest change.
3. Open a PR targeting `main`.
4. Confirm `PR Checks` runs.
5. Confirm these check names appear:
   - `Terraform fmt and validate`
   - `App and image build`
   - `Kubernetes manifest sanity`
6. Confirm no production deployment or ECR push happens from the PR workflow.

## Main Deployment Flow

1. Merge a PR into `main` after checks pass.
2. Confirm `Deploy Main` starts on GitHub Actions.
3. Confirm `Check required variables` succeeds. If `AWS_REGION` or `AWS_DEPLOY_ROLE_ARN` is missing, the workflow must fail explicitly.
4. Confirm AWS credential configuration succeeds through OIDC.
5. Confirm ECR login succeeds.
6. Confirm backend and frontend images are pushed with the merge commit SHA.
7. Confirm the MVP GitOps overlay is updated with the new image references.
8. Confirm the workflow commits the GitOps update with `[skip deploy]`.
9. Confirm Argo CD reconciles the updated GitOps path.
10. Confirm the public endpoint shows the latest version.

## Required Status Checks

Recommended branch protection checks:

- `Terraform fmt and validate`
- `App and image build`
- `Kubernetes manifest sanity`

Do not require `Deploy Main` as a PR status check because it runs after merge.

## Failure Triage

### PR checks fail

- Check the failed job name first.
- Fix build, Docker, Terraform, or manifest issues in the PR.
- Rerun the PR workflow after pushing fixes.

### Main deploy fails before image push

- Check `Check required variables` first.
- Check `AWS_REGION` and `AWS_DEPLOY_ROLE_ARN`.
- Check the AWS IAM OIDC trust policy.
- Check ECR login and repository permissions.

### Main deploy fails after image push

- Check the GitOps overlay update step.
- Check manifest render output.
- Check whether the `[skip deploy]` commit was created.
- If the commit step fails, check whether branch protection blocks `github-actions[bot]` from pushing the GitOps update.

### App does not update after workflow success

- Check Argo CD Application status.
- Check k3s pods in the `study-note` namespace.
- Check image pull errors and the `ecr-registry` pull secret.

## 010 Test Placeholder

009 intentionally keeps validation build-centered. A follow-up 010 spec should add:

- frontend test command
- backend test command
- API contract test command
- decisions on required test checks
