# study-note2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-16

## Active Technologies
- YAML for GitHub Actions and Kubernetes manifests, HCL for existing Terraform IAM/OIDC structure, shell for WSL/Linux verification commands, existing Node.js 22 frontend/backend build runtime + GitHub Actions hosted runners, Docker build on GitHub Actions, AWS OIDC deploy role from 008, Amazon ECR repositories `study-note-backend` and `study-note-frontend`, Argo CD core, k3s, existing frontend/backend npm dependencies (009-github-actions-deploy)
- No application storage change; deployment state is represented by GitOps manifest updates under `infra/kubernetes/study-note/overlays/mvp` (009-github-actions-deploy)

- HCL for infrastructure, YAML for Kubernetes/GitHub Actions, shell scripts for EC2 bootstrap, existing Node.js frontend/backend runtime + Terraform CLI, AWS provider, k3s installer, Argo CD, GitHub Actions, container registry integration (008-aws-mvp-deploy)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

# Add commands for HCL for infrastructure, YAML for Kubernetes/GitHub Actions, shell scripts for EC2 bootstrap, existing Node.js frontend/backend runtime

## Code Style

HCL for infrastructure, YAML for Kubernetes/GitHub Actions, shell scripts for EC2 bootstrap, existing Node.js frontend/backend runtime: Follow standard conventions

## Recent Changes
- 009-github-actions-deploy: Added YAML for GitHub Actions and Kubernetes manifests, HCL for existing Terraform IAM/OIDC structure, shell for WSL/Linux verification commands, existing Node.js 22 frontend/backend build runtime + GitHub Actions hosted runners, Docker build on GitHub Actions, AWS OIDC deploy role from 008, Amazon ECR repositories `study-note-backend` and `study-note-frontend`, Argo CD core, k3s, existing frontend/backend npm dependencies

- 008-aws-mvp-deploy: Added HCL for infrastructure, YAML for Kubernetes/GitHub Actions, shell scripts for EC2 bootstrap, existing Node.js frontend/backend runtime + Terraform CLI, AWS provider, k3s installer, Argo CD, GitHub Actions, container registry integration

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
