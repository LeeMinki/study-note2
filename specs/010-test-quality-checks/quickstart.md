# Quickstart: Test and Quality Checks

## 목적

010은 Study Note에 MVP 수준의 테스트와 품질 체크를 도입해 PR 단계에서 기본 회귀를 잡는 것을 목표로 한다. 과한 E2E 체계나 강제 coverage 정책은 이번 범위가 아니다.

## 사전 조건

- WSL Ubuntu 또는 Linux shell 환경
- frontend/backend dependencies 설치 가능 상태
- GitHub Actions `PR Checks` workflow 유지
- 새 패키지 설치가 필요하면 사용자 승인 선행

## 로컬 확인 흐름

현재 계획의 목표 로컬 흐름:

```bash
cd backend
npm ci
npm test
node -e "const { createApp } = require('./src/app'); const app = createApp(); const server = app.listen(0, () => server.close());"
```

```bash
cd frontend
npm ci
npm test
npm run build
```

주의:

- 현재 `npm test`는 placeholder일 수 있으며, implementation 단계에서 MVP 테스트 명령으로 교체한다.
- 새 test runner가 필요하면 설치 전 사용자 승인을 받아야 한다.
- coverage가 출력되더라도 이번 010에서는 merge 차단 조건으로 사용하지 않는다.

## GitHub PR 확인 흐름

PR에서 확인할 required checks:

- `Terraform fmt and validate`
- `App and image build`
- `Kubernetes manifest sanity`
- `App tests` if implementation creates a separate test job

원칙:

- PR checks는 production 배포를 하지 않는다.
- PR checks는 ECR publish나 GitOps commit을 하지 않는다.
- main merge 후 배포는 009 `Deploy Main` workflow가 계속 담당한다.

## 실패 시 확인 기준

| 실패 영역 | 먼저 확인할 것 |
|-----------|----------------|
| backend test | 인증, 보호 라우트, JSON envelope, local JSON persistence |
| frontend test | API base URL, 이미지 업로드 인증 헤더, Markdown 렌더링 |
| build | package install, build script, module import/export |
| manifest | `infra/kubernetes/study-note/overlays/mvp` render output |
| terraform | `infra/terraform` formatting and validation |
| lint/format | 도구 승인 여부, 설정 파일, 변경 파일 스타일 |

## MVP 범위 밖

- 대규모 E2E 테스트
- 성능 테스트
- 고급 보안 스캔
- strict coverage threshold
- 복잡한 테스트 인프라

## 완료 기준

- 최소 하나 이상의 의미 있는 자동 테스트가 PR 품질 게이트에 포함된다.
- build와 test가 PR merge readiness의 우선 required signal로 작동한다.
- lint/format은 구조와 승격 기준이 문서화된다.
- 009 자동배포 구조와 충돌하지 않는다.
- 로컬 실행법과 실패 해석 기준이 문서화된다.
