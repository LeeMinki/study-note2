# Feature Specification: 회원가입 검증 및 프로필 필드 확장

**Feature Branch**: `005-signup-validation-and-fields`
**Created**: 2026-04-15
**Status**: Clarified
**Input**: Jira SP-31 — "회원가입 폼에 비밀번호 확인을 추가하고, 사용자 기본 프로필 필드(name, displayName)를 수집/저장/검증하도록 확장한다."

## Clarifications

### Session 2026-04-15

- Q: 회원가입 확장 필드는 무엇인가? → A: `name`, `displayName` 추가
- Q: 비밀번호 확인은 어디서 어떻게 검증하는가? → A: 클라이언트에서 비밀번호 일치 여부를 확인하고, 서버는 기존 비밀번호 규칙만 검증

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 확장된 회원가입 완료 (Priority: P1)

신규 사용자가 이메일, 이름, 표시 이름, 비밀번호, 비밀번호 확인을 입력해 계정을 만들고 즉시 로그인 상태로 진입할 수 있다.

**Why this priority**: 인증 이후의 프로필 경험과 표시 이름 노출의 전제 조건이다.

**Independent Test**: 회원가입 탭에서 필수 필드를 올바르게 입력하고 제출했을 때 계정이 생성되고 메인 화면으로 진입하면 된다.

**Acceptance Scenarios**:

1. **Given** 미가입 사용자가 회원가입 탭을 열었을 때, **When** `name`, `displayName`, `email`, `password`, `passwordConfirm`을 올바르게 입력하고 제출하면, **Then** 계정이 생성되고 로그인 상태로 전환된다.
2. **Given** 서버가 회원가입 요청을 처리했을 때, **When** 응답을 반환하면, **Then** 사용자 정보에 `name`과 `displayName`이 포함된다.

---

### User Story 2 - 회원가입 입력 검증 (Priority: P2)

사용자는 잘못된 회원가입 입력을 제출하기 전에 어떤 항목이 문제인지 즉시 확인할 수 있다.

**Why this priority**: 실패 원인을 빠르게 이해할 수 있어 회원가입 이탈을 줄인다.

**Independent Test**: 회원가입 탭에서 비밀번호 확인 불일치, 빈 이름, 빈 표시 이름, 잘못된 이메일을 각각 입력했을 때 적절한 오류가 표시되면 된다.

**Acceptance Scenarios**:

1. **Given** 사용자가 비밀번호 확인을 다르게 입력했을 때, **When** 제출하면, **Then** 서버 요청 없이 "비밀번호 확인이 일치하지 않습니다" 오류가 표시된다.
2. **Given** 사용자가 이름 또는 표시 이름을 비워 둔 상태일 때, **When** 제출하면, **Then** 누락된 필드에 대한 오류가 표시되고 회원가입이 진행되지 않는다.
3. **Given** 서버가 이메일 중복 또는 유효성 오류를 반환했을 때, **When** 화면에 반영되면, **Then** 기존 입력값이 유지되어 사용자가 일부만 수정할 수 있다.

---

### Edge Cases

- 이름과 표시 이름에 앞뒤 공백이 포함되면 저장 전에 trim 처리되어야 한다.
- 로그인 탭에서는 회원가입 전용 필드와 검증이 표시되면 안 된다.
- 비밀번호 확인이 비어 있거나 비밀번호보다 짧아도 "일치하지 않음"보다 먼저 필수 입력 오류가 표시되어야 한다.
- 이미 가입된 이메일에 대해서는 기존 중복 가입 방지 메시지가 유지되어야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 회원가입 시 `name`, `displayName`, `email`, `password`를 함께 입력받아야 한다.
- **FR-002**: 회원가입 화면은 `passwordConfirm` 입력 필드를 제공해야 한다.
- **FR-003**: 시스템은 클라이언트에서 `password`와 `passwordConfirm`이 정확히 일치할 때만 회원가입 요청을 전송해야 한다.
- **FR-004**: 시스템은 이름과 표시 이름이 비어 있지 않은지 검증해야 한다.
- **FR-005**: 시스템은 이름과 표시 이름을 공백 제거 후 저장해야 한다.
- **FR-006**: 회원가입 성공 응답은 사용자 정보에 `name`과 `displayName`을 포함해야 한다.
- **FR-007**: 로그인 성공 응답도 사용자 정보에 `name`과 `displayName`을 포함해야 한다.
- **FR-008**: 회원가입 검증 실패 시 사용자가 입력한 값은 폼에 유지되어야 한다.

### Constitution Alignment *(mandatory)*

- **CA-001**: 회원가입 필드 검증의 서버 규칙은 `/backend`에서 관리하고, 프론트엔드는 `/api/auth/register` HTTP API로만 요청한다.
- **CA-002**: 변경되는 백엔드 엔드포인트는 `POST /api/auth/register`, `POST /api/auth/login`이며 응답은 모두 `{ success, data, error }` envelope을 유지한다.
- **CA-003**: 신규 의존성은 추가하지 않는다. 기존 `bcryptjs`, `jsonwebtoken`, React, fetch만 사용한다.
- **CA-004**: UX는 기존 인라인 인증 폼을 유지하되, 회원가입 탭에만 추가 필드와 즉시 검증 메시지를 노출한다.
- **CA-005**: 사용자 프로필 필드 저장은 기존 `users.json` 기반 저장소에 포함되며, 저장 책임은 계속 백엔드가 가진다.

### Key Entities *(include if feature involves data)*

- **UserProfileFields**: 사용자 기본 프로필 데이터. `name`, `displayName`
- **RegistrationFormState**: 회원가입 폼 상태. `name`, `displayName`, `email`, `password`, `passwordConfirm`, 오류 메시지

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 신규 사용자는 확장된 회원가입 필드를 입력해 1분 이내에 가입을 완료할 수 있다.
- **SC-002**: 비밀번호 확인 불일치 케이스는 서버 요청 전에 100% 차단된다.
- **SC-003**: 회원가입 성공 시 저장된 사용자 정보에 `name`과 `displayName` 누락이 0건이어야 한다.
- **SC-004**: 잘못된 입력으로 인한 회원가입 실패 시 사용자는 전체 재입력 없이 필요한 필드만 수정해 다시 제출할 수 있다.

## Assumptions

- `name`과 `displayName`은 MVP에서 모두 필수 입력이다.
- `passwordConfirm`은 서버에 저장하거나 응답에 포함하지 않는다.
- 기존 로그인 플로우와 토큰 저장 방식은 유지한다.
- 프로필 필드 길이 제한은 기본적인 입력 안전성을 위한 수준으로만 적용하며, 과도한 프로필 스키마 확장은 이번 범위 밖이다.
