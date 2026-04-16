# Data Model: Study Note AWS MVP Deployment

## DeploymentEnvironment

- **Purpose**: Represents the single live AWS-hosted MVP environment for Study Note.
- **Fields**:
  - `name`: canonical environment name, fixed to MVP
  - `awsRegion`: single AWS region identifier
  - `publicEndpoint`: public IP or DNS endpoint used for external access
  - `vpcId`: associated virtual network identifier
  - `subnetId`: public subnet identifier
  - `instanceId`: EC2 instance identifier
  - `clusterMode`: single-node k3s mode
  - `gitOpsMode`: Argo CD core-first or full UI-enabled mode
  - `ingressMode`: single public ingress path
  - `domainMode`: absent, optional custom domain, or enabled custom domain
  - `httpsMode`: absent, optional follow-up, or enabled
- **Relationships**:
  - Owns one `BootstrapConfiguration`
  - Owns one active `ApplicationRelease`
  - References one `SecretInventory`
  - Is operated through one or more `WorkflowRun` records
- **Validation Rules**:
  - Exactly one live environment is in scope for this feature
  - `awsRegion` must resolve to one region only
  - `publicEndpoint` must point to exactly one exposed entry path for the app

## BootstrapConfiguration

- **Purpose**: Captures the infrastructure and host bootstrap inputs needed to turn a new EC2 instance into the Study Note runtime.
- **Fields**:
  - `instanceType`: low-cost EC2 instance class selected for MVP
  - `osImage`: Linux image selection used for EC2
  - `bootstrapScriptPath`: repository path to the user-data bootstrap logic
  - `k3sVersion`: targeted k3s release line
  - `argoInstallMode`: core-first or full install mode
  - `hostDataRoot`: host directory root for backend persistence
  - `requiredPorts`: inbound ports needed for SSH, HTTP, and optional HTTPS
- **Relationships**:
  - Belongs to one `DeploymentEnvironment`
- **Validation Rules**:
  - Must be idempotent enough for instance replacement or rerun
  - Must define storage paths for backend JSON data and uploads
  - Must not assume manual post-boot setup as a required success path

## ApplicationRelease

- **Purpose**: Defines the deployable Study Note application state that Argo CD reconciles into the cluster.
- **Fields**:
  - `frontendImage`: frontend container reference
  - `backendImage`: backend container reference
  - `manifestPath`: GitOps path watched by Argo CD
  - `overlayName`: selected environment overlay, fixed to MVP
  - `configVersion`: versioned non-secret runtime configuration set
  - `secretVersion`: current secret set reference
  - `releaseStatus`: pending, active, degraded, or failed
- **Relationships**:
  - Belongs to one `DeploymentEnvironment`
  - Reads from one `SecretInventory`
  - Is updated by one or more `WorkflowRun` records
- **Validation Rules**:
  - Frontend and backend image references must be published before deployment update
  - `manifestPath` must resolve to one GitOps application source
  - `releaseStatus` must reflect whether reconciliation succeeded
- **State Transitions**:
  - `pending` → `active` when manifests reconcile successfully
  - `pending` → `failed` when publish or reconciliation fails
  - `active` → `degraded` when runtime health checks fail
  - `degraded` → `active` after successful redeploy or recovery

## WorkflowRun

- **Purpose**: Represents a CI or CD execution path triggered from GitHub Actions.
- **Fields**:
  - `workflowType`: PR validation or main deployment
  - `gitRef`: pull request ref or `main`
  - `commitSha`: source revision under evaluation
  - `triggerEvent`: pull request or push
  - `result`: succeeded, failed, or cancelled
  - `artifactsProduced`: validation reports and/or published image references
  - `deploymentAttempted`: boolean flag
- **Relationships**:
  - May update one `ApplicationRelease`
- **Validation Rules**:
  - PR validation runs must set `deploymentAttempted` to false
  - Main deployment runs may publish images and update manifests

## SecretInventory

- **Purpose**: Tracks required runtime secrets and deployment credentials without storing their values in Git.
- **Fields**:
  - `awsRoleArn`: OIDC-assumable deployment role reference
  - `registryCredentialsMode`: AWS-native, GitHub-native, or equivalent registry auth mode
  - `backendJwtSecret`: backend authentication secret reference
  - `appRuntimeVariables`: non-secret app configuration keys list
  - `kubernetesSecretNames`: in-cluster secret object names
  - `rotationOwner`: who rotates the secret set
- **Relationships**:
  - Supports one `DeploymentEnvironment`
  - Is consumed by one `ApplicationRelease`
- **Validation Rules**:
  - Long-lived AWS access keys are not allowed as the primary deployment credential
  - Secret values must exist outside Git-tracked manifests

## ImageRegistryOption

- **Purpose**: Represents a candidate container registry evaluated for the MVP.
- **Fields**:
  - `name`: registry option name
  - `costProfile`: relative cost expectation for low-volume MVP use
  - `authModel`: how CI authenticates and how the cluster pulls images
  - `awsAffinity`: whether the registry integrates directly with AWS IAM/runtime
  - `operationalComplexity`: low, medium, or high
  - `selectionStatus`: preferred, fallback, or rejected
- **Relationships**:
  - One option is referenced by the active `ApplicationRelease`
- **Validation Rules**:
  - At least one preferred option must support automated CI publishing
  - Comparison must document tradeoffs, not only one candidate
