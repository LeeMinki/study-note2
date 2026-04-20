# API Contracts: DB 마이그레이션

DB 전환 이후 모든 HTTP API 엔드포인트는 변경 없이 유지된다.
이 문서는 변경이 없음을 명시적으로 확인하기 위한 계약 스냅샷이다.

## 변경 없는 엔드포인트

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/auth/register` | 없음 | 회원가입 |
| POST | `/api/auth/login` | 없음 | 로그인 |
| GET | `/api/auth/me` | JWT | 내 프로필 조회 |
| PATCH | `/api/auth/me` | JWT | 프로필 수정 |
| PATCH | `/api/auth/me/password` | JWT | 비밀번호 변경 |
| GET | `/api/notes` | JWT | 노트 목록 (`?tag=`, `?search=`) |
| POST | `/api/notes` | JWT | 노트 생성 |
| PATCH | `/api/notes/:id` | JWT | 노트 수정 |
| DELETE | `/api/notes/:id` | JWT | 노트 삭제 |
| POST | `/api/images` | JWT | 이미지 업로드 |
| GET | `/api/health` | 없음 | 상태 확인 |

## 응답 봉투 (변경 없음)

```json
{
  "success": true | false,
  "data": <any>,
  "error": null | "<string>"
}
```

## 인증 방식 (변경 없음)

- JWT Bearer Token (`Authorization: Bearer <token>`)
- JWT payload: `{ userId, email }`
- 만료: 7일

## 주요 응답 형식 (변경 없음)

### User 객체

```json
{
  "id": "user_1234567890_abc12345",
  "email": "user@example.com",
  "name": "홍길동",
  "displayName": "길동",
  "createdAt": "2026-04-20T10:00:00.000Z",
  "provider": "local"
}
```

### Note 객체

```json
{
  "id": "note_1234567890_abc12345",
  "userId": "user_1234567890_abc12345",
  "title": "제목",
  "content": "내용",
  "tags": ["tag1", "tag2"],
  "createdAt": "2026-04-20T10:00:00.000Z",
  "updatedAt": "2026-04-20T10:00:00.000Z"
}
```
