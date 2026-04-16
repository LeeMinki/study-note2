# Data Model: 로그인/회원가입 및 계정별 노트 분리

**Date**: 2026-04-16 | **Feature**: 004-auth-login

## User

**저장소**: `backend/users.json`

| Field | Type | Required | Notes |
|------|------|----------|-------|
| `id` | string | Yes | `user_${timestamp}_${random}` 형식 |
| `email` | string | Yes | trim + lower-case, 중복 금지 |
| `passwordHash` | string | Yes | bcryptjs 해시값만 저장 |
| `name` | string | Yes | 이후 프로필 확장과 호환 |
| `displayName` | string | Yes | 이후 프로필 확장과 호환 |
| `provider` | string | Yes | 현재는 `"local"` |
| `createdAt` | string | Yes | ISO timestamp |

## AuthToken

**형식**: JWT

| Field | Type | Notes |
|------|------|-------|
| `userId` | string | 사용자 식별 |
| `email` | string | 로그인 사용자 이메일 |
| `exp` | number | 만료 시간 (`7d`) |

## Note Ownership

기존 Note 모델에 아래 필드가 추가된다.

| Field | Type | Required | Notes |
|------|------|----------|-------|
| `userId` | string | Yes | 노트 소유자 ID |

## 상태 전이

### Register

1. 이메일/비밀번호/프로필 입력 검증
2. 중복 이메일 검사
3. bcrypt 해시 생성
4. `users.json` 저장
5. JWT 발급 후 `{ token, user }` 반환

### Login

1. 이메일 정규화
2. 사용자 조회
3. bcrypt 비교
4. JWT 발급 후 `{ token, user }` 반환

### Authorized Note Access

1. `Authorization: Bearer <token>` 헤더 확인
2. JWT 검증 후 `req.user.userId` 주입
3. 노트 서비스에서 동일 `userId` 데이터만 조회/수정/삭제 허용
