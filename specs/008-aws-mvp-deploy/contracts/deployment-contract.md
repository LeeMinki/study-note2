# Deployment Contract: Study Note AWS MVP

## 1. Infrastructure Surface

### Terraform Root Inputs

The MVP Terraform environment must accept these logical inputs:

| Input | Required | Description |
|------|----------|-------------|
| `aws_region` | Yes | Single AWS region for all resources |
| `environment_name` | Yes | Fixed MVP environment label |
| `instance_type` | Yes | Low-cost EC2 instance class |
| `ssh_ingress_cidr` | Yes | Allowed operator SSH source range |
| `public_http_enabled` | Yes | Whether port 80 is exposed |
| `public_https_enabled` | Yes | Whether port 443 is exposed for optional follow-up |
| `bootstrap_mode` | Yes | Host bootstrap profile for k3s and Argo CD install |
| `registry_pull_mode` | Yes | How the cluster authenticates to the selected image registry |

### Terraform Root Outputs

| Output | Description |
|------|-------------|
| `public_endpoint` | Public IP or DNS target for initial app access |
| `instance_id` | EC2 instance identifier |
| `vpc_id` | VPC identifier |
| `subnet_id` | Public subnet identifier |
| `deployment_role_arn` | AWS role assumed by GitHub Actions OIDC |

## 2. GitHub Actions Surface

### PR Validation Workflow Contract

| Item | Contract |
|------|----------|
| Trigger | `pull_request` against `main` |
| Side effects | No image publish, no AWS mutation, no production deployment |
| Required checks | Terraform format/validate, frontend build, backend startup sanity, container image build, manifest sanity |
| Output | GitHub status checks suitable for protected branch rules |

### Main Deployment Workflow Contract

| Item | Contract |
|------|----------|
| Trigger | `push` to `main` |
| Auth | GitHub OIDC to AWS role assumption |
| Publish behavior | Build and publish frontend/backend images |
| Deploy behavior | Update GitOps deployment state and allow Argo CD reconciliation |
| Failure mode | Failed publish or manifest update must stop before claiming deployment success |

## 3. GitOps Surface

### Argo CD Application Source Contract

| Field | Contract |
|------|----------|
| Source repository | Same GitHub repository as application code |
| Source path | `infra/kubernetes/study-note/overlays/mvp` |
| Target cluster | Single local k3s cluster on the EC2 host |
| Sync target | Study Note frontend and backend resources only |
| Public exposure | One ingress endpoint only |

### Manifest Contract

The Kubernetes deployment structure must provide:

- One namespace for the Study Note app
- Separate frontend and backend workloads
- Stable in-cluster service discovery between frontend and backend
- One public ingress route
- ConfigMap or equivalent for non-secret runtime configuration
- Secret placeholders or secret references for sensitive values
- Persistent host-mounted paths for backend JSON data and uploads

## 4. Secrets Contract

| Secret / Credential | Scope | Storage Rule |
|---------------------|-------|--------------|
| AWS deployment credential | GitHub Actions only | OIDC role assumption, not long-lived access key |
| Registry publish credential | GitHub Actions | Stored in platform-native secret or short-lived auth flow |
| Backend JWT secret | Kubernetes runtime | Stored outside Git-tracked manifests |
| Runtime app variables | Kubernetes runtime | Secret or config separation documented in runbook |

## 5. Operational Contract

- Initial deployment must be possible from an empty AWS account state plus documented prerequisites.
- Re-deployment must not require manual edits on the EC2 host as a normal success path.
- Operators must be able to identify whether a failure happened in PR validation, image publishing, manifest update, or in-cluster reconciliation.
- Domain and HTTPS remain optional in the MVP and must not block first public access.
