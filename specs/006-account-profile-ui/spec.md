# Feature Specification: 계정 프로필 UI 및 상세정보 화면

**Feature Branch**: `006-account-profile-ui`
**Created**: 2026-04-15
**Status**: Clarified
**Input**: Jira SP-32 — "앱 상단에 프로필 버튼을 추가하고, 전체 화면 전환형 프로필 상세 화면에서 사용자 정보를 조회·수정할 수 있도록 한다."

## Clarifications

### Session 2026-04-15

- Q: 프로필 화면은 어떤 방식으로 열리는가? → A: 상단 프로필 버튼 클릭 후 전체 화면 전환형 뷰
- Q: 프로필 화면에서 어떤 정보를 다루는가? → A: `email`, `name`, `displayName`, `createdAt` 표시 + 프로필 수정 기능 포함

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 프로필 화면 진입 (Priority: P1)

로그인한 사용자는 메인 화면 상단의 프로필 버튼을 눌러 자신의 계정 정보를 확인하는 전용 화면으로 이동할 수 있다.

**Why this priority**: 프로필 기능의 진입점이며, 나머지 상세 조회와 수정의 전제 조건이다.

**Independent Test**: 로그인 후 상단 프로필 버튼을 눌렀을 때 노트 화면 대신 프로필 화면이 표시되고, 뒤로 가기 동작으로 메인 화면에 복귀하면 된다.

**Acceptance Scenarios**:

1. **Given** 로그인한 사용자가 메인 화면에 있을 때, **When** 상단의 프로필 버튼을 클릭하면, **Then** 전체 화면 프로필 뷰가 열린다.
2. **Given** 사용자가 프로필 화면에 있을 때, **When** 메인으로 돌아가기를 선택하면, **Then** 기존 노트 화면으로 복귀한다.

---

### User Story 2 - 프로필 상세 조회 (Priority: P2)

사용자는 프로필 화면에서 자신의 계정 정보를 읽기 쉬운 형태로 확인할 수 있다.

**Why this priority**: 프로필 화면이 단순 이동만으로 끝나지 않고 실제 계정 컨텍스트를 제공해야 한다.

**Independent Test**: 프로필 화면에 이메일, 이름, 표시 이름, 가입 시각이 표시되면 된다.

**Acceptance Scenarios**:

1. **Given** 유효한 토큰을 가진 사용자가 프로필 화면을 열었을 때, **When** 프로필 데이터를 불러오면, **Then** 이메일, 이름, 표시 이름, 가입일시가 표시된다.
2. **Given** 토큰이 만료되었거나 유효하지 않을 때, **When** 프로필 데이터를 요청하면, **Then** 사용자는 더 이상 프로필 화면을 유지하지 못하고 인증이 필요한 상태로 돌아간다.

---

### User Story 3 - 프로필 수정 (Priority: P3)

사용자는 프로필 화면에서 이름과 표시 이름을 수정하고 저장할 수 있다.

**Why this priority**: 사용자가 회원가입 이후 자신의 기본 프로필을 관리할 수 있어야 한다.

**Independent Test**: 프로필 화면에서 이름과 표시 이름을 바꾸고 저장한 뒤, 저장 성공 메시지가 보이고 새로고침 후에도 변경값이 유지되면 된다.

**Acceptance Scenarios**:

1. **Given** 사용자가 프로필 화면에서 이름과 표시 이름을 수정했을 때, **When** 저장하면, **Then** 변경 내용이 서버에 반영되고 화면에도 즉시 갱신된다.
2. **Given** 사용자가 이름 또는 표시 이름을 비운 상태로 저장하려고 할 때, **When** 제출하면, **Then** 유효성 오류가 표시되고 저장되지 않는다.
3. **Given** 사용자가 프로필을 성공적으로 저장했을 때, **When** 이후 다시 프로필 화면을 열거나 새로고침하면, **Then** 저장된 값이 유지된다.

---

### Edge Cases

- 프로필 로딩 중에는 빈 화면 대신 로딩 상태가 보여야 한다.
- 프로필 저장 요청이 실패하면 기존 입력값은 유지되어야 한다.
- 이메일과 가입 시각은 표시 전용 정보로 남고, 수정 가능한 필드로 노출되면 안 된다.
- 메인 화면과 프로필 화면 전환이 라우터 없이 동작하더라도 인증 상태와 노트 목록 상태는 유지되어야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 로그인 상태의 메인 화면 상단에 프로필 버튼을 제공해야 한다.
- **FR-002**: 시스템은 프로필 버튼 클릭 시 메인 노트 화면 대신 전체 화면 프로필 뷰를 표시해야 한다.
- **FR-003**: 시스템은 인증된 사용자의 현재 프로필 정보를 조회하는 기능을 제공해야 한다.
- **FR-004**: 프로필 화면은 `email`, `name`, `displayName`, `createdAt`를 표시해야 한다.
- **FR-005**: 시스템은 사용자가 `name`과 `displayName`을 수정해 저장할 수 있게 해야 한다.
- **FR-006**: 시스템은 프로필 저장 성공 후 갱신된 사용자 정보를 즉시 화면에 반영해야 한다.
- **FR-007**: 시스템은 유효하지 않은 토큰으로 프로필 조회 또는 저장을 시도하면 인증이 필요한 상태로 전환해야 한다.
- **FR-008**: 프로필 수정 실패 시 사용자가 입력한 값은 화면에 유지되어야 한다.

### Constitution Alignment *(mandatory)*

- **CA-001**: 프로필 조회/수정 로직은 `/backend`에서만 처리하고, 프론트엔드는 HTTP API를 통해 현재 사용자 데이터를 읽고 쓴다.
- **CA-002**: 추가/변경되는 백엔드 엔드포인트는 `GET /api/auth/me`, `PATCH /api/auth/me`이며 응답은 `{ success, data, error }` envelope을 유지한다.
- **CA-003**: 신규 의존성은 추가하지 않는다. 기존 Express, React, fetch/axios 범위에서 해결한다.
- **CA-004**: UX는 모달 대신 전체 화면 전환형 프로필 뷰를 사용하고, 메인 앱 내부 조건부 렌더링으로 구현한다.
- **CA-005**: 프로필 필드 저장은 기존 `users.json` 저장소를 계속 사용하며, 백엔드 repository/service를 통해서만 갱신한다.

### Key Entities *(include if feature involves data)*

- **CurrentUserProfile**: 현재 로그인 사용자의 공개 프로필. `id`, `email`, `name`, `displayName`, `createdAt`, `provider`
- **ProfileUpdateInput**: 사용자가 프로필 화면에서 수정 가능한 입력. `name`, `displayName`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 로그인한 사용자는 프로필 버튼 클릭 후 2초 이내에 프로필 화면을 볼 수 있다.
- **SC-002**: 프로필 저장 성공 후 변경된 이름과 표시 이름이 즉시 반영된다.
- **SC-003**: 만료되거나 잘못된 토큰으로 프로필 API 접근 시 100% 인증 상태가 해제된다.
- **SC-004**: 프로필 수정 실패 시 사용자 입력 손실 없이 재시도가 가능하다.

## Assumptions

- 프로필 수정 범위는 `name`, `displayName`으로 제한한다.
- `email`과 `createdAt`은 읽기 전용으로 표시만 한다.
- 라우팅 라이브러리는 추가하지 않고 기존 단일 화면 앱 내부 상태 전환으로 구현한다.
- 프로필 화면에서도 로그아웃은 계속 가능해야 한다.
