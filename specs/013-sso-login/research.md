# Research: 013 SSO Login

## Decision 1: OAuth2 구현 방식 — 라이브러리 vs. 직접 구현

**Decision**: Node.js 22 내장 `fetch` API를 사용한 직접 구현 (신규 패키지 없음)

**Rationale**:
- Node.js 22는 `fetch`를 글로벌로 제공하므로 HTTP 호출에 별도 패키지 불필요
- Google OAuth2 Authorization Code Flow는 단 3단계(리다이렉트 URL 생성 → 코드 교환 → userinfo 조회)이므로 `passport` 같은 프레임워크 없이 구현 가능
- Constitution의 "기존 의존성 우선, 신규 패키지는 승인 후 설치" 원칙에 부합
- `passport` + `passport-google-oauth20`은 미들웨어 패턴에 강하게 결합되어 있어 Express 5와의 호환성 검증 비용이 있음

**Alternatives considered**:
- `passport` + `passport-google-oauth20`: 가장 널리 사용되지만 신규 패키지 2개 추가 필요, Express 5 호환 검증 필요
- `google-auth-library` (Google 공식): 기능 과다, 신규 패키지 필요
- `openid-client`: 표준 준수이나 신규 패키지 필요

---

## Decision 2: SSO 콜백 후 프론트엔드로 JWT 전달 방식

**Decision**: 백엔드 → 프론트엔드 URL fragment 리다이렉트 (`/#sso-token=<jwt>`)

**Rationale**:
- URL fragment(#)는 HTTP 요청에 포함되지 않으므로 JWT가 서버 로그에 노출되지 않음
- 프론트엔드 SPA는 페이지 로드 시 `window.location.hash`를 확인하고 토큰 추출 후 localStorage에 저장, hash를 즉시 제거
- 기존 `localStorage` 기반 JWT 세션 관리와 자연스럽게 통합됨
- 쿠키 방식보다 단순하고 기존 auth 흐름과 일관됨

**Alternatives considered**:
- Query parameter (`?token=<jwt>`): 서버 로그 및 브라우저 히스토리에 토큰 노출 위험
- HTTP-only 쿠키: 보안상 우수하나 기존 localStorage JWT 세션과 이중 인증 방식 혼재, 추가 CSRF 대응 필요
- Dedicated `/sso-callback` route: SPA에서 별도 라우트 필요, React Router 없으면 복잡

---

## Decision 3: DB 스키마 변경 필요 여부

**Decision**: 스키마 변경 없음 — 기존 컬럼 그대로 사용

**Rationale**:
- `users` 테이블에 이미 `provider TEXT NOT NULL DEFAULT 'local'`, `provider_id TEXT` 컬럼이 존재 (`db/index.js` 확인)
- `dbUserRepository.js`에 `saveUser`/`updateUser`가 `provider`, `providerId` 필드를 이미 처리 중
- `models/user.js`의 `toPublicUser`가 이미 `provider` 필드를 반환
- `idx_users_provider_provider_id` 인덱스도 이미 생성되어 있음
- 필요한 추가: `findUserByProviderId(provider, providerId)` 함수만 `dbUserRepository`에 추가

---

## Decision 4: state parameter (CSRF 방지)

**Decision**: `state` 파라미터를 생성하여 세션에 저장하고 콜백에서 검증

**Rationale**:
- OAuth2 Authorization Code Flow의 필수 보안 요소
- CSRF 공격자가 임의의 콜백 요청을 주입하는 것을 방지
- Express에 별도 세션 라이브러리 없이 짧은 TTL의 in-memory Map으로 구현 가능 (단일 서버 프로세스 전제)

**Alternatives considered**:
- `express-session`: 세션 관리 패키지 추가 필요
- state 없이 구현: 보안 취약, 권고되지 않음

---

## Decision 5: Google OAuth2 API 엔드포인트

- 인증 URL: `https://accounts.google.com/o/oauth2/v2/auth`
- 토큰 교환: `https://oauth2.googleapis.com/token`
- 사용자 정보: `https://www.googleapis.com/oauth2/v3/userinfo`
- 필요 scope: `openid email profile`
- 제공 필드: `sub` (고유 ID), `email`, `email_verified`, `name`, `given_name`, `family_name`

---

## Decision 6: 이메일 기준 계정 연결 — 보안 고려

**Decision**: Google이 `email_verified: true`를 반환하는 경우에만 이메일 기반 자동 연결 허용

**Rationale**:
- Google은 이메일 인증 여부를 `email_verified` 필드로 제공
- 미인증 이메일로 기존 local 계정과 자동 연결하면 계정 탈취 가능
- `email_verified: false`인 경우 계정 연결 거부 후 오류 메시지 표시
