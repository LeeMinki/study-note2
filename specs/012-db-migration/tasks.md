# Tasks: 파일 기반 저장소를 데이터베이스로 마이그레이션

**Input**: Design documents from `/specs/012-db-migration/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-contracts.md`, `quickstart.md`

**Organization**: DB 스키마 → 저장소 계층 교체 → 마이그레이션 로직 → SSO 스키마 준비 → 배포 설정 → 검증 순으로 진행한다. 각 단계는 독립적으로 검증 가능하게 구성한다.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 서로 다른 파일을 다루며 선행 작업에 직접 의존하지 않아 병렬 처리 가능
- **[Story]**: 사용자 스토리 단계에만 사용
- 모든 작업 설명은 실제 수정 또는 생성 대상 파일 경로를 포함한다

---

## Phase 1: Setup (의존성 + 기반 구조)

**Purpose**: better-sqlite3 설치 및 DB 모듈 디렉터리 생성

- [X] T001 `cd backend && npm install better-sqlite3` 실행 — 2026-04-20 사용자 승인 완료, `backend/package.json` 의존성 추가 확인
- [X] T002 `backend/src/db/` 디렉터리 생성 — `index.js`, `migrate.js` 파일 위치

---

## Phase 2: Foundational (DB 스키마 + 테스트 헬퍼)

**Purpose**: 모든 US가 의존하는 DB 스키마와 테스트 기반 구축. 이 단계 완료 전에는 US 구현 불가.

**⚠️ CRITICAL**: US1~US3 모두 이 단계에 의존한다.

- [X] T003 `backend/src/db/index.js` 생성 — `better-sqlite3`로 DB 파일 열기 (`STUDY_NOTE_DB_FILE` 환경변수, 기본값 `../../study-note.db`), `users` 테이블 (`id`, `email UNIQUE`, `name`, `display_name`, `password_hash`, `provider DEFAULT 'local'`, `provider_id`, `created_at`) + `notes` 테이블 (`id`, `user_id` FK→users, `title`, `content`, `tags DEFAULT '[]'`, `created_at`, `updated_at`) CREATE TABLE IF NOT EXISTS, WAL 모드 활성화, 인덱스 생성 (`idx_notes_user_id`, `idx_notes_user_id_created_at`)
- [X] T004 [P] `backend/tests/helpers/testData.js` 수정 — 기존 파일 기반 헬퍼(`createTestStorage`, `applyTestStorage` 등)를 in-memory SQLite (`':memory:'`) 기반 DB 생성/정리 헬퍼로 교체. `createTestDb()`, `closeTestDb(db)` 함수 제공

**Checkpoint**: DB 스키마가 생성되고 테스트 헬퍼가 in-memory SQLite를 사용할 수 있어야 한다.

---

## Phase 3: User Story 1 — 데이터 안정성 확보 (Priority: P1)

**Goal**: 파일 저장소를 DB 저장소로 완전 교체하여 트랜잭션 기반 안정적 저장 달성

**Independent Test**: `npm test` 전체 통과 + 서버 시작 후 로그인/노트 CRUD 정상 동작

### Implementation

- [X] T005 [P] [US1] `backend/src/repositories/dbUserRepository.js` 신규 생성 — `findUserByEmail(email)`, `findUserById(userId)`, `saveUser(user)`, `updateUser(nextUser)` 구현. DB row(`display_name`, `password_hash`, `provider_id`, `created_at`) → camelCase 객체 변환 포함. `fileUserRepository`와 동일한 공개 인터페이스 유지
- [X] T006 [P] [US1] `backend/src/repositories/dbNoteRepository.js` 신규 생성 — `findNotesByUserId(userId, { tag, search })` (created_at DESC 정렬, tag/search 필터 DB 쿼리로 처리), `findNoteById(noteId)`, `insertNote(note)`, `updateNote(note)`, `deleteNote(noteId)` 구현. `tags` 컬럼: 저장 시 `JSON.stringify(note.tags)`, 반환 시 `JSON.parse(row.tags)`
- [X] T007 [US1] `backend/src/services/authService.js` 수정 — `require('../repositories/fileUserRepository')` → `require('../repositories/dbUserRepository')` 교체. 서비스 로직 변경 없음
- [X] T008 [US1] `backend/src/services/notesService.js` 수정 — `require('../repositories/fileNoteRepository')` 제거 및 `dbNoteRepository` import. `getNotes`: `findNotesByUserId(userId, query)` 호출로 교체 (인메모리 filterNotes 제거). `createNoteRecord`: `insertNote(note)` 호출. `updateNoteRecord`: `findNoteById` 확인 후 `updateNote(note)` 호출. `deleteNoteRecord`: `deleteNote(noteId)` 호출. filterNotes 함수 삭제
- [X] T009 [US1] `backend/src/repositories/fileUserRepository.js` 삭제
- [X] T010 [US1] `backend/src/repositories/fileNoteRepository.js` 삭제
- [X] T011 [US1] `backend/tests/persistence.test.js` 수정 — T005/T006 완료 후 진행. 기존 파일 기반 테스트 삭제, T004 헬퍼를 활용한 DB 저장소 테스트로 재작성. 검증 항목: `saveUser` → `findUserByEmail` 일치, `insertNote` → `findNotesByUserId` 포함, `updateNote` 반영, `deleteNote` 제거, `INSERT OR IGNORE` 멱등성, **동시 INSERT 2건 모두 성공 확인** (SC-004, WAL 모드 동작 검증)
- [X] T012 [US1] `npm test` 실행 — `backend/tests/` 전체 테스트 통과 확인

**Checkpoint**: `npm test` 통과 + `fileUserRepository`, `fileNoteRepository` 코드가 codebase에 없어야 한다.

---

## Phase 4: User Story 2 — 기존 데이터 보존 마이그레이션 (Priority: P2)

**Goal**: 앱 시작 시 기존 `users.json`/`data.json` 파일을 자동으로 DB로 이관, 멱등성 보장

**Independent Test**: `users.json`이 있는 환경에서 서버 시작 후 파일 건수 = DB 건수 확인. 재시작 후 건수 동일 확인

### Implementation

- [X] T013 [US2] `backend/src/db/migrate.js` 신규 생성 — `migrate(db)` 함수: ① `users.json` 존재 시 `JSON.parse` 후 각 사용자를 `INSERT OR IGNORE INTO users` per-row (id, email, name, display_name, password_hash, provider, provider_id=NULL, created_at). ② `data.json` 존재 시 `JSON.parse` 후 각 노트를 `INSERT OR IGNORE INTO notes` per-row (id, user_id, title, content, tags=JSON.stringify(tags), created_at, updated_at). ③ 파일이 존재하지 않으면 해당 파일 이관을 건너뜀. ④ 시작/완료 로그 출력 (`[DB] 마이그레이션 완료: users N건 처리, notes M건 처리`). **스킵 조건은 파일 부재만 — DB에 데이터가 있어도 INSERT OR IGNORE로 항상 실행 (멱등성은 UNIQUE 제약으로 보장)**
- [X] T014 [US2] `backend/src/app.js` 수정 — `require.main === module` 진입점에서 서버 listen 이전에 `db.initialize()` → `migrate(db)` 순서로 호출. `createApp()` 함수 외부에서 비동기로 처리. DB 초기화 또는 마이그레이션 실패 시 `process.exit(1)` 및 오류 로그 출력
- [ ] T015 [P] [US2] 로컬 E2E 검증 — `users.json`/`data.json`이 있는 환경에서 `STUDY_NOTE_DB_FILE=/tmp/test.db npm start` 실행, `[DB] 마이그레이션 완료` 로그 확인, `curl http://localhost:3001/api/health` 200 확인. 재시작 후 동일 로그가 "스킵" 메시지로 출력되는지 확인

**Checkpoint**: 서버 시작 로그에서 마이그레이션 완료/스킵 메시지가 출력되고 기존 자격증명으로 로그인이 성공해야 한다.

---

## Phase 5: User Story 3 — SSO 확장 준비 (Priority: P3)

**Goal**: DB 스키마에 `provider`, `provider_id` 필드가 존재하고 `local` 계정이 정상 동작

**Independent Test**: DB 스키마 확인으로 `provider` 컬럼과 `provider_id` 컬럼 존재 확인

### Implementation

- [X] T016 [P] [US3] `backend/src/db/index.js` 검증 — `users` 테이블 DDL에 `provider TEXT NOT NULL DEFAULT 'local'`, `provider_id TEXT` 컬럼과 `idx_users_provider_provider_id` 인덱스(`WHERE provider_id IS NOT NULL`) 포함 여부 확인. 미포함 시 T003 수정
- [X] T017 [US3] `backend/src/repositories/dbUserRepository.js` — `saveUser(user)` 호출 시 `provider` 값이 저장되고 `findUserByEmail` 반환 객체에 `provider`, `providerId` 필드가 포함되는지 `tests/persistence.test.js`에서 검증 케이스 추가

**Checkpoint**: `npm test` 통과 + `provider: "local"` 계정이 DB에 정상 저장됨을 확인.

---

## Phase 6: 배포 설정 반영

**Purpose**: k8s 매니페스트와 Dockerfile을 DB 기반으로 업데이트

- [X] T018 `backend/Dockerfile` 수정 — `better-sqlite3` 네이티브 빌드를 위한 `build-essential`, `python3`, `make` 추가 (builder 스테이지) 또는 멀티스테이지 빌드 적용. 프로덕션 스테이지에는 빌드 도구 미포함
- [X] T019 [P] `infra/kubernetes/study-note/base/backend-deployment.yaml` 수정 — 기존 볼륨 마운트(`/app/data.json subPath: data.json`, `/app/users.json subPath: users.json`) 제거, 신규 추가(`/app/study-note.db subPath: study-note.db`)
- [X] T020 [P] `infra/kubernetes/study-note/base/configmap.yaml` 수정 — `STUDY_NOTE_DB_FILE: /app/study-note.db` 추가 (현재 configmap에 DATA_FILE/USERS_FILE 항목 없음 — 추가만 필요)

---

## Final Phase: 검증 및 완료

**Purpose**: 전체 DB 마이그레이션이 정상 동작함을 검증하고 운영 문서를 최신화한다.

- [X] T021 [P] `npm test` 최종 회귀 테스트 실행 — US3(T017) 추가 케이스 포함 전체 통과 확인. T012와 달리 Phase 5~6 변경사항까지 모두 포함된 최종 상태 검증 (SC-006)
- [ ] T022 GitOps PR 머지 후 Argo CD 배포 — `kubectl rollout status deployment/study-note-backend -n study-note`, 30초 이하 준비 완료 확인 (SC-007)
- [ ] T023 [P] 운영 마이그레이션 검증 — EC2 접속 후 `kubectl logs`에서 마이그레이션 완료 로그 확인, DB 건수 = JSON 파일 건수 확인 (`specs/012-db-migration/quickstart.md` Step 3 기준)
- [ ] T024 [P] `specs/012-db-migration/quickstart.md` 최종 확인 — 실제 운영 결과 (마이그레이션 건수, 서비스 중단 시간) 반영

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 진행 — 모든 US 작업에 선행 필수
- **US1 (Phase 3)**: Foundational 완료 후 시작 — 저장소 계층 교체 핵심
- **US2 (Phase 4)**: US1 완료 후 진행 — dbUserRepository/dbNoteRepository가 있어야 마이그레이션 가능
- **US3 (Phase 5)**: Foundational 완료 후 시작 가능 (US1과 독립 — 스키마 컬럼 확인만)
- **배포 설정 (Phase 6)**: US1 완료 후 진행 — Dockerfile, k8s 매니페스트 변경
- **Final (검증)**: Phase 6 완료 후 진행

### Critical Blocker

**Foundational Phase 완료 (T003, T004)**: DB 스키마와 테스트 헬퍼가 없으면 US1~US3 진행 불가.

### Parallel Opportunities

- Phase 2: T003, T004 병렬 가능 (다른 파일)
- Phase 3: T005, T006, T011 병렬 가능 (각각 다른 파일)
- Phase 6: T018, T019, T020 병렬 가능
- Final: T021, T023, T024 병렬 가능
