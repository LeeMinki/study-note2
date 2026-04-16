# Study Note AWS MVP 시크릿 문서

이 문서는 `008-aws-mvp-deploy` 구현 범위의 시크릿, 환경변수, 인증 정책을 정리한다.

## 기본 원칙

- AWS 인증은 장기 access key 대신 GitHub Actions OIDC를 우선한다.
- 컨테이너 이미지 저장소는 Amazon ECR을 기본안으로 둔다.
- GHCR은 후속 비교 후보로만 문서화하고 `008` 구현 기본 경로에는 포함하지 않는다.
- 애플리케이션 시크릿은 Git에 평문으로 커밋하지 않는다.

## MVP 시크릿 목록

| 이름 | 위치 | 설명 |
|------|------|------|
| `AWS_DEPLOY_ROLE_ARN` | GitHub Actions variable 또는 secret | OIDC로 assume할 배포 role ARN |
| `AWS_REGION` | GitHub Actions variable | 단일 AWS 리전 |
| `JWT_SECRET` | Kubernetes Secret | 백엔드 JWT 서명 값 |

## ECR 인증

- GitHub Actions는 OIDC로 AWS role을 assume한 뒤 ECR 로그인을 수행한다.
- ECR repository는 `study-note-backend`, `study-note-frontend`를 기본 이름으로 사용한다.
- k3s 런타임 pull 권한은 EC2 instance role 또는 imagePullSecret 중 더 단순한 경로로 후속 구현에서 확정한다.

## Kubernetes Secret 처리

`infra/kubernetes/study-note/base/secret-template.yaml`은 템플릿이다. 실제 값은 커밋하지 않는다.

수동 생성 예시:

```bash
kubectl create secret generic study-note-secret \
  --namespace study-note \
  --from-literal=JWT_SECRET='REPLACE_WITH_SECURE_VALUE'
```

주의:

- 위 명령은 클러스터 생성 후에만 실행한다.
- shell history에 민감값이 남지 않도록 운영 환경에서는 안전한 secret 주입 방식을 사용한다.

## GitHub Actions variables

권장 값:

- `AWS_REGION`: 예시 `ap-northeast-2`
- `AWS_DEPLOY_ROLE_ARN`: Terraform output `deployment_role_arn`

## 금지 사항

- AWS 장기 access key를 GitHub secrets에 기본 배포 인증으로 저장하지 않는다.
- Kubernetes Secret 값을 Git 추적 manifest에 실제 값으로 커밋하지 않는다.
- `.env`, `*.secret.yaml`, `terraform.tfvars`는 Git에 올리지 않는다.

## 회전 원칙

- `JWT_SECRET`을 바꾸면 기존 로그인 토큰은 무효화될 수 있다.
- AWS role trust policy 변경은 GitHub Actions 배포 실패로 이어질 수 있으므로 PR 검증 후 반영한다.
- registry 권한 변경 후에는 main 배포 workflow에서 ECR login과 push 단계를 확인한다.
