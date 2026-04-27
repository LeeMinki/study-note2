# Feature Specification: Note Groups

**Feature Branch**: `016-note-groups`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Study Note에 노트를 그룹으로 관리하는 기능을 추가하고 싶다. 사용자가 노트를 그룹 단위로 정리할 수 있어야 한다. 태그와 별개로 더 구조적인 분류 단위를 제공해야 한다. 그룹별로 노트를 모아보고 관리할 수 있어야 한다. 현재 인증, 계정별 노트 분리, DB 기반 저장 구조를 유지해야 한다. 범위는 그룹 생성/목록/수정/삭제, 노트 그룹 할당/변경/해제, 그룹 기준 노트 필터링, 그룹 관련 UI, 저장 구조 및 서비스 경계 변경, 운영 및 개발 문서 반영이다. 범위 밖은 그룹 중첩, 다중 그룹 할당, 공유/협업, 그룹별 권한 분리, 그룹 색상/아이콘 등 고급 커스터마이징이다."

## Clarifications

### Session 2026-04-27

- Q: 그룹 계층 범위는 어떻게 제한하는가? → A: 그룹은 단일 계층만 지원하며 하위 그룹은 이번 범위 밖이다.
- Q: 노트와 그룹의 관계는 어떻게 제한하는가? → A: 각 노트는 최대 1개의 그룹에만 속할 수 있고, 그룹에 속하지 않은 노트도 허용한다.
- Q: 그룹 삭제 시 노트는 어떻게 처리하는가? → A: 그룹 삭제 시 해당 그룹의 노트는 삭제하지 않고 그룹만 해제된 상태로 남긴다.
- Q: 그룹의 소유권과 가시성 범위는 무엇인가? → A: 그룹은 로그인한 사용자 본인 계정 범위 안에서만 보이고 관리 가능하다.
- Q: 그룹 이름 중복은 허용하는가? → A: 같은 사용자 계정 안에서는 trim 후 대소문자를 무시한 이름 중복을 허용하지 않는다.
- Q: 그룹 정렬 기준은 무엇인가? → A: 그룹 선택/관리 목록은 이름 오름차순으로 정렬하고, 필터 UI에서는 그룹 없음 항목을 별도 고정 항목으로 제공한다.
- Q: 그룹 필터와 기존 검색/태그 필터는 어떻게 결합되는가? → A: 모든 활성 조건을 AND로 적용해 그룹, 검색어, 태그 조건을 모두 만족하는 노트만 표시한다.
- Q: UI 복잡도 기준은 무엇인가? → A: 현재 화면 구조 안에서 인라인 또는 페이지 내 컨트롤을 우선하고, 과도한 새 화면이나 모달 중심 흐름은 피한다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 그룹을 만들고 관리한다 (Priority: P1)

로그인한 사용자는 자신의 노트를 정리하기 위한 단일 계층 그룹을 만들고, 그룹 이름을 나중에 수정하거나 더 이상 필요 없는 그룹을 삭제할 수 있다. 그룹은 태그보다 더 큰 분류 단위로 사용되며, 사용자 본인의 계정 안에서만 보이고 관리된다.

**Why this priority**: 그룹 자체를 만들고 관리할 수 있어야 이후 노트 할당과 필터링이 의미를 가진다. 이 기능만으로도 사용자는 개인 학습 주제나 프로젝트 단위로 정리 기준을 만들 수 있다.

**Independent Test**: 새 그룹을 생성하고 목록에서 확인한 뒤 이름을 수정하고 삭제할 수 있으면 독립적으로 검증된다.

**Acceptance Scenarios**:

1. **Given** 로그인한 사용자가 그룹 관리 영역을 보고 있을 때, **When** 새 그룹 이름을 입력해 저장하면, **Then** 해당 그룹이 즉시 이름 오름차순 그룹 목록에 표시된다.
2. **Given** 사용자가 본인이 만든 그룹을 보고 있을 때, **When** 그룹 이름을 변경하면, **Then** 변경된 이름이 그룹 목록과 노트 작성/수정 화면의 선택 항목에 반영된다.
3. **Given** 사용자가 본인이 만든 그룹을 보고 있을 때, **When** 그룹을 삭제하면, **Then** 해당 그룹은 목록에서 사라지고 그 그룹에 속했던 노트는 삭제되지 않으며 그룹 없음 상태가 된다.
4. **Given** 한 사용자가 만든 그룹이 있을 때, **When** 다른 사용자가 자신의 계정으로 접속하면, **Then** 다른 사용자는 해당 그룹을 볼 수 없다.

---

### User Story 2 - 노트를 그룹에 넣고 변경한다 (Priority: P2)

로그인한 사용자는 노트를 작성하거나 수정할 때 하나의 그룹을 선택할 수 있다. 이미 그룹에 속한 노트는 다른 그룹으로 옮길 수 있고, 필요하면 그룹에서 해제해 그룹 없음 상태로 둘 수 있다.

**Why this priority**: 그룹은 노트와 연결될 때 실질적인 정리 수단이 된다. 노트가 최대 하나의 그룹에만 속한다는 규칙을 유지하면 사용자는 구조적 분류와 태그를 명확히 구분할 수 있다.

**Independent Test**: 노트 작성 화면에서 그룹을 선택해 저장하고, 기존 노트의 그룹을 변경하거나 해제한 뒤 노트 목록과 상세 표시가 일관되게 바뀌는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 사용자가 하나 이상의 그룹을 가지고 있을 때, **When** 새 노트를 작성하며 그룹을 선택하면, **Then** 저장된 노트에는 선택한 그룹이 표시된다.
2. **Given** 기존 노트가 그룹 A에 속해 있을 때, **When** 사용자가 인라인 수정에서 그룹 B로 변경해 저장하면, **Then** 해당 노트는 그룹 B에만 속한다.
3. **Given** 기존 노트가 어떤 그룹에 속해 있을 때, **When** 사용자가 그룹 선택을 해제하고 저장하면, **Then** 해당 노트는 그룹 없음 상태로 표시된다.
4. **Given** 사용자가 다른 계정의 그룹 식별자를 노트에 할당하려 할 때, **When** 저장을 시도하면, **Then** 저장은 거부되고 사용자의 기존 노트 상태는 유지된다.

---

### User Story 3 - 그룹별로 노트를 모아본다 (Priority: P3)

로그인한 사용자는 그룹을 선택해 해당 그룹에 속한 노트만 볼 수 있다. 그룹 필터는 기존 검색과 태그 필터와 AND 조건으로 함께 적용되며, 그룹 없음 노트도 별도 기준으로 찾을 수 있다.

**Why this priority**: 그룹 관리의 최종 가치는 특정 주제나 프로젝트의 노트만 빠르게 모아보는 데 있다. 기존 검색/태그 경험과 함께 작동해야 사용자가 새 분류 체계를 부담 없이 사용할 수 있다.

**Independent Test**: 여러 그룹과 그룹 없는 노트를 만든 뒤 그룹 필터, 태그 필터, 검색어를 동시에 적용해 표시 결과가 기대와 일치하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 여러 그룹에 노트가 나뉘어 있을 때, **When** 사용자가 특정 그룹을 선택하면, **Then** 해당 그룹의 노트만 최신순으로 표시된다.
2. **Given** 그룹 필터가 적용된 상태에서, **When** 사용자가 검색어를 입력하거나 태그를 선택하면, **Then** 그룹 조건과 검색/태그 조건을 모두 만족하는 노트만 최신순으로 표시된다.
3. **Given** 그룹 없음 노트가 있을 때, **When** 사용자가 그룹 없음 필터를 선택하면, **Then** 어떤 그룹에도 속하지 않은 노트만 표시된다.
4. **Given** 선택한 그룹에 일치하는 노트가 없을 때, **When** 목록이 렌더링되면, **Then** 사용자는 결과가 없다는 명확한 상태 메시지를 본다.

---

### Edge Cases

- 사용자가 빈 이름, 공백뿐인 이름, 지나치게 긴 이름으로 그룹을 만들거나 수정하려는 경우 저장을 거부하고 이유를 알려야 한다.
- 같은 계정 안에서 trim 후 대소문자만 다른 같은 이름의 그룹을 중복 생성하려는 경우 중복을 방지해야 한다.
- 그룹 삭제 시 해당 그룹에 속한 노트가 함께 삭제되지 않아야 한다.
- 노트가 속한 그룹이 삭제된 직후 목록이나 편집 화면을 보고 있는 경우, 노트는 그룹 없음 상태로 일관되게 표시되어야 한다.
- 다른 계정의 그룹을 조회, 수정, 삭제하거나 다른 계정의 노트에 할당하려는 시도는 거부되어야 한다.
- 검색어, 태그 필터, 그룹 필터를 동시에 적용했을 때 결과가 없으면 사용자가 어떤 조건이 적용 중인지 이해할 수 있어야 한다.
- 기존 노트는 그룹 정보가 없어도 정상적으로 목록에 표시되고 수정 가능해야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated user to create a group within that user's account.
- **FR-002**: The system MUST allow an authenticated user to view only the groups that belong to that user.
- **FR-003**: The system MUST allow an authenticated user to rename a group that belongs to that user.
- **FR-004**: The system MUST allow an authenticated user to delete a group that belongs to that user.
- **FR-005**: When a group is deleted, the system MUST keep the notes that belonged to the group and change them to group 없음.
- **FR-006**: The system MUST allow each note to be assigned to zero or one group.
- **FR-007**: The system MUST allow a user to assign, change, or remove a note's group while creating or editing the note.
- **FR-008**: The system MUST prevent a note from being assigned to a group owned by a different user.
- **FR-009**: The system MUST prevent users from viewing, editing, deleting, or filtering by groups owned by another user.
- **FR-010**: The system MUST support filtering the note list by a selected group.
- **FR-011**: The system MUST support filtering the note list by group 없음.
- **FR-012**: The system MUST apply group filtering together with existing search and tag filters using AND semantics.
- **FR-013**: The system MUST preserve the existing latest-first note ordering when group filters are applied.
- **FR-014**: The system MUST show a note's current group in the note list and in the note editing experience when a group is assigned.
- **FR-015**: The system MUST support existing notes that have no group without requiring manual migration by the user.
- **FR-016**: The system MUST validate group names by trimming surrounding whitespace, rejecting empty values, rejecting duplicate names within the same account using case-insensitive comparison, and enforcing a maximum length of 40 characters.
- **FR-017**: The system MUST provide user-friendly empty states for no groups, no grouped notes, and no results after combined filters.
- **FR-018**: The system MUST keep tags and groups as separate classification concepts; adding or changing a group MUST NOT alter note tags.
- **FR-019**: The system MUST update relevant development and operating documentation so future work understands the group feature, data ownership, and expected user flows.
- **FR-020**: The system MUST present groups in name ascending order in group selection and management contexts.
- **FR-021**: The system MUST keep group UI within the current note management structure using inline or page-embedded controls rather than adding modal-first or deeply nested navigation flows.

### Constitution Alignment *(mandatory)*

- **CA-001**: The feature preserves the frontend/backend boundary: the frontend displays group controls and sends HTTP requests; the backend owns group persistence, ownership checks, note assignment rules, and all data access.
- **CA-002**: Backend group and note responses must continue to use `{ success: boolean, data: any, error: string | null }` for every JSON response.
- **CA-003**: No new dependency is assumed for this specification. If planning later identifies a package need, implementation must pause for user approval before installation.
- **CA-004**: Group creation and renaming should use inline or page-embedded interactions consistent with the current app; modals are not part of the MVP interaction.
- **CA-005**: Storage changes remain backend-owned and must preserve the current account-separated database model while keeping existing notes valid when no group is assigned.

### Key Entities *(include if feature involves data)*

- **Group**: A user-owned, single-level structural category for notes. Key attributes include a display name, owner, creation time, and update time. The normalized display name is unique within the owning account.
- **Note**: An existing user-owned note that may reference zero or one group while retaining its title, content, tags, creation time, and update time.
- **User**: The account boundary that owns both groups and notes. Groups and note assignments cannot cross this boundary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a group, assign a note to it, and filter the list to that group in under 60 seconds during manual verification.
- **SC-002**: 100% of notes remain visible either under their assigned group or group 없음 after any group deletion.
- **SC-003**: 100% of cross-account group access attempts are rejected during verification.
- **SC-004**: Search, tag filtering, and group filtering can be combined with AND behavior without losing any active filter state.
- **SC-005**: Existing notes without group data continue to appear in the default note list and in the group 없음 filter.
- **SC-006**: Users can complete group rename and note group reassignment without leaving the note management screen.

## Assumptions

- Existing email/password and Google SSO authentication remain the account boundary for groups.
- A group name is unique only within one user's account after trimming and case-insensitive comparison; different users may use the same group name.
- Group deletion unassigns notes instead of deleting notes because notes are the primary user data.
- A note belongs to at most one group, and multi-group assignment remains outside this feature.
- Group ordering is name ascending for user-facing group lists; group 없음 is a separate fixed filter option.
- Primary development and verification run on WSL Ubuntu.
