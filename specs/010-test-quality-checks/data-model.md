# Data Model: Test and Quality Checks

## Quality Check

Represents one automated validation area in local or PR workflows.

Fields:

- `name`: Stable English check name shown in local output or GitHub status.
- `category`: One of `build`, `test`, `lint`, `format`, `manifest`, `terraform`, `environment`.
- `scope`: `frontend`, `backend`, `infra`, or `repository`.
- `required`: Whether this check is intended to block PR merge in the MVP.
- `command`: Documented local command or workflow step reference.
- `failureSignal`: Short description of what a failure means.
- `triageTarget`: First file, package, or document area to inspect when it fails.

Validation rules:

- `name` must remain stable once connected to branch protection.
- `required` checks must be documented in quickstart and operations guidance.
- PR checks must not mutate production, publish images, or update GitOps state.

## Required Status Check

Represents a GitHub branch protection status check.

Fields:

- `name`: Exact GitHub check name.
- `sourceWorkflow`: Workflow that produces the check.
- `purpose`: Why the check is required.
- `blocksMerge`: Always true for selected required checks.
- `owner`: Area responsible for fixing failures.

Initial required checks:

- `Terraform fmt and validate`: existing infra validation.
- `App and image build`: existing app build and Docker sanity; may include test steps if no separate test job is introduced.
- `Kubernetes manifest sanity`: existing manifest render check.
- `App tests`: preferred separate test signal if implementation chooses a separate job.

Validation rules:

- A required status check name must match the workflow job name exactly.
- `Deploy Main` must not be configured as a PR required check.
- New required checks must be documented before branch protection is updated.

## Test Scope

Represents the MVP boundary for what is tested now.

Fields:

- `area`: `backend` or `frontend`.
- `priority`: `P1`, `P2`, or `P3`.
- `behavior`: Behavior under validation.
- `includedNow`: Whether it is part of the 010 MVP.
- `futureCandidate`: Whether it is deferred to later specs.

Initial backend scope:

- Authentication success and failure.
- Protected route authentication failures.
- JSON response envelope success and error paths.
- Local JSON persistence empty-file and mounted-file write behavior.

Initial frontend scope:

- API base URL normalization.
- Image upload Authorization header propagation.
- Markdown rendering for fenced code blocks and existing supported syntax.

Deferred scope:

- Large E2E browser flows.
- Strict coverage threshold enforcement.
- Advanced security scanning.
- Performance testing.
- Broad component test suite.

## Failure Triage Guide

Represents the mapping from failed quality check to first action.

Fields:

- `failedCheck`: Name of the failed check.
- `likelyArea`: `frontend`, `backend`, `infra`, `workflow`, or `environment`.
- `firstInspection`: First command or file path to inspect.
- `commonCauses`: Short list of likely causes.
- `nextEscalation`: Where to look if the first inspection does not resolve it.

Validation rules:

- Every required check must have a triage entry.
- Triage guidance must distinguish build failures from test failures.
- Triage guidance must identify when a failure is caused by missing approved tooling rather than product behavior.
