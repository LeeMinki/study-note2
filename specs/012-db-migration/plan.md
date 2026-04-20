# Implementation Plan: 파일 기반 저장소를 데이터베이스로 마이그레이션

**Branch**: `012-db-migration` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-db-migration/spec.md`

## Summary

파일 기반(`users.json`, `data.json`) 데이터 저장 구조를 SQLite 임베디드 DB(`better-sqlite3`)로 교체한다. 백엔드 저장소 계층(`fileUserRepository`, `fileNoteRepository`)을 삭제하고 DB 구현체로 완전 교체하며, 기존 HTTP API 계약과 서비스 인터페이스는 유지한다. 앱 시작 시 자동 마이그레이션으로 운영 데이터를 이관하고, 별도 k8s 리소스 없이 기존 hostPath PVC에 DB 파일을 저장한다.

## Technical Context

**Language/Version**: Node.js 22, CommonJS
**Primary Dependencies**: Express 5, bcryptjs, jsonwebtoken, multer + `better-sqlite3` (신규, NEEDS USER APPROVAL)
**Storage**: SQLite 단일 파일 (`study-note.db`), hostPath PVC (`/var/lib/study-note/backend/`)
**Testing**: Node.js 22 built-in test runner (`node --test`)
**Target Platform**: Linux/Docker (k3s 단일 노드, EC2 t3.small)
**Performance Goals**: 스타트업 마이그레이션 포함 Pod 준비 완료 30초 이하
**Constraints**: 별도 k8s 서비스 추가 없음, 비용 증가 없음

## Constitution Check

| 항목 | 상태 | 근거 |
|------|------|------|
| 모노레포 경계 (`/frontend` ↔ `/backend`) | ✅ | 프론트엔드 코드 변경 없음. HTTP API 계약 유지 |
| JSON 응답 봉투 `{ success, data, error }` | ✅ | 엔드포인트/컨트롤러 변경 없음 |
| 저장 계층 격리 (backend-owned) | ✅ | `repositories/` 내에서만 DB 접근 |
| 영문 식별자, 한글 주석 | ✅ | 신규 파일 동일 규칙 적용 |
| 신규 의존성 승인 | ⚠️ | `better-sqlite3` — 사용자 승인 필요 (plan 단계) |
| UX / 인라인 편집 | ✅ | UX 변경 없음 |
| WSL/Linux 친화적 배포 | ✅ | hostPath PVC 유지, 표준 bash 명령 |

> **GATE**: `better-sqlite3` 사용자 승인 후 implement 단계 진행 가능.

## Complexity Tracking

| 항목 | 이유 | 단순 대안을 선택하지 않은 이유 |
|------|------|-------------------------------|
| 노트 저장소 인터페이스 변경 (`listNotes/saveNotes` → CRUD) | 전체 배열 reload/overwrite는 DB에서 동시성 충돌 유발 | 기존 패턴 유지 시 정확성 보장 불가 |
| 서비스 계층 리팩터링 (`notesService.js`) | 저장소 인터페이스 변경에 따른 필수 수정 | 서비스 공개 API는 유지 |

## Project Structure

### Documentation (this feature)

```text
specs/012-db-migration/
├── plan.md              ← 이 파일
├── research.md          ← Phase 0 완료
├── data-model.md        ← Phase 1 완료
├── quickstart.md        ← Phase 1 완료
├── contracts/
│   └── api-contracts.md ← Phase 1 완료
└── tasks.md             ← /speckit-tasks 명령 생성
```

### Source Code (변경 대상)

```text
backend/
├── src/
│   ├── db/
│   │   ├── index.js              [신규] DB 연결 싱글턴 + 스키마 초기화
│   │   └── migrate.js            [신규] 스타트업 마이그레이션 (파일 → DB)
│   ├── repositories/
│   │   ├── dbUserRepository.js   [신규] DB 기반 사용자 저장소
│   │   ├── dbNoteRepository.js   [신규] DB 기반 노트 저장소
│   │   ├── fileUserRepository.js [삭제]
│   │   └── fileNoteRepository.js [삭제]
│   ├── services/
│   │   └── notesService.js       [수정] CRUD-native 저장소 인터페이스 적용
│   └── app.js                    [수정] 스타트업 DB 초기화/마이그레이션 호출
├── tests/
│   ├── helpers/
│   │   └── testData.js           [수정] DB 기반 테스트 헬퍼로 교체
│   └── persistence.test.js       [수정] DB 저장소 테스트로 재작성
├── Dockerfile                    [수정] better-sqlite3 네이티브 빌드 지원
└── package.json                  [수정] better-sqlite3 의존성 추가

infra/kubernetes/study-note/base/
└── backend-deployment.yaml       [수정] 볼륨 마운트 변경 (json → db 파일)

infra/kubernetes/study-note/base/
└── configmap.yaml                [수정] STUDY_NOTE_DB_FILE 환경변수 추가
```

---

## Phase 0: 연구 (완료)

→ [research.md](./research.md) 참조

**주요 결정**:
- **SQLite + better-sqlite3**: 동기 API, 단일 파일, 추가 k8s 서비스 없음
- **노트 저장소 인터페이스 재설계**: listNotes/saveNotes → findNotesByUserId/insertNote/updateNote/deleteNote
- **스타트업 자동 마이그레이션**: `INSERT OR IGNORE` 멱등성 보장
- **테스트**: in-memory SQLite로 단위 테스트 속도 유지

---

## Phase 1: DB 및 저장소 계층 구현

### 1-1. `better-sqlite3` 의존성 추가

**승인 필요**: `better-sqlite3` — 네이티브 애드온, Node.js 22 지원, 동기 API
**이유**: 현재 `async/await` 패턴과 자연스럽게 통합, 성능 우수, 단일 파일 DB

```bash
cd backend && npm install better-sqlite3
```

Dockerfile 수정: 멀티스테이지 빌드로 네이티브 컴파일 후 결과물만 복사

### 1-2. `backend/src/db/index.js` — DB 연결 + 스키마

```js
// DB 싱글턴 반환
// - better-sqlite3로 파일 열기
// - CREATE TABLE IF NOT EXISTS users, notes
// - 인덱스 생성
// - WAL 모드 활성화 (동시 읽기 성능)
```

스키마는 `data-model.md` 참조.

### 1-3. `backend/src/db/migrate.js` — 스타트업 마이그레이션

```js
// 실행 조건: users.json 또는 data.json 존재 AND DB users 테이블이 비어 있음
// INSERT OR IGNORE INTO users ... (멱등)
// INSERT OR IGNORE INTO notes ... (멱등)
// 완료 로그 출력
```

### 1-4. `backend/src/repositories/dbUserRepository.js`

기존 `fileUserRepository` 공개 인터페이스 유지:
- `findUserByEmail(email)`
- `findUserById(userId)`
- `saveUser(user)`
- `updateUser(nextUser)`

DB row ↔ camelCase 객체 변환 포함 (`display_name` → `displayName` 등)

### 1-5. `backend/src/repositories/dbNoteRepository.js`

CRUD-native 인터페이스 (서비스 계층과 협약):
- `findNotesByUserId(userId, { tag, search })` — `created_at DESC` 정렬
- `findNoteById(noteId)`
- `insertNote(note)`
- `updateNote(note)`
- `deleteNote(noteId)`

태그: `JSON.stringify(tags)` 저장, `JSON.parse(row.tags)` 반환

### 1-6. `backend/src/services/notesService.js` — 서비스 계층 리팩터링

`getNotes`, `createNoteRecord`, `updateNoteRecord`, `deleteNoteRecord` 공개 API 유지.
내부 구현을 `listNotes/saveNotes(전체 배열)` 패턴에서 DB CRUD 호출로 변경.

filterNotes 함수 삭제 — DB 쿼리에서 필터 처리.

### 1-7. `backend/src/app.js` — 스타트업 시퀀스

```js
// require main 시
// 1. db = require('./db').initialize()
// 2. await db.migrate()
// 3. app.listen(port)
```

### 1-8. `backend/tests/` — 테스트 업데이트

- `helpers/testData.js`: in-memory SQLite DB 기반 헬퍼로 교체
- `persistence.test.js`: DB CRUD 테스트로 재작성 (INSERT OR IGNORE, 동시 쓰기 등)
- `auth.test.js`, `protectedRoutes.test.js`: 환경변수로 테스트용 DB 파일 경로 지정

### 1-9. k8s 매니페스트 변경

**`backend-deployment.yaml`** — 볼륨 마운트 변경:
```yaml
# 삭제
- mountPath: /app/data.json
  subPath: data.json
- mountPath: /app/users.json
  subPath: users.json

# 추가
- mountPath: /app/study-note.db
  subPath: study-note.db
```

**`configmap.yaml`** — 환경변수:
```yaml
# 삭제
STUDY_NOTE_DATA_FILE: /app/data.json
STUDY_NOTE_USERS_FILE: /app/users.json

# 추가
STUDY_NOTE_DB_FILE: /app/study-note.db
```

### 1-10. Dockerfile — 네이티브 빌드 지원

```dockerfile
# 멀티스테이지: builder에서 네이티브 컴파일
# production에서 node_modules 복사
# build-essential, python3 빌드 의존성은 builder 스테이지에만 포함
```

---

## Phase 2: 검증 및 정리

### 2-1. 기존 파일 저장소 코드 삭제

- `backend/src/repositories/fileUserRepository.js` 삭제
- `backend/src/repositories/fileNoteRepository.js` 삭제

### 2-2. 회귀 테스트 전체 통과 확인

```bash
cd backend && npm test
```

### 2-3. 로컬 E2E 검증

```bash
# 기존 JSON 파일이 있는 환경에서 시작
STUDY_NOTE_DB_FILE=/tmp/test.db npm start
# 로그에서 마이그레이션 확인
# 브라우저 또는 curl로 노트/인증 기능 확인
```

### 2-4. 운영 배포 후 검증 (quickstart.md Step 3 참조)

- Pod 재시작 시간 30초 이하 확인
- DB 건수 = JSON 파일 건수 확인
- 기존 계정으로 로그인 확인

---

## 의존성 승인 체크포인트

| 패키지 | 목적 | 승인 상태 |
|--------|------|----------|
| `better-sqlite3` | SQLite 임베디드 DB 드라이버 (백엔드 프로덕션) | ✅ 2026-04-20 승인 완료 |
