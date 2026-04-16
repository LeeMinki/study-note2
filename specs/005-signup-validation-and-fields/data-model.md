# Data Model: 회원가입 검증 및 프로필 필드 확장

**Date**: 2026-04-16 | **Feature**: 005-signup-validation-and-fields

## User Profile Fields

| Field | Type | Required | Validation |
|------|------|----------|------------|
| `name` | string | Yes | trim 후 비어 있으면 안 됨, 최대 30자 |
| `displayName` | string | Yes | trim 후 비어 있으면 안 됨, 최대 30자 |

## RegistrationFormState

프론트엔드 회원가입 폼 상태는 아래 필드를 가진다.

| Field | Type | Notes |
|------|------|-------|
| `name` | string | 회원 실명 또는 기본 이름 |
| `displayName` | string | 앱 표시 이름 |
| `email` | string | 이메일 |
| `password` | string | 원본 비밀번호 입력 |
| `passwordConfirm` | string | 클라이언트 전용 확인 필드 |

## 응답 모델 변화

### Register Response

```json
{
  "success": true,
  "data": {
    "token": "jwt",
    "user": {
      "id": "user_xxx",
      "email": "user@example.com",
      "name": "홍길동",
      "displayName": "길동",
      "createdAt": "2026-04-15T00:00:00.000Z",
      "provider": "local"
    }
  },
  "error": null
}
```

### Login Response

로그인 응답도 동일한 `user` 구조를 반환한다.
