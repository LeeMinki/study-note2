# Data Model: 인증 폼 상태 초기화 및 프로필 비밀번호 변경 지원

**Date**: 2026-04-16 | **Feature**: 007-auth-form-reset-and-password-profile

## AuthFormStateBuckets

### LoginFormState

| Field | Type |
|------|------|
| `email` | string |
| `password` | string |

### RegisterFormState

| Field | Type |
|------|------|
| `name` | string |
| `displayName` | string |
| `email` | string |
| `password` | string |
| `passwordConfirm` | string |

## PasswordChangeInput

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

프론트엔드는 추가로 `newPasswordConfirm`을 관리하지만 서버에는 전송하지 않는다.

## Password Change Flow

1. 프로필 화면에서 현재 비밀번호/새 비밀번호/새 비밀번호 확인 입력
2. 프론트에서 최소 길이와 확인값 일치 검증
3. `PATCH /api/auth/me/password`
4. 서버에서 현재 비밀번호 bcrypt 비교
5. 성공 시 새 해시 저장 후 `{ updated: true }` 반환
6. 프론트에서 민감 입력 필드 초기화
