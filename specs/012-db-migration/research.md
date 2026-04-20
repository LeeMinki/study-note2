# Research: 파일 기반 저장소를 데이터베이스로 마이그레이션

## 1. DB 선택: SQLite + better-sqlite3

**Decision**: SQLite 임베디드 DB, Node.js 드라이버는 `better-sqlite3`

**Rationale**:
- 별도 k8s 서비스 없이 백엔드 컨테이너 내에서 단일 파일로 운영 — 현재 hostPath PVC 패턴 그대로 유지
- `better-sqlite3`는 동기(synchronous) API로 현재 `async/await` 저장소 코드에 자연스럽게 통합되며, 콜백/Promise 체인 없이 간결하다
- Node.js 22에서 완전 지원, 활발히 유지보수됨
- 트랜잭션 지원으로 동시 쓰기 안정성 확보
- 단일 파일이므로 백업이 파일 복사만으로 충분하다

**Alternatives Considered**:

| 선택지 | 이유 |
|--------|------|
| `sqlite3` (비동기) | Promise/callback 패턴으로 코드 복잡도 증가. better-sqlite3가 성능도 우수 |
| PostgreSQL | 별도 k8s Deployment + Service + 크레덴셜 관리 필요. MVP 범위 초과 |
| AWS RDS | 비용 발생, 운영 복잡도 증가. MVP 범위 밖 |
| better-sqlite3 in-memory | 재시작 시 데이터 손실 — 파일 모드 필수 |

**승인 필요 패키지**: `better-sqlite3` (백엔드 프로덕션 의존성)

---

## 2. 노트 저장소 인터페이스 재설계

**Decision**: `notesService.js`의 full-list 패턴을 DB-native CRUD 패턴으로 변경

**Current pattern** (`fileNoteRepository`):
```
listNotes()         → 전체 노트 배열 반환
saveNotes(notes[])  → 전체 노트 배열을 파일에 덮어씀
```

**서비스 계층 현재 동작**: `listNotes()` 결과를 메모리에서 userId 필터, 정렬, 수정 후 `saveNotes(전체배열)` 호출

**Rationale for change**: DB에서 전체 노트를 읽어 메모리 필터 후 재저장하는 방식은 비효율적이고 동시성 문제가 발생한다. DB-native CRUD 인터페이스로 서비스 계층도 함께 리팩터링한다.

**New DB repository interface**:
```
findNotesByUserId(userId, { tag, search })  → 필터된 노트 배열 (정렬 포함)
findNoteById(noteId)                        → 단건 조회
insertNote(note)                            → 생성
updateNote(note)                            → 수정
deleteNote(noteId)                          → 삭제
```

**서비스 계층 변경 범위**: `notesService.js`의 전체 목록 로드-수정-저장 패턴을 각 작업별 DB 호출로 교체. 공개 API 시그니처(`getNotes`, `createNoteRecord`, `updateNoteRecord`, `deleteNoteRecord`)는 유지.

---

## 3. 사용자 저장소 인터페이스 호환성

**Decision**: `fileUserRepository`의 인터페이스를 그대로 유지

**Current interface** (이미 CRUD-native):
```
findUserByEmail(email)
findUserById(userId)
saveUser(user)
updateUser(user)
```

**Rationale**: 현재 인터페이스가 이미 DB-native 패턴이다. `authService.js`는 변경하지 않는다.

---

## 4. DB 초기화 및 스타트업 마이그레이션

**Decision**: `app.js` 시작 시 DB 초기화 → 마이그레이션 → 서버 listen 순서

**Startup sequence**:
```
1. db.initialize()   — DB 파일 열기, 테이블 CREATE TABLE IF NOT EXISTS
2. db.migrate()      — users.json, data.json 존재 시 DB로 이관 (멱등)
3. app.listen()      — 서버 시작
```

**Idempotency 보장 방법**:
- 사용자: `INSERT OR IGNORE INTO users ... WHERE email = ?` — 이메일 unique 제약
- 노트: `INSERT OR IGNORE INTO notes ...` — id PRIMARY KEY 제약

---

## 5. 환경변수 변경

**Decision**: DB 파일 경로를 `STUDY_NOTE_DB_FILE` 환경변수로 관리

| 기존 | 변경 후 |
|------|---------|
| `STUDY_NOTE_DATA_FILE` | 삭제 |
| `STUDY_NOTE_USERS_FILE` | 삭제 |
| (없음) | `STUDY_NOTE_DB_FILE` 추가 |

**Default**: `process.env.STUDY_NOTE_DB_FILE` || `path.resolve(__dirname, '../../study-note.db')`

---

## 6. k8s 배포 변경

**Decision**: hostPath 볼륨 마운트를 DB 파일 하나로 단순화

**기존 볼륨 마운트 (삭제)**:
```yaml
- mountPath: /app/data.json
  subPath: data.json
- mountPath: /app/users.json
  subPath: users.json
```

**신규 볼륨 마운트**:
```yaml
- mountPath: /app/study-note.db
  subPath: study-note.db
```

**hostPath 경로**: `/var/lib/study-note/backend` (기존 동일 디렉터리 재사용)

---

## 7. 테스트 전략

**Decision**: 테스트용 임시 파일 DB + 테스트 후 삭제

- `better-sqlite3`는 `:memory:` DB 지원 → 단위 테스트는 in-memory DB 사용
- `persistence.test.js`는 DB 저장소 테스트로 재작성
- 기존 `testData.js` helper를 DB 기반으로 교체
- `auth.test.js`, `protectedRoutes.test.js`는 DB mock 없이 실제 in-memory DB 사용

**이유**: 파일 모킹 대신 실제 DB를 쓰면 쿼리 정확성까지 검증 가능하고, in-memory DB로 속도도 유지된다.
