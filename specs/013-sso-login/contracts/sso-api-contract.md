# SSO API Contract: 013 SSO Login

## 신규 엔드포인트

### GET /api/auth/sso/:provider

SSO 인증 시작. 브라우저를 SSO 제공자 인증 페이지로 리다이렉트한다.

**Path parameter**: `provider` — 현재 지원: `google`

**Response**: `302 Redirect` → Google 인증 URL

Google 인증 URL 파라미터:
- `client_id`: Google OAuth2 Client ID
- `redirect_uri`: `https://study-note.yuna-pa.com/api/auth/sso/google/callback`
- `response_type`: `code`
- `scope`: `openid email profile`
- `state`: CSRF 방지용 임시 토큰

**Error** (provider 미지원):
```json
{
  "success": false,
  "data": null,
  "error": "지원하지 않는 SSO 제공자입니다."
}
```

---

### POST /api/auth/sso/:provider/link-start

로그인된 사용자의 Google 계정 연결 시작. SSO 제공자 인증 URL을 반환한다.

**Path parameter**: `provider` — 현재 지원: `google`

**Headers**: `Authorization: Bearer <jwt>` (필수)

**Response 200**:
```json
{
  "success": true,
  "data": { "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..." },
  "error": null
}
```

**Error 401** (미인증):
```json
{
  "success": false,
  "data": null,
  "error": "인증이 필요합니다."
}
```

---

### GET /api/auth/sso/:provider/callback

SSO 제공자 인증 완료 후 콜백. JWT 발급 후 프론트엔드로 리다이렉트한다.

**Path parameter**: `provider` — `google`

**Query parameters**:
- `code`: Authorization code (Google 발급)
- `state`: CSRF 검증용 state (요청 시 발급한 값과 일치해야 함)

**[로그인 흐름] 성공 시**: `302 Redirect` → `https://study-note.yuna-pa.com/#sso-token=<jwt>`

**[계정 연결 흐름] 성공 시**: `302 Redirect` → `https://study-note.yuna-pa.com/profile?link_success=true`

**실패 시 (공통)**: `302 Redirect` → `https://study-note.yuna-pa.com/?sso_error=<code>` 또는 `https://study-note.yuna-pa.com/profile?link_error=<code>`

오류 케이스:
- `state_mismatch`: CSRF state 불일치
- `email_not_verified`: Google 이메일 미인증
- `already_linked`: 해당 Google 계정이 이미 다른 계정에 연결됨 (연결 흐름 전용)
- `provider_error`: Google 측 인증 오류 (사용자 취소 포함)
- `server_error`: 서버 내부 오류

---

## 기존 엔드포인트 변경

### POST /api/auth/login (변경)

SSO + local 연결 계정(`password_hash` 보존)에 대한 비밀번호 로그인은 계속 허용 (두 방법 모두 가능).

SSO 전용 계정(`password_hash = NULL`, `provider != 'local'`)으로 비밀번호 로그인 시도 시:

```json
{
  "success": false,
  "data": null,
  "error": "이 계정은 Google 로그인을 사용합니다. Google로 로그인해 주세요."
}
```

---

## 프론트엔드 SSO/연결 결과 처리 흐름

**로그인 흐름**:
1. 앱 mount 시 `window.location.hash`에서 `sso-token` 추출
2. 토큰이 있으면 `localStorage['study-note-token']`에 저장, hash 즉시 제거
3. 이후 기존 auth 흐름과 동일 (GET /api/auth/me 호출)

**계정 연결 흐름**:
1. ProfileView "Google 계정 연결" 버튼 → `POST /api/auth/sso/google/link-start` → `authUrl` 수신
2. `window.location.href = authUrl`로 이동
3. 콜백 후 `/profile?link_success=true`로 돌아옴
4. App.jsx mount effect가 `link_success=true`를 감지 → `GET /api/auth/me` 재호출 → provider 갱신 → ProfileView 업데이트

**오류 처리**:
- `sso_error` query param: 로그인 실패 → 로그인 화면에 한국어 메시지
- `link_error` query param: 연결 실패 → ProfileView에 한국어 메시지 (`already_linked` 등)

---

## 환경변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `GOOGLE_CLIENT_ID` | Kubernetes Secret | Google OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET` | Kubernetes Secret | Google OAuth2 Client Secret |
| `GOOGLE_CALLBACK_URL` | Kubernetes ConfigMap | `https://study-note.yuna-pa.com/api/auth/sso/google/callback` |
| `APP_BASE_URL` | Kubernetes ConfigMap | `https://study-note.yuna-pa.com` (프론트 리다이렉트 기준) |
