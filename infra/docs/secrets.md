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
| `AWS_DEPLOY_ROLE_ARN` | GitHub Actions variable | OIDC로 assume할 배포 role ARN |
| `AWS_REGION` | GitHub Actions variable | 단일 AWS 리전 |
| `JWT_SECRET` | Kubernetes Secret | 백엔드 JWT 서명 값 |
| `STUDY_NOTE_DB_FILE` | Kubernetes ConfigMap | SQLite DB 파일 경로 (`/var/lib/study-note/backend/study-note.db`) |
| `server.secretkey` | Kubernetes Secret `argocd-secret` | Argo CD core server secret key |

## GitHub OIDC 신뢰 정책 (T036)

`009` 자동배포는 장기 access key 없이 GitHub Actions OIDC로 AWS role을 assume한다.

| 항목 | 값 |
|------|-----|
| OIDC 공급자 URL | `https://token.actions.githubusercontent.com` |
| Audience | `sts.amazonaws.com` |
| Subject 조건 | `repo:LeeMinki/study-note2:ref:refs/heads/main` |
| 허용 브랜치 | `main` 브랜치 push에만 OIDC assume 허용 |

- subject 조건은 **main 브랜치 push 전용**이다. PR 브랜치에서는 AWS role을 assume할 수 없다.
- trust policy 변경 시 deploy workflow에서 OIDC 인증이 즉시 실패할 수 있으므로 반드시 PR + 검증 후 반영한다.
- Terraform `infra/terraform/modules/identity/main.tf`가 이 trust policy를 정의한다.

## 장기 AWS access key 금지 원칙 (T037)

**장기 AWS access key는 GitHub secrets에 배포 인증 기본 경로로 저장하지 않는다.**

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`를 GitHub secrets에 추가하는 것은 금지된 패턴이다.
- 배포 인증은 반드시 위 OIDC 신뢰 정책을 통해 단기 자격증명으로만 수행한다.
- OIDC 설정이 불가한 비상 상황에서도 장기 key 대신 대안 절차를 별도 승인 후 사용한다.

## ECR 인증

- GitHub Actions는 OIDC로 AWS role을 assume한 뒤 ECR 로그인을 수행한다.
- ECR repository는 `study-note-backend`, `study-note-frontend`를 기본 이름으로 사용한다.
- k3s 런타임 pull 권한은 EC2 bootstrap이 `study-note` namespace에 생성하는 `ecr-registry` imagePullSecret을 사용한다.
- `ecr-registry` 값은 ECR token 기반의 단기 인증 정보이므로 Git에 커밋하지 않는다.

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
- Argo CD core의 `server.secretkey`는 bootstrap에서 `argocd-secret`에 생성한다. 이 값도 Git에 커밋하지 않는다.

## GitHub Actions variables (T038)

`009` 배포에 필요한 GitHub repository 변수:

| 변수 이름 | 위치 | 설명 | 예시 |
|-----------|------|------|------|
| `AWS_REGION` | Settings → Variables → Actions | 배포 대상 AWS 리전 | `ap-northeast-2` |
| `AWS_DEPLOY_ROLE_ARN` | Settings → Variables → Actions | OIDC로 assume할 IAM role ARN | Terraform output `deployment_role_arn` |

설정 순서:

1. `terraform apply` 완료 후 output의 `deployment_role_arn` 값을 복사한다.
2. GitHub 저장소 → Settings → Secrets and variables → Actions → Variables 탭으로 이동한다.
3. `AWS_REGION`과 `AWS_DEPLOY_ROLE_ARN`을 각각 추가한다.
4. 변수가 설정되지 않으면 `[skip deploy]` 커밋이 아닌 `Deploy Main` workflow는 명시적으로 실패한다.

## 금지 사항

- AWS 장기 access key를 GitHub secrets에 기본 배포 인증으로 저장하지 않는다.
- Kubernetes Secret 값을 Git 추적 manifest에 실제 값으로 커밋하지 않는다.
- `.env`, `*.secret.yaml`, `terraform.tfvars`는 Git에 올리지 않는다.

## 회전 원칙

- `JWT_SECRET`을 바꾸면 기존 로그인 토큰은 무효화될 수 있다.
- AWS role trust policy 변경은 GitHub Actions 배포 실패로 이어질 수 있으므로 PR 검증 후 반영한다.
- registry 권한 변경 후에는 main 배포 workflow에서 ECR login과 push 단계를 확인한다.
