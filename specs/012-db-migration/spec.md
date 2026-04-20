# Feature Specification: 파일 기반 저장소를 데이터베이스로 마이그레이션

**Feature Branch**: `012-db-migration`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "Study Note의 현재 파일 기반 데이터 저장 구조를 데이터베이스 기반 구조로 마이그레이션하고 싶다."

## Clarifications

### Session 2026-04-20

- Q: DB 배포 모델 → A: 임베디드 DB (SQLite) — 백엔드 컨테이너 내 단일 파일 DB, 별도 k8s 서비스 없음
- Q: 태그(tags) 저장 방식 → A: JSON 직렬화 — `tags` 컬럼에 `["tag1","tag2"]` 형태로 저장
- Q: 마이그레이션 스크립트 실행 방식 → B: 앱 시작 시 자동 실행 — 서버 부팅 시 파일 존재 확인 후 멱등 이관
- Q: 서비스 중단 허용 범위 → A: 30초 이하 — Pod 재시작 + 스타트업 마이그레이션 포함
- Q: 파일 기반 저장 코드 보존 여부 → B: 파일 저장소 코드 제거 — DB 구현체로 완전 교체, 원본 JSON은 백업으로만 보존

## User Scenarios & Testing *(mandatory)*

### User Story 1 — 데이터 안정성 확보 (Priority: P1)

운영자가 애플리케이션을 재시작하거나 부하가 높은 상태에서도 사용자 데이터와 노트 데이터가 손실 없이 유지된다. 현재 파일 기반 저장 방식은 동시 쓰기, 비정상 종료 시 파일 손상 위험이 있다. 임베디드 데이터베이스(SQLite)는 트랜잭션과 무결성 제약으로 이를 방지한다.

**Why this priority**: 데이터 손실은 서비스 신뢰를 직접적으로 훼손한다. 이 스토리가 완성되지 않으면 나머지 기능 개선도 의미가 없다.

**Independent Test**: 앱을 재시작한 직후에도 기존 사용자가 로그인 가능하고 기존 노트가 정상 조회되면 검증 완료.

**Acceptance Scenarios**:

1. **Given** 서버가 실행 중이고 노트 여러 건이 저장되어 있을 때, **When** 서버를 정상 재시작하면, **Then** 재시작 후에도 모든 노트가 동일하게 조회된다.
2. **Given** 두 사용자가 동시에 노트를 저장할 때, **When** 두 요청이 거의 동시에 도달하면, **Then** 두 노트 모두 정상 저장되고 어느 쪽도 유실되지 않는다.
3. **Given** 서버가 비정상 종료될 때, **When** 재시작 후 데이터 조회하면, **Then** 비정상 종료 직전까지 커밋된 데이터는 모두 유지된다.

---

### User Story 2 — 기존 데이터 보존 마이그레이션 (Priority: P2)

기존 파일에 저장된 사용자 계정과 노트가 데이터베이스로 안전하게 이관된다. 앱 시작 시 `users.json`과 `data.json` 파일이 존재하면 자동으로 DB로 이관한 뒤 정상 서비스가 시작된다. 사용자는 마이그레이션 이후에도 기존 자격증명으로 로그인하고 기존 노트를 정상적으로 사용할 수 있다.

**Why this priority**: 이미 운영 중인 데이터가 있으면 데이터 이관 없이 DB로 전환할 수 없다. 데이터가 없는 환경이라면 이 스토리는 건너뛸 수 있다.

**Independent Test**: 파일에서 읽은 사용자/노트 수와 DB에 저장된 수가 일치하고, 이관 전 자격증명으로 로그인이 성공하면 검증 완료.

**Acceptance Scenarios**:

1. **Given** `users.json`과 `data.json`에 데이터가 있을 때, **When** 앱이 시작되면, **Then** 서버 준비 완료 전 데이터가 자동으로 DB에 이관된다.
2. **Given** 마이그레이션이 완료된 후, **When** 기존 이메일/패스워드로 로그인하면, **Then** 로그인에 성공하고 기존 노트가 정상 표시된다.
3. **Given** 마이그레이션 도중 오류가 발생했을 때, **When** 오류가 감지되면, **Then** 부분 이관 없이 롤백되고 앱 시작이 중단되며 명확한 오류가 로그에 출력된다.
4. **Given** 이미 마이그레이션이 완료된 상태에서 앱을 재시작할 때, **When** 스타트업 마이그레이션 로직이 다시 실행되면, **Then** 중복 데이터 없이 정상 시작된다 (멱등성).

---

### User Story 3 — SSO 확장 준비 (Priority: P3)

DB 스키마가 외부 인증 공급자(Google, GitHub 등) 기반 계정을 수용할 수 있는 구조를 갖춘다. 향후 SSO 기능 추가 시 스키마 변경 없이 새 공급자를 등록할 수 있다.

**Why this priority**: 현재 `user` 모델에는 이미 `provider` 필드가 있다. DB 스키마 설계 시 이를 반영해 두면 나중에 별도 마이그레이션 없이 SSO를 추가할 수 있다.

**Independent Test**: DB 사용자 테이블에 `provider`, `providerId` 컬럼이 있고, `local` 계정이 정상 동작하면 검증 완료.

**Acceptance Scenarios**:

1. **Given** DB가 초기화된 후, **When** 스키마를 확인하면, **Then** 사용자 테이블에 인증 공급자 식별 필드(`provider`, `providerId`)가 존재한다.
2. **Given** `provider: "local"` 계정이 DB에 저장될 때, **When** 향후 `provider: "google"` 계정을 추가하면, **Then** 스키마 변경 없이 동일 테이블에 저장 가능하다.

---

### Edge Cases

- 파일이 비어 있거나 존재하지 않을 때 스타트업 마이그레이션은 오류 없이 건너뛴다.
- DB 파일이 없을 때 앱이 자동으로 스키마를 초기화한다.
- DB 연결/초기화 실패 시 애플리케이션 시작이 명확한 오류 메시지와 함께 중단된다.
- 이미 마이그레이션을 완료한 상태에서 앱을 재시작해도 중복 데이터가 생성되지 않는다 (멱등성).
- 이미지 파일(`uploads/`)은 DB 마이그레이션 범위 밖이다 — 파일시스템에서 계속 관리된다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 사용자 데이터(이메일, 이름, 표시이름, 패스워드 해시, 공급자, 생성일)를 임베디드 데이터베이스에 저장해야 한다.
- **FR-002**: 시스템은 노트 데이터(ID, 소유자 사용자 ID, 제목, 내용, 태그, 생성일, 수정일)를 임베디드 데이터베이스에 저장해야 한다. 태그는 JSON 직렬화 형태(`["tag1","tag2"]`)로 단일 컬럼에 저장한다.
- **FR-003**: 앱 시작 시 `users.json`과 `data.json` 파일이 존재하면 자동으로 DB로 이관한 뒤 서비스가 시작되어야 한다.
- **FR-004**: 스타트업 마이그레이션은 멱등성을 보장해야 한다 — 이미 이관된 데이터는 건너뛰고 중복 저장이 발생하지 않는다.
- **FR-005**: 모든 기존 HTTP API(인증, 노트 CRUD, 프로필)는 DB 전환 후에도 동일한 요청/응답 형식을 유지해야 한다.
- **FR-006**: 데이터베이스 파일은 앱 재시작 후에도 데이터가 유지되는 hostPath 볼륨(`/var/lib/study-note/backend/`)에 위치해야 한다.
- **FR-007**: DB 초기화 또는 마이그레이션 실패 시 애플리케이션은 시작을 중단하고 명확한 오류를 로그에 출력해야 한다.
- **FR-008**: 사용자 테이블은 `provider`(인증 공급자 종류)와 `providerId`(외부 공급자 고유 ID) 필드를 포함해야 한다.
- **FR-009**: 데이터 접근 계층(repository)은 DB 구현체로 완전 교체되어야 하며, 서비스 계층의 **공개 API 시그니처**(함수명·파라미터·반환형)는 변경되지 않아야 한다. 내부 구현(저장소 호출 패턴 등)은 DB 방식에 맞게 변경 가능하다.
- **FR-010**: 기존 `fileUserRepository.js`와 `fileNoteRepository.js`는 삭제된다. 원본 `users.json`과 `data.json` 파일은 이관 완료 후 백업으로만 보존된다.

### Constitution Alignment *(mandatory)*

- **CA-001**: 데이터 접근 계층은 `backend/src/repositories/`에 격리된다. 프론트엔드는 기존과 동일하게 HTTP API를 통해서만 데이터에 접근한다. 경계 변경 없음.
- **CA-002**: 기존 엔드포인트(auth, notes, profile)를 그대로 유지한다. 모든 응답은 `{ success: boolean, data: any, error: string | null }` 봉투를 유지한다. 신규 엔드포인트 없음.
- **CA-003**: `better-sqlite3` 패키지가 백엔드 프로덕션 의존성으로 추가된다. ✅ 2026-04-20 승인 완료.
- **CA-004**: UX 변경 없음. 이 기능은 순수 백엔드 저장 계층 교체다.
- **CA-005**: 기존 `fileUserRepository`/`fileNoteRepository`를 삭제하고 DB 기반 구현체로 교체한다. 서비스 계층 공개 API 시그니처는 동일하게 유지된다. DB 파일은 기존 JSON 파일과 동일한 hostPath 볼륨(`/var/lib/study-note/backend/`)에 위치한다. 별도 k8s 서비스(sidecar 등) 추가 없음.

### Key Entities *(include if feature involves data)*

- **User**: 이메일(unique), 이름, 표시이름, 패스워드 해시(`local` provider 한정), 인증 공급자(`provider: "local" | "google" | ...`), 공급자 고유 ID(`providerId`, SSO용 — local은 null), 생성일
- **Note**: ID, 소유자 사용자 ID(User와 1:N 관계, 외래 키), 제목, 내용, 태그(JSON 직렬화 문자열), 생성일, 수정일

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 마이그레이션 후 모든 기존 기능(로그인, 노트 CRUD, 프로필 조회/수정)이 파일 기반 때와 동일하게 동작한다.
- **SC-002**: 스타트업 마이그레이션 완료 후 파일의 사용자/노트 건수와 DB 건수가 일치한다.
- **SC-003**: 서버 재시작 후 데이터 조회 시 유실 없이 전체 데이터가 반환된다.
- **SC-004**: 동시 쓰기 시나리오에서 데이터 충돌 또는 손실이 발생하지 않는다.
- **SC-005**: 마이그레이션이 완료된 앱을 재시작해도 DB 레코드 수가 증가하지 않는다 (멱등성).
- **SC-006**: 기존 회귀 테스트(`npm test`)가 DB 전환 후에도 모두 통과한다.
- **SC-007**: DB 전환 후 Pod 재시작부터 서비스 준비 완료까지 30초 이내에 완료된다 (스타트업 마이그레이션 포함).

## Assumptions

- 현재 운영 환경은 단일 EC2 + k3s 단일 노드다. 멀티 노드/멀티 인스턴스 동시성은 이번 범위 밖이다.
- DB는 임베디드 방식으로 백엔드 컨테이너 내에서 운영된다. 별도 k8s Deployment/Service 추가 없음.
- 이미지 파일은 DB로 이관하지 않는다 — `uploads/` 디렉터리는 기존 방식(파일시스템)을 유지한다.
- 마이그레이션은 앱 시작 시 자동으로 실행된다. 별도 k8s Job이나 수동 kubectl exec 불필요.
- 서비스 중단은 Pod 재시작 시간 포함 30초 이하를 허용한다.
- DB 파일은 기존 `data.json`/`users.json`과 동일한 hostPath 볼륨(`/var/lib/study-note/backend/`)에 위치한다.
- `user.model.js`에 이미 존재하는 `provider: "local"` 필드는 SSO 확장 설계 의도이며 이를 DB 스키마에 반영한다.
- 기존 `fileUserRepository.js`, `fileNoteRepository.js`는 DB 구현체 교체 완료 후 삭제한다. 원본 JSON 파일은 마이그레이션 완료 후 백업으로만 유지한다.
- 운영 환경에 저장된 실제 데이터가 있으므로 스타트업 마이그레이션은 필수다.
