# Data Model: 014 Security Hardening

## 스키마 변경 없음

이번 기능은 DB 스키마를 변경하지 않는다. `users`, `notes` 테이블 구조는 012-db-migration에서 확정된 상태를 유지한다.

## 제거 대상: In-Memory 마이그레이션 상태

`migrate.js`가 제거되면 아래 런타임 상태가 없어진다:

```
migrate.js (제거됨):
  - USERS_FILE: process.env.STUDY_NOTE_DATA_DIR + /users.json
  - NOTES_FILE: process.env.STUDY_NOTE_DATA_DIR + /data.json
  - readJsonSafe(): 파일 읽기 헬퍼
  - migrateUsers(db): users.json → users 테이블
  - migrateNotes(db): data.json → notes 테이블
  - migrate(db): 위 두 함수 호출
```

제거 후 `app.js`에서 해당 `require`와 `migrate(db)` 호출도 함께 제거된다.

## 신규: In-Memory Rate Limit Store

속도 제한을 위한 in-process 상태 (DB 미저장):

```js
// Map<ip: string, { count: number, resetAt: number }>
// 창 크기: 15분
// 로그인/회원가입 엔드포인트에만 적용
const rateLimitStore = new Map();
```

setInterval로 만료 항목 주기적 정리 (메모리 누수 방지).

## 신규: In-Memory SSO State Store 변경 없음

기존 `ssoService.js`의 state store 구조는 변경 없음.

## 이미지 파일명 규칙 강화

기존: `${Date.now()}-${file.originalname}` (경로 구분자 포함 가능)

변경: `${Date.now()}-${sanitizedName}` where `sanitizedName = path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_')`

## 환경변수 목록 (변경/추가)

| 변수 | 기존 | 변경 후 |
|------|------|---------|
| `JWT_SECRET` | 미설정 시 fallback 값 사용 | 미설정 시 시작 중단 |
| `ALLOWED_ORIGINS` | 없음 (와일드카드 하드코딩) | 추가: 쉼표 구분 허용 도메인 목록 |
| `RATE_LIMIT_WINDOW_MS` | 없음 | 추가 (기본값: 900000 = 15분) |
| `RATE_LIMIT_MAX` | 없음 | 추가 (기본값: 20) |
