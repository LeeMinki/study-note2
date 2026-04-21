# Data Model: 013 SSO Login

## 변경 요약

**스키마 마이그레이션 없음.** `users` 테이블은 012-db-migration에서 이미 SSO를 위한 컬럼을 포함하고 있다.

## Users 테이블 (기존, 변경 없음)

```sql
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,           -- "user_{timestamp}_{random}"
  email         TEXT UNIQUE NOT NULL,       -- 소문자 정규화
  name          TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  password_hash TEXT,                       -- SSO 전용 계정은 NULL
  provider      TEXT NOT NULL DEFAULT 'local', -- 'local' | 'google'
  provider_id   TEXT,                       -- Google sub, NULL for local
  created_at    TEXT NOT NULL
);

-- 기존 인덱스 (변경 없음)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider_provider_id
  ON users(provider, provider_id) WHERE provider_id IS NOT NULL;
```

## 계정 상태 매트릭스

| provider | provider_id | password_hash | 설명 |
|----------|-------------|---------------|------|
| `local` | NULL | bcrypt hash | 일반 이메일/비밀번호 계정 |
| `google` | Google sub | NULL | 순수 SSO 계정 (최초 Google 로그인) |
| `google` | Google sub | bcrypt hash | SSO + local 연결 계정 (동일 이메일로 연결됨) |

> **연결 정책**: 동일 이메일의 local 계정에 SSO 로그인 시, `provider`를 'google'로, `provider_id`를 Google sub으로 업데이트한다. `password_hash`는 유지하여 local 로그인도 계속 허용한다.

## 신규 Repository 함수

기존 `dbUserRepository.js`에 추가:

```js
// provider + provider_id 기반 사용자 조회 (SSO 재로그인 시 사용)
findUserByProviderId(provider, providerId) → User | null
```

## 신규 Model 함수

기존 `models/user.js`에 추가:

```js
// SSO 최초 로그인 사용자 계정 생성용
createSSOUser({ email, name, displayName, provider, providerId }) → User

// 공개 사용자 객체 변환 (기존 함수에 providerId 추가)
toPublicUser(user) → {
  userId, email, name, displayName,
  provider, providerId  // ← 추가됨: 프론트엔드 연결 상태 표시에 사용
}
```

## SSOState (in-memory, DB 미저장)

OAuth2 CSRF 방지용 state 파라미터를 임시 관리. `userId`를 함께 저장해 로그인 흐름과 계정 연결 흐름을 구분한다:

```js
// Map<state: string, { createdAt: number, userId: string | null }>
// userId === null: 로그인 흐름
// userId === string: 계정 연결 흐름 (POST link-start 요청자의 userId)
// TTL: 10분, 사용 후 즉시 삭제 (replay 방지)
const ssoStateStore = new Map();
```

## Notes 테이블

변경 없음. `user_id` 기반 소유권 분리는 기존 구조 유지.
