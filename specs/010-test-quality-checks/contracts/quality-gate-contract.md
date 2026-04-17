# Quality Gate Contract: 010 Test and Quality Checks

## PR Workflow Contract

Workflow: `PR Checks`

The PR workflow must remain production-safe.

Allowed actions:

- Install existing frontend/backend dependencies.
- Run selected MVP tests.
- Run frontend/backend build checks.
- Build local-only Docker images.
- Render Kubernetes manifests.
- Run Terraform formatting and validation checks.

Forbidden actions:

- Assume AWS deploy credentials.
- Login to ECR for publish.
- Push container images.
- Commit GitOps changes.
- Mutate the production cluster.
- Write production data.

## Required Status Checks

Initial required checks:

| Check name | Purpose | Required in 010 MVP |
|------------|---------|---------------------|
| `Terraform fmt and validate` | Keeps Terraform formatting and validation healthy | Yes |
| `App and image build` | Keeps frontend/backend build and Docker sanity healthy | Yes |
| `Kubernetes manifest sanity` | Keeps MVP Kubernetes render healthy | Yes |
| `App tests` | Preferred explicit test signal if implementation splits tests into a separate job | Yes if created |

If tests stay inside `App and image build`, that check remains the required build-and-test gate. If tests are split into `App tests`, both `App tests` and `App and image build` should be required.

Staged checks:

- `JavaScript lint`: Not required until tooling is approved and stable.
- `JavaScript format`: Not required until tooling is approved and stable.
- `Coverage report`: Optional visibility only; no threshold blocks merge in this spec.

## Test Contract

Backend MVP tests must cover:

- Register/login success and failure behavior.
- Protected route unauthenticated behavior.
- JSON response envelope on representative success and error paths.
- Local JSON persistence empty-file behavior.
- Local JSON persistence fallback behavior for file write replacement constraints.

Frontend MVP tests must cover:

- API base URL normalization for same-origin deployment and local development.
- Image upload request Authorization header behavior.
- Markdown rendering for fenced code blocks and existing supported Markdown syntax.

## Failure Contract

Every required check failure must identify one of these categories:

- `lint`
- `format`
- `build`
- `test`
- `manifest`
- `terraform`
- `environment`

Failure output or documentation must tell the developer:

- Which check failed.
- Which package or area to inspect first.
- Whether the failure blocks merge.
- Whether the failure is caused by missing unapproved tooling.

## Dependency Approval Contract

The implementation must not install new packages automatically.

If a new package is needed for tests, linting, formatting, coverage, or browser simulation:

1. Stop implementation.
2. Ask the user for approval.
3. Explain the package purpose and why existing dependencies or platform features are insufficient.
4. Continue only after approval.

## Future Extension Contract

Future specs may add:

- Browser E2E flows.
- Accessibility checks.
- Coverage thresholds.
- Advanced security scanning.
- Production smoke checks.

These must not be silently folded into the 010 MVP required gate.
