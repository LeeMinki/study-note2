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

### GET /api/auth/sso/:provider/callback

SSO 제공자 인증 완료 후 콜백. JWT 발급 후 프론트엔드로 리다이렉트한다.

**Path parameter**: `provider` — `google`

**Query parameters**:
- `code`: Authorization code (Google 발급)
- `state`: CSRF 검증용 state (요청 시 발급한 값과 일치해야 함)

**성공 시**: `302 Redirect` → `https://study-note.yuna-pa.com/#sso-token=<jwt>`

**실패 시**: `302 Redirect` → `https://study-note.yuna-pa.com/?sso_error=<message>`

오류 케이스:
- `state_mismatch`: CSRF state 불일치
- `email_not_verified`: Google 이메일 미인증
- `provider_error`: Google 측 인증 오류 (사용자 취소 포함)
- `server_error`: 서버 내부 오류

---

## 기존 엔드포인트 변경

### POST /api/auth/login (변경)

SSO로 연결된 계정에 local 비밀번호 로그인 시 동작 변경 없음 (두 방법 모두 허용 정책).

단, SSO 전용 계정(`password_hash = NULL`)으로 비밀번호 로그인 시도 시:

```json
{
  "success": false,
  "data": null,
  "error": "이 계정은 Google 로그인을 사용합니다. Google로 로그인해 주세요."
}
```

---

## 프론트엔드 SSO 토큰 처리 흐름

1. 앱 초기 로드 시 `window.location.hash`에서 `sso-token` 추출
2. 토큰이 있으면 localStorage에 저장, hash 즉시 제거 (`history.replaceState`)
3. `sso_error` query param이 있으면 로그인 화면에 오류 메시지 표시
4. 이후 기존 auth 흐름과 동일하게 처리

---

## 환경변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `GOOGLE_CLIENT_ID` | Kubernetes Secret | Google OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET` | Kubernetes Secret | Google OAuth2 Client Secret |
| `GOOGLE_CALLBACK_URL` | Kubernetes ConfigMap | `https://study-note.yuna-pa.com/api/auth/sso/google/callback` |
| `APP_BASE_URL` | Kubernetes ConfigMap | `https://study-note.yuna-pa.com` (프론트 리다이렉트 기준) |
