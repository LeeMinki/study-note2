# Research: Study Note AWS MVP Deployment

## Decision 1: Single-region, single-EC2 AWS baseline

- **Decision**: Use one AWS region, one VPC, one public subnet, and one EC2 instance as the entire MVP runtime footprint.
- **Rationale**: This is the lowest-complexity path that still gives a real public deployment target. It avoids load balancers, NAT gateways, and cross-zone cost while staying aligned with the spec.
- **Alternatives considered**:
  - Elastic Beanstalk or App Runner: simpler app hosting, but conflicts with the requirement to run k3s and Argo CD on a single EC2 instance.
  - ECS on Fargate: operationally cleaner for containers, but not aligned with the k3s and GitOps constraints.
  - Multi-node Kubernetes: rejected as outside MVP cost and scope.

## Decision 2: Terraform root stack with minimal reusable modules

- **Decision**: Keep Terraform split into one environment root plus three modules: `network`, `compute`, and `identity`.
- **Rationale**: This is enough separation to keep the stack readable without over-engineering a tiny MVP. Network, instance runtime, and IAM change at different cadences and benefit from light modularity.
- **Alternatives considered**:
  - All Terraform in one flat directory: simpler initially, but harder to reason about once IAM, subnet, and compute outputs need reuse.
  - Heavy module decomposition for every AWS resource: rejected as needless abstraction for the MVP.

## Decision 3: Bootstrap EC2 with k3s in single-node server mode

- **Decision**: Install k3s directly on the EC2 instance through an idempotent bootstrap script referenced by Terraform user data.
- **Rationale**: k3s minimizes cluster footprint, has a straightforward install path, and suits a single-node environment well. User data keeps initial bootstrap automatic and reproducible.
- **Alternatives considered**:
  - kubeadm or full Kubernetes distro: heavier operational burden than necessary.
  - Manual SSH install steps: not repeatable enough for the target workflow.

## Decision 4: Argo CD core-first evaluation, full UI optional

- **Decision**: Plan around a lighter Argo CD deployment first and document full UI-enabled Argo CD as an allowed alternative if operators need a browser console.
- **Rationale**: The spec prioritizes low cost and simple operation. GitOps reconciliation is the must-have behavior; a full UI is valuable but not essential for the first MVP if it materially increases footprint or complexity.
- **Alternatives considered**:
  - Full Argo CD installation by default: easier operator discoverability, but higher resource usage and more exposed surface.
  - No GitOps controller: conflicts with the explicit requirement to have Argo CD manage deployment state.

## Decision 5: Plain manifests plus Kustomize-style overlays over Helm

- **Decision**: Use Kubernetes manifests organized as base plus `mvp` overlay rather than introducing Helm charts immediately.
- **Rationale**: The deployment surface is small enough that Helm templates would add abstraction without significant payoff. A manifest layout remains easy for Argo CD to read and easy for reviewers to audit.
- **Alternatives considered**:
  - Helm chart from the start: flexible for future environments, but unnecessary for one environment and two app workloads.
  - Raw manifests with no overlay structure: simpler, but less ready for later environment split.

## Decision 6: One public ingress endpoint, domain and HTTPS optional

- **Decision**: Expose one public endpoint for the app. Treat custom domain and HTTPS as optional follow-up enhancements, not MVP blockers.
- **Rationale**: Public reachability is the core success criterion. Requiring domain setup and certificate management in the first pass would slow delivery and introduce extra AWS resources or DNS coupling.
- **Alternatives considered**:
  - Require domain plus HTTPS immediately: stronger production posture, but slower setup and higher operational friction for MVP.
  - Expose separate frontend and backend public endpoints: increases surface area and complexity without user benefit.

## Decision 7: PR verification and main deployment split in GitHub Actions

- **Decision**: Use one workflow for PR checks and a separate workflow for main deployment. PRs never publish or deploy production state.
- **Rationale**: This maps cleanly to protected branch rules and prevents accidental production mutation from unmerged code.
- **Alternatives considered**:
  - Single workflow with branch conditionals: workable, but harder to reason about and audit.
  - Manual deployment only: rejected because the spec requires automatic deployment after main merge.

## Decision 8: GitHub Actions OIDC for AWS authentication

- **Decision**: Authenticate GitHub Actions to AWS using OIDC and role assumption rather than stored long-lived access keys.
- **Rationale**: OIDC reduces secret sprawl and aligns with the explicit clarification requirement. It also improves revocation and auditing compared with static credentials.
- **Alternatives considered**:
  - Long-lived AWS access keys in GitHub secrets: simpler at first, but weaker security and explicitly disfavored.
  - Manual operator credentials for deployment: not compatible with post-merge automatic deployment.

## Decision 9: Prefer Amazon ECR, compare with GHCR

- **Decision**: Compare Amazon ECR and GitHub Container Registry, with ECR as the leading option for AWS-local deployment and GHCR as a viable fallback if simplicity wins.
- **Rationale**: ECR keeps artifact hosting within AWS IAM boundaries and simplifies runtime pulls from EC2/k3s. GHCR can be simpler if the team wants fewer AWS resources, but introduces another permission surface.
- **Alternatives considered**:
  - Docker Hub: broad familiarity, but rate limits and external dependency risk make it less attractive for private automated deployment.
  - Self-hosted registry on the same EC2: lowest raw cost, but unacceptable operational coupling for the MVP.

## Decision 10: Minimal observability only

- **Decision**: Limit observability scope to basic pod, service, and workflow logs plus documented manual health checks.
- **Rationale**: The MVP needs enough information to diagnose failed deployments and simple runtime issues, but not a full logging or monitoring platform.
- **Alternatives considered**:
  - Prometheus, Grafana, Loki stack: useful long term, but well outside the simplicity and cost target.
  - No documented logging approach: too risky for even a single-node MVP.
