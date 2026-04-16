# Data Model: 계정 프로필 UI 및 상세정보 화면

**Date**: 2026-04-16 | **Feature**: 006-account-profile-ui

## CurrentUserProfile

| Field | Type | Editable | Notes |
|------|------|----------|-------|
| `id` | string | No | 사용자 식별자 |
| `email` | string | No | 로그인 이메일 |
| `name` | string | Yes | 필수 입력 |
| `displayName` | string | Yes | 필수 입력 |
| `createdAt` | string | No | 가입 시각 |
| `provider` | string | No | 현재 `"local"` |

## ProfileUpdateInput

```json
{
  "name": "홍길동",
  "displayName": "길동"
}
```

## 상태 전이

### Profile Load

1. 토큰 존재
2. `GET /api/auth/me`
3. 성공 시 `currentUser` 갱신
4. 401 시 세션 제거 후 인증 화면 복귀

### Profile Save

1. 프론트에서 빈 값 검증
2. `PATCH /api/auth/me`
3. 성공 시 `currentUser` 즉시 갱신
4. 실패 시 입력 상태 유지 후 재시도 가능
