# Implementation Plan: Study Note AWS MVP Deployment

**Branch**: `008-aws-mvp-deploy` | **Date**: 2026-04-16 | **Spec**: [spec.md](/home/hyerin/speckit/study-note2/specs/008-aws-mvp-deploy/spec.md)
**Input**: Feature specification from `/specs/008-aws-mvp-deploy/spec.md`

## Summary

Study Note를 AWS 단일 리전, 단일 EC2 기반의 저비용 MVP 환경으로 배포한다. Terraform으로 최소 네트워크와 서버를 관리하고, EC2 부트스트랩에서 k3s를 준비한 뒤 같은 인스턴스에 경량 우선 Argo CD 구성을 올린다. 애플리케이션은 Kubernetes 리소스로 배포하며, GitHub Actions는 PR 검증과 main 병합 후 이미지 publish 및 GitOps 반영을 분리한다. 운영 문서는 외부 접속, 시크릿 주입, 재배포, 기본 복구까지 포함하고, 고가용성·멀티 환경·본격 observability는 후속 spec으로 남긴다.

## Technical Context

**Language/Version**: HCL for infrastructure, YAML for Kubernetes/GitHub Actions, shell scripts for EC2 bootstrap, existing Node.js frontend/backend runtime
**Primary Dependencies**: Terraform CLI, AWS provider, k3s installer, Argo CD, GitHub Actions, container registry integration
**Storage**: AWS state backend deferred for MVP; application data remains backend-owned local JSON files mounted on the EC2 host
**Testing**: No new test framework in scope; validation checks focus on `terraform fmt/validate`, frontend build, backend startup sanity, container image build, Kubernetes manifest sanity
**Target Platform**: Single AWS region, single Linux EC2 instance running k3s
**Project Type**: Monorepo web application plus infrastructure-as-code and deployment automation
**Performance Goals**: External users can reach one public endpoint after deployment; redeploy path should complete without manual server SSH edits
**Constraints**: Lowest-cost MVP, one EC2 instance, one public endpoint, no HA, no multi-node, PR verification must not deploy production, main merge triggers publish and deployment reconciliation
**Scale/Scope**: Internal or low-traffic MVP validation environment for one deployed Study Note stack

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- `/frontend` and `/backend` boundary remains intact. This feature adds `infra/`, deployment manifests, and CI/CD automation only; frontend/backend integration continues over HTTP APIs.
- No backend response shape changes are planned. Existing API envelope `{ success, data, error }` remains unchanged because deployment is infrastructure-facing, not product-API facing.
- Backend storage ownership remains in the backend. Deployment design preserves local JSON persistence by mounting backend data and uploads paths on the single EC2 host.
- Naming policy remains compliant: planned code and file identifiers stay English-only; future comments and commits remain Korean.
- No new repository package installation is assumed in this plan. If implementation later requires new project dependencies or local tooling wrappers, that change will be flagged for user approval first.
- UX impact is neutral: this feature does not alter product editing flows, global state, or modal behavior.
- Work can be split into small slices: infra bootstrap, cluster add-ons, app manifests, CI checks, deployment workflow, and docs.

**Post-Design Re-check**:

- Pass. The proposed structure keeps infrastructure separate from application runtime code and does not violate monorepo boundaries.
- Pass. No new backend endpoints are introduced by the deployment plan.
- Pass. Local JSON persistence stays backend-owned and is exposed to Kubernetes through host-mounted storage only.
- Pass. Dependency approval remains an implementation-time gate, not an assumed change in this plan.

## Project Structure

### Documentation (this feature)

```text
specs/008-aws-mvp-deploy/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── deployment-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── data.json
├── users.json
├── uploads/
├── package.json
└── src/
    ├── app.js
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── repositories/
    ├── routes/
    ├── services/
    └── utils/

frontend/
├── package.json
├── index.html
└── src/
    ├── App.jsx
    ├── components/
    ├── hooks/
    ├── services/
    ├── styles/
    └── utils/

infra/
├── terraform/
│   ├── environments/
│   │   └── mvp/
│   ├── modules/
│   │   ├── network/
│   │   ├── compute/
│   │   └── identity/
│   └── scripts/
│       └── ec2-bootstrap.sh
├── kubernetes/
│   ├── argocd/
│   │   ├── install/
│   │   └── applications/
│   └── study-note/
│       ├── base/
│       └── overlays/
│           └── mvp/
└── docs/
    ├── operations.md
    └── secrets.md

.github/
└── workflows/
    ├── pr-checks.yml
    └── deploy-main.yml
```

**Structure Decision**: Keep the existing web monorepo intact and add a top-level `infra/` tree for Terraform, Kubernetes, and runbook materials. GitHub Actions remains under `.github/workflows/`. This isolates deployment logic from app code while preserving the constitution’s `/frontend` and `/backend` boundaries.

## Phase 0 Research Output

Research decisions are recorded in [research.md](/home/hyerin/speckit/study-note2/specs/008-aws-mvp-deploy/research.md). Key outcomes:

- Use a single-region VPC with one public subnet and one EC2 instance for the MVP baseline.
- Prefer Argo CD core-first evaluation to reduce footprint, while documenting full UI mode as an upgrade path if operational need appears.
- Use one public ingress endpoint for the app; keep domain/HTTPS optional and compare them rather than requiring them immediately.
- Split GitHub Actions into PR validation and main deployment workflows, with deployment only after merge.
- Prefer GitHub Actions OIDC for AWS authentication.
- Compare GHCR and Amazon ECR for image storage, with ECR favored for AWS-local simplicity and GHCR retained as a lower-friction alternative if cost and permissions are acceptable.

## Phase 1 Design Output

### Infra Directory Structure

- `infra/terraform/environments/mvp`
  Contains the root Terraform stack for the single AWS region MVP.
- `infra/terraform/modules/network`
  Defines VPC, public subnet, internet gateway, route table, and outputs required by compute.
- `infra/terraform/modules/compute`
  Defines the EC2 instance, instance profile, security group bindings, elastic or public IP association, and user data linkage.
- `infra/terraform/modules/identity`
  Defines the minimal IAM roles and policies needed for EC2 runtime and GitHub Actions OIDC deployment access.
- `infra/terraform/scripts/ec2-bootstrap.sh`
  Idempotent EC2 bootstrap script for host preparation, k3s install, Argo CD install, namespace creation, and base storage directories.

### Terraform Module/File Structure

`infra/terraform/environments/mvp`:

```text
main.tf
providers.tf
variables.tf
outputs.tf
terraform.tfvars.example
versions.tf
```

Design notes:

- Root stack wires `network`, `compute`, and `identity` modules only.
- Avoid NAT gateway, private subnets, load balancers, managed databases, or autoscaling groups for MVP cost control.
- User data references `ec2-bootstrap.sh` via template rendering so bootstrap stays readable and testable.
- State backend can start local for first bootstrap if AWS backend is not yet prepared; migrating remote state is deferred and documented.

### k3s / Argo CD Installation Strategy

- Bootstrap runs on first EC2 startup and is safe to re-run manually.
- k3s is installed in single-node server mode with default embedded datastore to minimize cost and operational surface.
- Host directories for backend JSON data and uploads are created before app deployment.
- Argo CD is installed after k3s health is confirmed.
- Default evaluation path is Argo CD core-oriented setup to reduce resource use.
  If operators need a browser UI during MVP validation, full Argo CD installation remains an allowed alternative documented in research.
- Argo CD watches the repository path for Study Note manifests and reconciles app state inside the same cluster.

### App Deployment Structure

Use plain Kubernetes manifests with environment overlay rather than Helm for the MVP.

Rationale:

- The app is a single frontend plus backend deployment and does not yet justify Helm templating complexity.
- Kustomize-compatible base/overlay structure stays lightweight and readable.
- Argo CD consumes this structure directly without requiring a chart packaging step.

Planned layout:

```text
infra/kubernetes/study-note/
├── base/
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret-template.yaml
│   ├── persistent-path-notes.md
│   └── kustomization.yaml
└── overlays/
    └── mvp/
        ├── kustomization.yaml
        ├── patches/
        └── values.env.example
```

Design notes:

- Backend uses hostPath-backed storage for `data.json`, `users.json`, and `uploads/` because the single-node MVP explicitly accepts host affinity.
- Frontend and backend images are published separately.
- Ingress exposes one public endpoint only.
- Domain/HTTPS support stays optional and can be layered later without changing the base app structure.

### GitHub Actions Workflow Design

`pr-checks.yml`:

- Trigger: `pull_request` targeting `main`
- Purpose: status checks and protected-branch integration only
- Jobs:
  - Terraform formatting and validation
  - Frontend dependency install and build
  - Backend dependency install and startup sanity
  - Frontend and backend container image build
  - Kubernetes manifest sanity check
- Explicitly does not publish images or touch AWS

`deploy-main.yml`:

- Trigger: `push` to `main`
- Purpose: publish images, update deployable state, and let Argo CD reconcile
- Jobs:
  - Authenticate to AWS using GitHub OIDC
  - Authenticate to chosen image registry
  - Build and publish frontend/backend images
  - Update deployable image tags or manifest references in the GitOps path
  - Validate manifest consistency after tag update
  - Rely on Argo CD reconciliation for in-cluster rollout

Protected branch design:

- `main` requires successful `pr-checks` status before merge.
- Production deployment is impossible from PR context by design.

### Operations Documentation

Produce and maintain:

- `infra/docs/operations.md`
  Covers initial bootstrap, external endpoint checks, main deployment flow, redeploy steps, rollback or rollback-adjacent recovery, and common failure triage.
- `infra/docs/secrets.md`
  Lists required runtime secrets, where they are sourced, how they are injected into GitHub Actions and Kubernetes, and how rotation works in MVP scope.
- `specs/008-aws-mvp-deploy/quickstart.md`
  Gives a reproducible first-run path from AWS prerequisites to live app verification.

### Follow-up Specs

- Route 53 + ACM + HTTPS termination hardening
- Remote Terraform state backend and locking
- Multi-environment split for `dev/staging/prod`
- HA or multi-node k3s migration path
- Centralized logging, metrics, alerting, and dashboards
- Backup and restore strategy for backend JSON data and uploads
- Rollback automation and deployment promotion strategy
- Image vulnerability scanning and stronger supply-chain policy

## Complexity Tracking

No constitution violations or exceptional complexity justifications are required for this plan. The main tradeoff is accepting single-node and host-bound storage to minimize cost for the MVP.
