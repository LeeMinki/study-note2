# Data Model: 파일 기반 저장소를 데이터베이스로 마이그레이션

## SQLite 스키마

### users 테이블

```sql
CREATE TABLE users (
  id           TEXT PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT,              -- local provider만 사용, SSO는 NULL
  provider     TEXT NOT NULL DEFAULT 'local',
  provider_id  TEXT,               -- SSO 공급자 고유 ID, local은 NULL
  created_at   TEXT NOT NULL       -- ISO 8601 문자열 (기존 형식 유지)
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider_provider_id ON users(provider, provider_id)
  WHERE provider_id IS NOT NULL;
```

**필드 매핑** (기존 JSON → DB):

| JSON 필드 | DB 컬럼 | 비고 |
|-----------|---------|------|
| `id` | `id` | TEXT, `user_TIMESTAMP_RANDOM` 형식 유지 |
| `email` | `email` | UNIQUE, lowercase |
| `name` | `name` | |
| `displayName` | `display_name` | snake_case 컬럼명 |
| `passwordHash` | `password_hash` | local 전용 |
| `provider` | `provider` | 기본값 `'local'` |
| (없음) | `provider_id` | SSO 대비, local은 NULL |
| `createdAt` | `created_at` | ISO 8601 문자열 |

---

### notes 테이블

```sql
CREATE TABLE notes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  tags       TEXT NOT NULL DEFAULT '[]',  -- JSON 직렬화 배열
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_user_id_created_at ON notes(user_id, created_at DESC);
```

**필드 매핑** (기존 JSON → DB):

| JSON 필드 | DB 컬럼 | 비고 |
|-----------|---------|------|
| `id` | `id` | TEXT, `note_TIMESTAMP_RANDOM` 형식 유지 |
| `userId` | `user_id` | FK → users.id |
| `title` | `title` | NOT NULL |
| `content` | `content` | 기본값 `''` |
| `tags` | `tags` | JSON 직렬화 `'["tag1","tag2"]'`, 기본값 `'[]'` |
| `createdAt` | `created_at` | ISO 8601 문자열 |
| `updatedAt` | `updated_at` | ISO 8601 문자열 |

---

## Repository 인터페이스

### dbUserRepository

```js
// 기존 fileUserRepository와 동일한 시그니처 — authService.js 변경 없음
findUserByEmail(email)   → user | null
findUserById(userId)     → user | null
saveUser(user)           → user
updateUser(nextUser)     → user
```

**반환 형식**: DB row를 camelCase 객체로 변환 (`display_name` → `displayName`, `password_hash` → `passwordHash` 등)

### dbNoteRepository

```js
// 기존 listNotes/saveNotes에서 CRUD-native 인터페이스로 변경
findNotesByUserId(userId, { tag, search })  → note[]  (정렬: created_at DESC)
findNoteById(noteId)                         → note | null
insertNote(note)                             → note
updateNote(note)                             → note
deleteNote(noteId)                           → { id }
```

**반환 형식**: DB row를 camelCase 객체로 변환, `tags`는 `JSON.parse(row.tags)` 후 반환

---

## 마이그레이션 데이터 변환

### users.json → users 테이블

```js
// users.json 구조
{ "users": [ { id, email, name, displayName, passwordHash, provider, createdAt } ] }

// DB INSERT
INSERT OR IGNORE INTO users (id, email, name, display_name, password_hash, provider, provider_id, created_at)
VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
```

### data.json → notes 테이블

```js
// data.json 구조
{ "notes": [ { id, userId, title, content, tags, createdAt, updatedAt } ] }

// DB INSERT
INSERT OR IGNORE INTO notes (id, user_id, title, content, tags, created_at, updated_at)
VALUES (?, ?, ?, ?, json(tags), ?, ?)
-- tags: JSON.stringify(note.tags) if array, else '[]'
```

---

## 기존 JSON 파일과의 관계

- 마이그레이션 완료 후 `users.json`, `data.json`은 삭제하지 않는다.
- 백업 파일로 `/var/lib/study-note/backend/` 디렉터리에 그대로 유지.
- 앱은 스타트업 시 DB에 데이터가 없고 파일이 존재할 경우만 마이그레이션을 수행한다.
- 마이그레이션 완료 후 재시작 시에는 DB에 이미 데이터가 있으므로 스킵된다.
