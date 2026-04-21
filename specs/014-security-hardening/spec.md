# Feature Specification: Security Hardening

**Feature Branch**: `014-security-hardening`
**Created**: 2026-04-21
**Status**: Draft

## Clarifications

### Session 2026-04-21

- Q: 점검 범위 → A: 애플리케이션 레벨, 인증/권한(SSO 포함), 배포 설정, secret/env 관리, 의존성 취약점 전 영역 포함
- Q: SSO 인증 경계 재점검 포함 여부 → A: SSO 추가 이후 인증/인가 경계 일관성 포함
- Q: 레거시 마이그레이션 코드 취급 → A: 제거 대상. file-based fallback, migrate.js, startup migration hook 모두 포함
- Q: 우선순위 기준 → A: 실제 위험도(악용 가능성) 기반. 구조 변경보다 고위험 항목 먼저
- Q: CI 자동 스캔 → A: 현재 GitHub Actions CI와 연결 가능한 범위(npm audit 등)만 우선

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 레거시 마이그레이션 경로 제거 (Priority: P1)

서버가 시작될 때 더 이상 data.json, users.json 파일을 탐색하거나 읽지 않는다. 해당 파일 기반 마이그레이션 코드와 startup hook이 코드베이스에서 완전히 제거된다. DB 마이그레이션이 완료된 현재 환경에서 파일시스템 기반 데이터 경로는 불필요한 공격 표면이다.

**Why this priority**: 매 서버 시작마다 실행되는 파일 읽기 코드는 `STUDY_NOTE_DATA_DIR` 환경변수를 조작하거나 해당 경로에 악의적인 JSON 파일을 배치할 경우 DB에 임의 데이터를 주입하는 경로가 된다. 운영 환경에서는 이미 불필요하며 제거로 리스크를 원천 차단한다.

**Independent Test**: 서버 시작 후 마이그레이션 관련 로그가 없고, 코드베이스에서 `data.json`, `users.json`, `migrate` 관련 파일 참조가 0건임을 확인.

**Acceptance Scenarios**:

1. **Given** 서버가 시작될 때, **When** 초기화 경로가 실행되면, **Then** 파일시스템에서 data.json/users.json을 탐색하거나 읽는 코드가 실행되지 않는다.
2. **Given** migrate.js가 제거된 상태에서, **When** 기존 DB 데이터를 가진 서버가 재시작되면, **Then** 기존 사용자/노트 데이터가 정상적으로 조회된다 (기능 회귀 없음).
3. **Given** 새 환경에 최초 배포 시, **When** 서버가 시작되면, **Then** DB 스키마는 기존 초기화 로직(schema.sql/db init)만으로 생성된다.

---

### User Story 2 - CORS 정책 강화 (Priority: P1)

백엔드 API가 모든 출처에서의 요청을 허용하는 현재 설정을 제거하고, 운영 도메인과 개발 환경에만 명시적으로 허용하도록 변경한다.

**Why this priority**: 와일드카드 CORS는 다른 웹사이트가 사용자의 브라우저 세션을 이용해 API를 무단으로 호출하는 경로가 된다. 가장 즉각적이고 비용이 낮은 수정으로 큰 보안 효과를 얻는다.

**Independent Test**: 허용되지 않은 출처에서 API 요청 시 CORS 오류가 발생하고, 허용된 도메인에서는 정상 응답이 오는 것을 확인.

**Acceptance Scenarios**:

1. **Given** 운영 환경에서, **When** 허용된 도메인(`https://study-note.yuna-pa.com`)에서 API 요청 시, **Then** 정상 CORS 헤더와 함께 응답이 반환된다.
2. **Given** 운영 환경에서, **When** 허용되지 않은 출처에서 API 요청 시, **Then** CORS 정책에 의해 요청이 차단된다.
3. **Given** 로컬 개발 환경에서, **When** `http://localhost:5173`에서 API 요청 시, **Then** 정상 동작한다.

---

### User Story 3 - JWT 시크릿 필수화 및 SSO 인증 경계 점검 (Priority: P1)

`JWT_SECRET` 환경변수가 설정되지 않은 경우 서버 시작을 즉시 중단한다. 또한 SSO 추가 이후 인증/인가 경계가 일관되게 적용되는지 점검하여, 미인증 경로가 없도록 한다.

**Why this priority**: JWT_SECRET fallback이 코드에 포함되어 있으면 설정 오류가 있는 운영 환경에서 모든 계정을 탈취할 수 있다. SSO 추가 후 새로 생긴 엔드포인트의 인증 경계도 함께 재검토가 필요하다.

**Independent Test**: JWT_SECRET 없이 서버 시작 시 즉시 에러와 함께 종료. SSO 콜백 엔드포인트가 인증 없이 임의 입력을 처리하지 않는지 확인.

**Acceptance Scenarios**:

1. **Given** `JWT_SECRET` 환경변수가 없을 때, **When** 서버를 시작하면, **Then** 명확한 오류 메시지와 함께 시작이 중단된다.
2. **Given** SSO 콜백 엔드포인트에 유효하지 않은 state 파라미터가 전달될 때, **When** 요청이 처리되면, **Then** 오류 응답과 함께 안전하게 거부된다.
3. **Given** 인증이 필요한 모든 API 엔드포인트에 대해, **When** 유효한 JWT 없이 요청하면, **Then** 401 응답이 반환된다.

---

### User Story 4 - 인증 엔드포인트 무차별 대입 공격 방어 (Priority: P2)

로그인/회원가입 엔드포인트에 짧은 시간 동안 과도한 요청이 들어올 때 속도 제한이 적용되어 자동화된 비밀번호 추측 공격을 방지한다.

**Why this priority**: 현재 로그인 엔드포인트에는 실패 횟수 제한이 없어 자동화 도구로 무제한 시도가 가능하다. 인증 엔드포인트는 가장 빈번하게 공격받는 대상이다.

**Independent Test**: 1분 내 임계값을 초과하는 로그인 요청 시 429 응답이 반환된다.

**Acceptance Scenarios**:

1. **Given** 로그인 엔드포인트에 단시간 임계값 초과 요청이 발생하면, **Then** 이후 요청은 `429 Too Many Requests`와 재시도 대기 안내를 반환한다.
2. **Given** 속도 제한이 걸린 후 대기 시간이 지나면, **Then** 정상적으로 로그인이 가능하다.
3. **Given** 일반적인 속도로 로그인하면, **Then** 속도 제한이 적용되지 않는다.

---

### User Story 5 - 업로드 이미지 접근 제어 (Priority: P2)

현재 `/uploads` 경로의 이미지 파일은 인증 없이 URL만 알면 접근 가능하다. 이미지 접근을 인증된 사용자로 제한한다.

**Why this priority**: 노트는 인증이 필요하지만 첨부 이미지는 공개 접근이 가능하다. 사용자의 개인 노트 이미지가 URL 노출만으로 외부에 공개되는 것은 프라이버시 침해다.

**Independent Test**: 미인증 상태에서 이미지 URL 직접 접근 시 401 응답이 반환된다.

**Acceptance Scenarios**:

1. **Given** 미인증 사용자가, **When** `/uploads/` 하위 이미지 URL에 직접 접근하면, **Then** 401 응답과 함께 접근이 거부된다.
2. **Given** 인증된 사용자가, **When** 자신의 노트 이미지를 요청하면, **Then** 이미지가 정상 반환된다.

---

### User Story 6 - CI 의존성 취약점 자동 스캔 (Priority: P3)

GitHub Actions CI 파이프라인에 의존성 취약점 스캔을 추가하여, 신규 취약점이 있는 패키지가 병합되는 것을 조기에 감지한다.

**Why this priority**: 현재 취약점은 0건이지만 자동 감지 체계가 없어 미래 취약점 도입이 조용히 지나칠 수 있다. CI 파이프라인에 기존 스텝으로 추가하는 것이므로 운영 부담이 낮다.

**Independent Test**: CI에서 알려진 취약점이 있는 패키지를 포함한 PR 제출 시 스캔이 실패(경고 또는 오류)하는 것을 확인.

**Acceptance Scenarios**:

1. **Given** CI 파이프라인에서, **When** 의존성에 알려진 high/critical 취약점이 있으면, **Then** CI가 실패하거나 경고를 출력한다.
2. **Given** 취약점 없는 PR이, **When** CI를 통과할 때, **Then** 스캔 스텝이 성공으로 완료된다.
3. **Given** 스캔이 실패했을 때, **When** 개발자가 로그를 확인하면, **Then** 어떤 패키지의 어떤 취약점인지 명확히 식별 가능하다.

---

### Edge Cases

- CORS 허용 도메인을 환경변수로 관리할 때, 미설정 시 개발용 기본값을 사용하는가?
- 속도 제한 적용 시 Kubernetes Ingress/로드밸런서 뒤에서 클라이언트 IP를 올바르게 식별하는가?
- 이미지 접근 제어 시 프론트엔드의 `<img>` 태그가 Authorization 헤더를 전달하지 못하는 경우 어떻게 처리하는가?
- JWT_SECRET 필수화 이후 로컬 개발 환경 설정이 `.env.example`에 충분히 안내되는가?
- 레거시 migrate.js 제거 후 신규 배포 환경에서 DB 스키마 초기화가 올바르게 동작하는가?
- SSO 관련 엔드포인트(`/api/auth/sso/*`)의 인증 경계가 의도한 대로 설정되어 있는가?

## Requirements *(mandatory)*

### Functional Requirements

**[P1 — 즉시 수정]**

- **FR-001**: 서버 시작 시 data.json/users.json 기반 마이그레이션 코드(migrate.js 및 관련 startup hook)가 실행되지 않아야 한다. 해당 코드와 파일 참조는 코드베이스에서 완전히 제거되어야 한다.
- **FR-002**: CORS 허용 출처는 운영 도메인(`https://study-note.yuna-pa.com`)과 개발 도메인(`http://localhost:5173`)만 명시적으로 허용해야 한다. 와일드카드(`*`)를 사용하지 않는다.
- **FR-003**: `JWT_SECRET` 환경변수가 설정되지 않은 경우 서버 시작을 중단하고 명확한 오류를 출력해야 한다. 코드에 하드코딩된 fallback 값을 사용하지 않는다.
- **FR-004**: SSO 추가 이후 모든 보호 엔드포인트에 대해 인증 미들웨어가 일관되게 적용되어 있는지 점검하고, 미적용 경로가 있으면 수정한다.

**[P2 — 고위험 개선]**

- **FR-005**: 인증 관련 엔드포인트(로그인, 회원가입)에 IP 기준 속도 제한을 적용하여, 임계값 초과 시 `429 Too Many Requests`를 반환해야 한다.
- **FR-006**: `/uploads` 경로의 정적 파일은 유효한 인증 없이 접근을 거부해야 한다.

**[P3 — 자동화 개선]**

- **FR-007**: CI 파이프라인(GitHub Actions)에 의존성 취약점 스캔 스텝을 추가하여, high/critical 취약점이 감지되면 빌드가 실패하거나 경고를 출력해야 한다.

**[공통]**

- **FR-008**: 모든 보안 변경 이후에도 기존 이메일/비밀번호 로그인, SSO 로그인, 노트 CRUD, 이미지 업로드/조회 기능이 정상 동작해야 한다 (회귀 없음).
- **FR-009**: CORS 허용 도메인 목록과 속도 제한 임계값은 환경변수로 조정 가능해야 한다.

### Constitution Alignment *(mandatory)*

- **CA-001**: 모든 보안 로직(CORS, 속도 제한, 이미지 접근 제어, JWT 검증)은 백엔드에서만 처리된다. 프론트엔드는 토큰 전달과 UI 렌더링만 담당한다.
- **CA-002**: 속도 제한 초과(429), 이미지 접근 거부(401) 응답은 모두 `{ success: false, data: null, error: "..." }` envelope를 따른다.
- **CA-003**: 속도 제한 구현은 신규 패키지 없이 in-process Map 방식으로 구현한다. `express-rate-limit` 등 외부 패키지를 사용하지 않는다 (plan.md 결정).
- **CA-004**: 이미지 접근 제어는 `express.static` 대신 인증 미들웨어를 거치는 라우트 핸들러로 변경한다. 기존 노트 에디터 이미지 렌더링 흐름 영향 최소화.
- **CA-005**: migrate.js 제거 후 DB 초기화는 기존 `db/index.js`의 `initialize()` 함수만으로 충분하다. 별도 마이그레이션 시스템 도입은 이번 범위 밖이다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 코드베이스에서 data.json, users.json, migrate.js 관련 참조가 0건이다.
- **SC-002**: 허용되지 않은 출처에서의 CORS 요청이 100% 차단된다.
- **SC-003**: `JWT_SECRET` 미설정 시 서버 시작이 실패하고 오류 메시지가 콘솔에 출력된다.
- **SC-004**: 인증이 필요한 모든 API 엔드포인트에 유효한 인증 없이 접근 시 100% 401 응답이 반환된다.
- **SC-005**: 로그인 엔드포인트 임계값 초과 요청의 100%가 429 응답을 받는다.
- **SC-006**: 미인증 상태에서 `/uploads/` 직접 접근 시 100% 401 응답이 반환된다.
- **SC-007**: CI 파이프라인에서 의존성 취약점 스캔이 실행되고, 결과가 PR 상태에 반영된다.
- **SC-008**: 보안 변경 적용 후 기존 기능(로그인, SSO, 노트 CRUD, 이미지)이 모두 정상 동작한다.

## Assumptions

- 운영 환경의 HTTPS/TLS는 Kubernetes Ingress에서 처리되므로 애플리케이션 레벨 HSTS는 이번 범위 밖이다.
- npm audit 기준 현재 알려진 취약점은 0건이다. 의존성 버전 업그레이드는 이번 범위에 포함하지 않는다.
- 속도 제한의 IP 식별은 k3s Ingress(Traefik)가 전달하는 `X-Forwarded-For` 헤더 기준으로 동작한다고 가정한다.
- 이미지 접근 제어 시 기존 프론트엔드 `<img>` 태그가 Authorization 헤더를 전달하지 못하는 문제가 있으므로, 쿼리 파라미터 토큰 방식 또는 별도 이미지 API 방식 중 하나를 계획 단계에서 선택한다.
- CI 의존성 스캔은 기존 GitHub Actions 워크플로우에 스텝을 추가하는 방식으로 구현한다. 별도 스캔 서비스 도입은 이번 범위 밖이다.
- 로컬 개발 환경에서는 `backend/.env` 파일에 `JWT_SECRET`이 설정되어 있어야 한다. `.env.example`에 필수 항목으로 가이드한다.
- 주 개발 및 검증 환경은 WSL Ubuntu다.
