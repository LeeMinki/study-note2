# Spec Kit Artifact Audit (2026-04-16)

## 목적

`specs/002~007` 구간에서 Spec Kit 산출물 생성 패턴이 feature별로 달라진 상태를 점검하고, 현재 코드 기준으로 어떤 문서를 복구했는지 기록한다.

## 산출물 누락 현황

| Feature | 기존 상태 | 조치 |
|---|---|---|
| `002-expand-note-layout` | `quickstart.md` 누락, 기존 `data-model.md`가 2단계 레이아웃 기준 | `quickstart.md` 추가, `research.md`/`data-model.md`를 3단계 레이아웃 구현 기준으로 보정 |
| `003-image-paste-autosave` | `quickstart.md` 누락 | `quickstart.md` 추가 |
| `004-auth-login` | `research.md`, `data-model.md`, `quickstart.md` 누락 | 3개 문서 추가 |
| `005-signup-validation-and-fields` | `research.md`, `data-model.md`, `quickstart.md` 누락 | 3개 문서 추가 |
| `006-account-profile-ui` | `research.md`, `data-model.md`, `quickstart.md` 누락 | 3개 문서 추가 |
| `007-auth-form-reset-and-password-profile` | `research.md`, `data-model.md`, `quickstart.md` 누락 | 3개 문서 추가 |

## 코드-문서 정합성 메모

### 002 레이아웃 기능

- 현재 코드는 `narrow/default/wide` 3단계 레이아웃을 지원한다.
- 기존 `data-model.md`와 `research.md`는 `default/wide` 2단계 중심으로 남아 있었다.
- 이번 복구에서 localStorage 값과 상태 흐름 설명을 3단계 기준으로 맞췄다.

### 003 이미지 업로드 / 임시저장

- 현재 이미지 업로드 API는 인증 보호 상태다.
- 초기 문서는 로그인 전제를 충분히 드러내지 않았고, 빠른 실행 가이드도 없었다.
- 이번 복구에서 로그인 후 수동 검증 흐름을 `quickstart.md`에 명시했다.

### 004~007 인증/프로필 계열

- 실제 코드는 인증, 프로필, 비밀번호 변경까지 이어지는 연속 기능 집합으로 확장되어 있다.
- 기존에는 `spec/plan/tasks`만 남아 있어서 구현 배경과 데이터 모델을 새 작업자가 추론해야 했다.
- 이번 복구에서 `users.json`, JWT, `currentUser`, `passwordChange` 같은 실제 코드 개념을 문서에 다시 연결했다.

## 남은 메모

- `001-study-note-app`만 `contracts/openapi.yaml`이 유지되고, 이후 feature에는 별도 contracts 산출물이 없다.
- 이번 작업 범위는 사용자가 직접 지적한 `research/data-model/quickstart` 복구와 코드-문서 정합성 보정에 집중했다.

## 008/009 배포 문서 추가 점검

### 확인된 불일치

- `README.md`에는 `009-github-actions-deploy` 섹션이 없어서 현재 자동배포 구현 상태가 드러나지 않았다.
- `README.md`, `infra/docs/operations.md`, `specs/008-aws-mvp-deploy/quickstart.md` 일부 문구가 실제 AWS 적용 전 상태로 남아 있었다.
- `CLAUDE.md`는 산출물 위치를 `.specify/specs/**`로 안내했지만 실제 저장소는 `specs/**`를 사용한다.
- `docs/agent-switching-guide.md`도 같은 경로 오기를 포함하고 있었다.
- `infra/docs/secrets.md`는 k3s ECR pull secret과 `Deploy Main` 변수 누락 실패 동작을 최신 구현대로 설명하지 않았다.
- `009` 산출물은 실제 런타임 복구로 추가된 default AppProject, `server.secretkey`, CoreDNS upstream 보강 사항을 충분히 반영하지 않았다.

### 반영 조치

- README에 `009-github-actions-deploy` 현황과 현재 공인 엔드포인트를 추가했다.
- AGENTS/CLAUDE/agent-switching 문서를 Codex 활성 통합과 실제 `specs/**` 경로 기준으로 맞췄다.
- 운영/시크릿 문서를 현재 배포된 EC2, Argo CD, ECR pull secret, OIDC 동작 기준으로 보정했다.
- 008/009 quickstart와 009 plan/tasks에 런타임 검증 결과와 Argo CD core 복구 항목을 반영했다.
- `.specify/init-options.json`과 `.specify/integration.json`을 Codex 통합 기준으로 정리했다.
