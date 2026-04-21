# Feature Specification: SSO Login

**Feature Branch**: `013-sso-login`
**Created**: 2026-04-20
**Status**: Implemented

## Clarifications

### Session 2026-04-20

- Q: SSO 제공자 확정 및 확장 구조 수준 → A: Google OAuth2 확정. provider 이름을 URL/코드에서 파라미터로 처리해 두 번째 제공자 추가 시 설정값 변경만으로 가능하도록 구조화한다.
- Q: local ↔ SSO 계정 연결 후 허용 로그인 방법 → A: 두 방법 모두 허용. 연결된 계정은 local 비밀번호 로그인과 SSO 로그인 모두 가능하다.
- Q: 로그아웃 시 SSO 제공자 세션 종료 여부 → A: Study Note JWT만 삭제. Google 등 제공자 세션은 그대로 유지한다.
- Q: Google OAuth2 앱에 등록할 callback URL 형식 → A: `https://study-note.yuna-pa.com/api/auth/sso/google/callback` (백엔드 직접 수신 후 프론트로 리다이렉트).
- Q: SSO 자동 계정 생성 시 name/displayName 결정 방식 → A: Google 제공 이름을 name/displayName으로 자동 설정. 미제공 시 이메일 앞부분(@앞)으로 fallback.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SSO로 로그인 (Priority: P1)

기존 Study Note 계정이 없는 사용자가 SSO 제공자(예: Google)를 통해 최초 로그인한다. 시스템은 해당 SSO 계정 정보를 기반으로 사용자 계정을 자동 생성하고, 로그인 상태로 전환한다.

**Why this priority**: 새 사용자가 이메일/비밀번호 없이 즉시 서비스를 사용할 수 있게 하는 핵심 기능. 이것이 작동해야 나머지 모든 사용자 스토리가 의미를 갖는다.

**Independent Test**: 신규 브라우저에서 "SSO로 로그인" 버튼 클릭 → SSO 제공자 인증 완료 → Study Note 메인 화면 진입 및 빈 노트 목록 확인으로 독립 검증 가능.

**Acceptance Scenarios**:

1. **Given** 미인증 사용자가 로그인 화면에 있을 때, **When** SSO 제공자 로그인 버튼을 클릭하고 제공자 인증을 완료하면, **Then** Study Note에 새 계정이 생성되고 메인 화면으로 이동한다.
2. **Given** 이미 SSO로 계정이 생성된 사용자가 로그인 화면에 있을 때, **When** 동일 SSO 제공자로 다시 로그인하면, **Then** 기존 계정으로 로그인되고 이전 노트 목록이 표시된다.
3. **Given** SSO 제공자 인증 중 사용자가 취소하면, **When** 콜백이 실패 상태로 돌아오면, **Then** 로그인 화면으로 복귀하고 명확한 오류 메시지가 표시된다.

---

### User Story 2 - 기존 local 계정 사용자의 SSO 연동 (Priority: P2)

이메일/비밀번호로 이미 가입한 사용자가 프로필 화면에서 Google 계정 연결 버튼을 클릭해 SSO를 연결한다. 연결 후 이메일/비밀번호 로그인과 Google SSO 로그인을 모두 사용할 수 있다.

**Why this priority**: 기존 사용자가 SSO를 추가하면서 노트 데이터가 유실되지 않아야 한다. P1 이후 즉시 구현되어야 하는 데이터 무결성 요구사항.

**Independent Test**: local 계정(test@example.com) 생성 + 노트 작성 → 프로필 화면 "Google 계정 연결" 클릭 → Google 인증 → "Google 계정이 연결되었습니다" 메시지 확인 → 기존 노트 100% 표시.

**Acceptance Scenarios**:

1. **Given** local 계정으로 로그인된 사용자가 프로필 화면에서 "Google 계정 연결" 버튼을 클릭하고 Google 인증을 완료하면, **Then** 프로필 화면에 "Google 계정이 연결되어 있습니다"가 표시되고 기존 노트가 그대로 유지된다.
2. **Given** Google 계정이 이미 연결된 상태에서, **When** 이메일/비밀번호로도 로그인하면, **Then** 동일한 계정으로 로그인되고 노트 목록이 표시된다.
3. **Given** 이메일 B로만 SSO 계정이 존재할 때, **When** 이메일/비밀번호로 같은 이메일 B로 회원가입을 시도하면, **Then** 이미 계정이 존재한다는 안내가 표시된다.

---

### User Story 3 - 로그아웃 및 세션 관리 (Priority: P3)

SSO로 로그인한 사용자가 로그아웃한다. 이후 동일 세션에서 Study Note에 다시 접근하면 인증이 필요하다.

**Why this priority**: 보안 기본 요건이나 P1/P2가 먼저 구현되어도 앱이 사용 가능하다.

**Independent Test**: SSO 로그인 후 로그아웃 클릭 → 로그인 화면 복귀 → 브라우저 뒤로가기로 메인 화면 접근 시 다시 로그인 화면으로 리다이렉트.

**Acceptance Scenarios**:

1. **Given** SSO로 로그인된 사용자가, **When** 로그아웃 버튼을 클릭하면, **Then** Study Note 세션이 종료되고 로그인 화면으로 이동한다.
2. **Given** SSO 세션이 만료되었을 때, **When** 사용자가 보호된 페이지에 접근하면, **Then** 로그인 화면으로 리다이렉트된다.

---

### Edge Cases

- SSO 제공자가 이메일 주소를 제공하지 않는 경우 사용자를 어떻게 식별하는가?
- 동일 이메일로 두 개의 서로 다른 SSO 제공자 계정이 존재하는 경우?
- SSO 콜백 처리 중 네트워크 오류 발생 시 사용자 경험은?
- SSO 제공자 측에서 사용자가 앱 접근 권한을 취소하면?
- 로컬 계정 이메일과 SSO 이메일이 대소문자만 다른 경우?
- SSO 연결 후 두 방법이 모두 허용되므로, local 비밀번호를 변경하거나 분실한 경우의 복구 경로는?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 로그인 화면에는 기존 이메일/비밀번호 입력 양식과 함께 SSO 로그인 버튼이 표시되어야 한다.
- **FR-002**: 사용자가 SSO 로그인 버튼을 클릭하면 SSO 제공자의 인증 페이지로 이동해야 한다.
- **FR-003**: SSO 인증 완료 후 콜백을 수신하고 사용자 정보를 추출하여 계정 조회/생성을 수행해야 한다.
- **FR-004**: SSO로 최초 로그인하는 사용자는 자동으로 계정이 생성되어야 한다. `name`과 `displayName`은 SSO 제공자가 전달하는 이름으로 설정하며, 이름이 제공되지 않으면 이메일 주소의 앞부분(@앞)을 사용한다.
- **FR-005**: 로그인된 사용자는 프로필 화면에서 Google 계정 연결 버튼을 통해 SSO를 추가 연결할 수 있다. 연결 후 이메일/비밀번호 로그인과 SSO 로그인 모두 허용된다.
- **FR-005b**: 연결 시 해당 Google 계정이 이미 다른 계정에 연결되어 있으면 오류를 표시하고 연결을 거부한다.
- **FR-006**: SSO 로그인 성공 후 기존 local 로그인과 동일한 방식으로 인증 토큰이 발급되어야 한다.
- **FR-007**: SSO 콜백 실패(사용자 취소, 오류)는 로그인 화면으로 복귀하며 적절한 오류 메시지를 표시해야 한다.
- **FR-008**: SSO로 생성된 계정의 사용자도 기존 local 계정과 동일하게 노트 CRUD를 사용할 수 있어야 한다.
- **FR-009**: 사용자 계정은 인증 방식(local/SSO)과 무관하게 고유하게 식별되어야 한다.
- **FR-010**: SSO 사용자 로그아웃은 Study Note JWT 삭제로만 처리한다. SSO 제공자(Google 등) 세션은 종료하지 않는다.

### Constitution Alignment *(mandatory)*

- **CA-001**: SSO 인증 콜백 처리와 토큰 발급은 모두 백엔드에서 처리한다. 프론트엔드는 로그인 버튼 표시, SSO 제공자 리다이렉트 시작, 콜백 후 JWT 수신 역할만 담당한다.
- **CA-002**: 신규 엔드포인트: `GET /api/auth/sso/:provider` (SSO 리다이렉트 시작), `POST /api/auth/sso/:provider/link-start` (로그인된 사용자의 계정 연결 시작, JWT 필요), `GET /api/auth/sso/:provider/callback` (콜백 처리, JWT 발급 또는 계정 연결 후 프론트엔드로 리다이렉트). Google 등록 callback URL: `https://study-note.yuna-pa.com/api/auth/sso/google/callback`. 모든 JSON 응답은 `{ success, data, error }` envelope를 따른다.
- **CA-003**: SSO OAuth2 흐름은 Node.js 22 내장 `fetch`로 직접 구현한다. 신규 npm 패키지 없음 (plan.md 결정).
- **CA-004**: 로그인 화면 내 SSO 버튼 추가는 기존 AuthForm 컴포넌트 내 인라인 확장으로 구현한다. 별도 모달 불필요.
- **CA-005**: 사용자 엔티티의 `provider` (local/google), `provider_id` (Google sub) 컬럼을 활용한다. 두 컬럼은 012-db-migration에서 이미 존재하며 스키마 변경 없음. 저장은 기존 SQLite DB, 백엔드 레포지터리 계층을 통해 접근한다.

### Key Entities *(include if feature involves data)*

- **User (기존 컬럼 활용)**: `provider` (local/google), `provider_id` (Google sub, local이면 NULL), `password_hash` (SSO 전용 계정은 NULL). 012-db-migration에서 이미 존재하는 컬럼이며 스키마 변경 없음.
- **SSOIdentity**: SSO 제공자로부터 수신하는 프로필 데이터 (제공자명, 제공자 내 사용자 ID, 이메일, 이름). 사용자 조회/생성에 사용되고 별도 저장하지 않음.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: SSO 로그인 시작부터 Study Note 메인 화면 진입까지 전체 흐름이 30초 이내에 완료된다 (제공자 인증 UI 조작 시간 제외).
- **SC-002**: 기존 local 계정을 보유한 사용자가 동일 이메일 SSO로 전환 후 기존 노트 100%가 유지된다.
- **SC-003**: SSO 콜백 실패(취소, 오류) 시 사용자가 로그인 화면으로 복귀하여 재시도할 수 있다.
- **SC-004**: SSO 로그인 사용자의 노트 CRUD 성공률이 local 로그인 사용자와 동일 수준이다.
- **SC-005**: 기존 local 이메일/비밀번호 로그인 흐름이 SSO 추가 후에도 정상 동작한다 (회귀 없음).

## Assumptions

- SSO 제공자는 **Google OAuth2**를 첫 번째 대상으로 확정한다. provider 이름을 URL 및 내부 로직에서 파라미터로 처리하여, 두 번째 제공자 추가 시 설정값(Client ID/Secret, scope, callback URL) 변경만으로 가능하도록 설계한다. 이번 spec에서는 Google 1개만 구현한다.
- 사용자 식별 기준은 이메일 주소다. SSO 제공자가 이메일을 제공하지 않는 경우는 이번 spec 범위 밖이다.
- 계정 연결 경로는 두 가지다. (1) 로그인 시 자동 연결: SSO 로그인 중 동일 이메일의 local 계정이 발견되면 자동으로 연결한다. (2) 프로필 화면 수동 연결: 이미 로그인된 local 사용자가 프로필 화면의 "Google 계정 연결" 버튼으로 명시적으로 연결한다.
- SSO 제공자 OAuth2 앱 등록(Client ID/Secret) 및 콜백 URL 설정은 도메인 `https://study-note.yuna-pa.com` 기준으로 수행한다. Google callback URL: `https://study-note.yuna-pa.com/api/auth/sso/google/callback`.
- 복잡한 계정 병합 UI(연결 확인 모달 등)는 이번 spec 범위 밖이다. 연결은 버튼 클릭 후 Google 인증으로 즉시 완료된다.
- 주 개발 및 검증 환경은 WSL Ubuntu다.
