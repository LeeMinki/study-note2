# Implementation Plan: SSO Login

**Branch**: `013-sso-login` | **Date**: 2026-04-20 | **Spec**: [spec.md](spec.md)

## Summary

Google OAuth2 Authorization Code Flow를 Node.js 22 내장 `fetch`로 직접 구현해 신규 패키지 없이 SSO 로그인을 추가한다. DB 스키마는 012-db-migration에서 이미 `provider`/`provider_id` 컬럼이 준비되어 있어 마이그레이션 불필요. 백엔드에 SSO 라우트/서비스를 추가하고, 프론트엔드 `AuthForm`에 Google 버튼을 추가하는 것이 전체 변경 범위다.

## Technical Context

**Language/Version**: Node.js 22 (backend), React 18 (frontend)
**Primary Dependencies**: Express 5, better-sqlite3, jsonwebtoken, bcryptjs (기존 유지, 신규 패키지 없음)
**Storage**: SQLite — `users` 테이블 `provider`/`provider_id` 컬럼 기존 활용
**Testing**: Node.js 내장 test runner (`node --test`)
**Target Platform**: Linux (k3s), WSL Ubuntu (개발)
**Performance Goals**: SSO 콜백 처리 < 2초 (Google API 호출 포함)
**Constraints**: 신규 npm 패키지 없음, 단일 프로세스 state store (in-memory Map)

## Constitution Check

- ✅ **monorepo 경계**: SSO 콜백/JWT 발급은 백엔드에서만 처리. 프론트엔드는 버튼 렌더링과 URL hash 토큰 추출만 담당
- ✅ **JSON envelope**: 신규 엔드포인트 `/api/auth/sso/:provider` 오류 응답 및 `/api/auth/login` 변경 모두 `{ success, data, error }` 형식 준수
- ✅ **storage 소유권**: DB 접근은 `dbUserRepository` 경유. `users` 테이블 스키마 변경 없음
- ✅ **naming**: 신규 파일 `ssoService.js`, `ssoController.js`, `ssoRoutes.js`, `SSOButton.jsx` — 규칙 준수
- ✅ **신규 패키지**: 없음. Node.js 22 내장 `fetch` 활용
- ✅ **UX**: AuthForm 내 인라인 버튼 추가, 모달 없음
- ✅ **WSL 친화**: 표준 npm/bash 흐름

## Project Structure

### Documentation (this feature)

```text
specs/013-sso-login/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sso-api-contract.md
└── tasks.md
```

### Source Code 변경 범위

```text
backend/
  src/
    repositories/
      dbUserRepository.js        [수정] findUserByProviderId() 추가
    models/
      user.js                    [수정] createSSOUser() 추가
    services/
      ssoService.js              [신규] Google OAuth2 흐름, 계정 조회/생성/연결
    controllers/
      ssoController.js           [신규] SSO 라우트 핸들러
    routes/
      ssoRoutes.js               [신규] GET /sso/:provider, GET /sso/:provider/callback
      authRoutes.js              [수정] SSO 라우트 마운트
    app.js                       [수정] ssoRoutes 마운트
    services/
      authService.js             [수정] SSO 계정 password_hash NULL 체크 추가

frontend/
  src/
    components/
      AuthForm.jsx               [수정] Google 로그인 버튼 추가
    App.jsx                      [수정] 초기화 시 URL hash sso-token 처리

infra/
  kubernetes/study-note/base/
    secret-template.yaml         [수정] GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 추가
    configmap.yaml               [수정] GOOGLE_CALLBACK_URL, APP_BASE_URL 추가
  docs/
    secrets.md                   [수정] 신규 시크릿 항목 추가
```

## Phase 0: Research ✅

완료. [research.md](research.md) 참조.

핵심 결정:
- OAuth2 직접 구현 (Node.js 22 `fetch`, 신규 패키지 없음)
- JWT를 URL fragment(`#sso-token=<jwt>`)로 전달
- DB 스키마 변경 없음 (기존 `provider`/`provider_id` 컬럼 활용)
- `email_verified: true` 조건으로만 이메일 기반 계정 연결 허용

## Phase 1: Design ✅

완료. [data-model.md](data-model.md), [contracts/sso-api-contract.md](contracts/sso-api-contract.md), [quickstart.md](quickstart.md) 참조.

## 구현 상세

### Backend: ssoService.js

```
buildGoogleAuthUrl(state)
  → Google 인증 URL 생성 (client_id, redirect_uri, scope, state)

exchangeCodeForToken(code)
  → POST https://oauth2.googleapis.com/token
  → access_token 반환

getGoogleUserInfo(accessToken)
  → GET https://www.googleapis.com/oauth2/v3/userinfo
  → { sub, email, email_verified, name } 반환

findOrCreateUser(googleProfile)
  1. findUserByProviderId('google', sub) → 기존 SSO 계정 반환
  2. findUserByEmail(email) → 이메일 일치 local 계정 확인
     - 있으면: provider/provider_id 업데이트 후 반환 (연결)
     - 없으면: createSSOUser() → saveUser() → 반환
```

### Backend: state 관리

```
generateState() → crypto.randomUUID() 기반 16자리 hex
storeState(state) → Map에 TTL 10분으로 저장
validateAndConsumeState(state) → 검증 후 즉시 삭제 (replay 방지)
```

### Frontend: URL hash 토큰 처리 (App.jsx)

```jsx
useEffect(() => {
  const hash = window.location.hash;
  if (hash.includes('sso-token=')) {
    const token = new URLSearchParams(hash.slice(1)).get('sso-token');
    if (token) {
      localStorage.setItem('token', token);
      history.replaceState(null, '', window.location.pathname);
      // 기존 useAuth hook의 loadUser() 트리거
    }
  }
  // sso_error query param 처리
  const params = new URLSearchParams(window.location.search);
  const ssoError = params.get('sso_error');
  if (ssoError) {
    // authError 상태로 전달
  }
}, []);
```

### 계정 연결 로직

```
SSO 로그인 시:
  1. Google sub으로 조회 → 있으면 해당 계정으로 JWT 발급
  2. 없으면 이메일로 조회:
     a. email_verified: false → 오류 (계정 연결 거부)
     b. local 계정 있음 → provider='google', provider_id=sub 업데이트
        password_hash 유지 (local 로그인도 계속 가능)
     c. 계정 없음 → 신규 SSO 계정 생성 (password_hash=null)
```

### local 로그인 SSO 계정 처리 (authService.login 수정)

```
비밀번호 로그인 시 user.passwordHash === null이면:
  → "이 계정은 Google 로그인을 사용합니다. Google로 로그인해 주세요." 오류
```

## 환경변수

| 변수 | 위치 | 예시 |
|------|------|------|
| `GOOGLE_CLIENT_ID` | k8s Secret | `1234567890-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | k8s Secret | `GOCSPX-...` |
| `GOOGLE_CALLBACK_URL` | k8s ConfigMap | `https://study-note.yuna-pa.com/api/auth/sso/google/callback` |
| `APP_BASE_URL` | k8s ConfigMap | `https://study-note.yuna-pa.com` |

로컬 개발은 `.env` 또는 환경변수 직접 설정 (`.env.example` 추가 예정).

## 운영 체크리스트

1. Google Cloud Console → OAuth2 앱 생성 → Client ID/Secret 발급
2. 승인된 리다이렉트 URI 등록:
   - `https://study-note.yuna-pa.com/api/auth/sso/google/callback`
   - `http://localhost:3001/api/auth/sso/google/callback` (로컬 테스트용)
3. k8s Secret에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 등록
4. k8s ConfigMap에 `GOOGLE_CALLBACK_URL`, `APP_BASE_URL` 추가
5. 배포 후 `curl -I https://study-note.yuna-pa.com/api/auth/sso/google` → 302 확인
