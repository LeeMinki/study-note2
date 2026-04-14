# Feature Specification: Study Note App

**Feature Branch**: `001-study-note-app`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "Study Note라는 웹 애플리케이션을 만들어줘. 이 앱의 목적은 개발 및 학습 내용을 빠르게 기록하고, 태그 필터링과 검색으로 쉽게 다시 찾을 수 있게 하는 것이다."

## Clarifications

### Session 2026-04-14

- Q: Markdown 지원 범위는 어디까지인가? → A: 입력과 렌더링 표시를 모두 포함한다.
- Q: 첫 구현 범위에 삭제 기능이 포함되는가? → A: 첫 버전에 노트 삭제 기능을 포함한다.
- Q: 검색과 태그 필터링의 관계는 무엇인가? → A: 검색과 태그 필터링은 동시에 적용될 수 있어야 한다.
- Q: 목록 카드에는 어떤 정보를 보여야 하는가? → A: 제목, 포맷된 시간, 태그, 축약된 내용 미리보기를 표시한다.
- Q: 인라인 수정은 어디서 이루어지는가? → A: 목록의 노트 카드 내부에서 모달 없이 바로 수정한다.
- Q: 인증이 필요한가? → A: 인증이 필요 없는 단일 사용자 애플리케이션이다.
- Q: 새 패키지가 필요하면 어떻게 처리하는가? → A: 설치 전에 반드시 사용자 승인 요청을 한다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 빠른 노트 기록 (Priority: P1)

사용자는 개발 또는 학습 중 떠오른 내용을 제목, 본문, 태그와 함께 빠르게 기록할 수 있어야 한다.
본문은 Markdown 문법으로 작성할 수 있어야 하며, 저장 후에는 렌더링된 형태로 다시 읽을 수 있어야 한다.
수정은 목록의 노트 카드 내부에서 바로 이루어져야 하며, 모달 전환 없이 같은 화면 맥락을 유지해야 한다.

**Why this priority**: 이 기능이 없으면 앱의 핵심 가치인 "빠르게 기록"이 성립하지 않는다.

**Independent Test**: 사용자가 새 노트를 작성하고 저장한 뒤, 같은 노트 카드 안에서 인라인 편집 후
`Cmd/Ctrl + Enter`로 저장할 수 있으면 이 스토리는 독립적으로 가치가 있다.

**Acceptance Scenarios**:

1. **Given** 사용자가 빈 입력 상태에 있다, **When** 제목, Markdown 본문, 쉼표로 구분된 태그를 입력하고 저장한다,
   **Then** 새 노트가 저장되어 목록 상단에 나타난다.
2. **Given** 사용자가 기존 노트 카드를 보고 있다, **When** 인라인 편집 상태로 내용을 수정하고
   `Cmd/Ctrl + Enter`를 누른다, **Then** 수정 내용이 저장되고 `updatedAt`이 갱신된다.
3. **Given** 사용자가 태그 입력란에 `react, study, api`처럼 입력한다, **When** 저장한다,
   **Then** 태그는 개별 태그 단위로 정리되어 노트에 표시된다.
4. **Given** 사용자가 저장된 노트 카드를 보고 있다, **When** Markdown 본문이 표시된다,
   **Then** 원문 Markdown이 아니라 읽기 쉬운 렌더링 결과로 보여야 한다.
5. **Given** 사용자가 불필요한 노트를 보고 있다, **When** 삭제 동작을 실행한다,
   **Then** 해당 노트는 목록에서 제거되고 이후 검색 및 필터 결과에서도 제외된다.

---

### User Story 2 - 최근 노트 훑어보기 (Priority: P2)

사용자는 최근에 작성한 노트를 빠르게 훑어보고, 카드에 보이는 핵심 정보만으로 어떤 노트인지 즉시 파악할 수 있어야 한다.

**Why this priority**: 기록된 노트를 다시 찾는 첫 단계는 최신순 목록과 명확한 시간 표시다.

**Independent Test**: 여러 개의 노트를 작성한 뒤 목록이 최신 작성 시간 기준으로 정렬되고,
각 카드에 `YYYY. MM. DD. HH:mm` 형식의 시간이 표시되면 독립적으로 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 작성 시간이 다른 노트가 여러 개 있다, **When** 목록을 본다,
   **Then** 가장 최근에 작성된 노트가 가장 먼저 보여야 한다.
2. **Given** 사용자가 노트 카드를 본다, **When** 시간 정보를 확인한다,
   **Then** 날짜와 시간이 `YYYY. MM. DD. HH:mm` 형식으로 표시된다.
3. **Given** 사용자가 노트 목록을 훑어본다, **When** 각 카드를 본다,
   **Then** 각 카드는 제목, 포맷된 시간, 태그, 축약된 내용 미리보기를 함께 보여야 한다.

---

### User Story 3 - 태그와 검색으로 다시 찾기 (Priority: P3)

사용자는 태그 클릭과 검색바를 이용해 원하는 노트를 빠르게 좁혀서 다시 찾을 수 있어야 한다.

**Why this priority**: 기록만 가능하고 재탐색이 어렵다면 학습/개발 노트 앱으로서 효용이 크게 떨어진다.

**Independent Test**: 사용자가 태그를 클릭해 해당 태그 노트만 보거나, 검색어로 제목과 본문을 검색해
목록이 즉시 좁혀지면 이 스토리는 독립적으로 가치가 있다.

**Acceptance Scenarios**:

1. **Given** 서로 다른 태그를 가진 노트들이 있다, **When** 사용자가 화면에 보이는 태그 하나를 클릭한다,
   **Then** 해당 태그를 가진 노트만 목록에 남는다.
2. **Given** 사용자가 검색바에 단어를 입력한다, **When** 제목 또는 본문에 그 단어가 포함된 노트가 존재한다,
   **Then** 일치하는 노트만 결과로 표시된다.
3. **Given** 태그 필터와 검색어가 동시에 적용되어 있다, **When** 사용자가 필터를 해제하거나 검색어를 지운다,
   **Then** 목록은 즉시 전체 또는 남은 조건 기준으로 다시 계산된다.

### Edge Cases

- 제목은 있지만 본문이 비어 있는 노트도 저장 가능해야 하는가에 대한 기본값은 "가능"으로 간주하며,
  빈 본문은 검색 시 제목만 대상으로 동작해야 한다.
- 태그 입력에 공백, 중복 태그, 연속 쉼표가 포함되면 빈 태그는 제거하고 실제 값만 정규화해야 한다.
- 검색 결과가 없을 때는 빈 상태를 명확히 보여주고, 기존 노트 데이터가 손실된 것처럼 보이지 않아야 한다.
- 수정 중 저장에 실패하면 사용자가 입력 중인 내용은 화면에 남아 다시 시도할 수 있어야 한다.
- 작성 시간이 같은 노트가 여러 개면 최신 업데이트 시점 또는 일관된 보조 정렬 규칙으로 안정적으로 표시되어야 한다.
- 삭제 직후 현재 검색어 또는 태그 필터가 유지되는 경우, 남은 결과 목록이 즉시 다시 계산되어야 한다.
- 렌더링 가능한 Markdown이 포함된 노트도 목록 미리보기에서는 과도한 서식 없이 짧고 안정적인 텍스트 요약으로 보여야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to create a note with `title`, `content`, `tags`, `createdAt`,
  and `updatedAt`.
- **FR-002**: System MUST allow note content to be written using Markdown syntax and displayed back to the user as rendered Markdown.
- **FR-003**: System MUST allow users to edit an existing note inline inside the note card within the list view, not through a modal.
- **FR-004**: System MUST save inline edits when the user presses `Cmd + Enter` on macOS or
  `Ctrl + Enter` on other keyboard layouts.
- **FR-005**: System MUST display notes ordered by most recent creation time first.
- **FR-006**: System MUST display each note's date and time in the `YYYY. MM. DD. HH:mm` format.
- **FR-007**: System MUST allow users to enter tags as a comma-separated string during note creation and editing.
- **FR-008**: System MUST normalize tags so each note stores a clean set of individual tags without empty entries.
- **FR-009**: System MUST filter the visible note list when a displayed tag is selected.
- **FR-010**: System MUST provide a top-level search input that searches both note titles and note content.
- **FR-011**: System MUST update visible results immediately when search text or tag filters change, including when both are active at the same time.
- **FR-012**: System MUST preserve note data in local, single-user storage for the initial release.
- **FR-013**: System MUST keep frontend note interactions independent from the storage implementation so that
  the storage backend can be replaced later without requiring a full frontend rewrite.
- **FR-014**: System MUST expose note data to the frontend only through backend-managed interfaces and MUST NOT
  rely on frontend-managed persistence.
- **FR-015**: System MUST show clear empty states for both "no notes yet" and "no matching search/filter results".
- **FR-016**: System MUST allow the user to delete an existing note in the first release.
- **FR-017**: System MUST show each note card with a title, formatted timestamp, visible tags, and a shortened content preview in the list view.
- **FR-018**: System MUST operate as a single-user application with no authentication requirement in the first release.

### Constitution Alignment *(mandatory)*

- **CA-001**: The feature preserves the `/frontend` and `/backend` boundary by keeping note creation,
  update, listing, filtering inputs, and persistence behind backend-owned HTTP APIs. The frontend only renders
  note data and sends user actions through those APIs.
- **CA-002**: Backend note collection, note detail/update, and note search/list responses MUST all use
  `{ success: boolean, data: any, error: string | null }`.
- **CA-003**: No new dependency is assumed by this specification. If Markdown rendering or other convenience
  packages are later proposed, they MUST be requested for user approval before installation.
- **CA-004**: The planned editing model is inline-first because the constitution explicitly prefers inline
  editing over modals for fast, keyboard-friendly note updates, and that editing occurs inside each list card.
- **CA-005**: Initial persistence remains backend-owned local storage suitable for a single-user local app,
  while frontend flows remain storage-agnostic so the backing store can later be replaced.

### Key Entities *(include if feature involves data)*

- **Note**: A single study or development record with title, Markdown content, normalized tags,
  createdAt, and updatedAt.
- **Tag Filter**: A currently selected tag value used to limit which notes are visible in the list.
- **Search Query**: User-entered text applied against note titles and contents to narrow visible notes.
- **Note Preview**: A shortened summary derived from note content for use in the list card without replacing the full note body.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% 이상의 노트 작성 시도가 20초 이내에 완료된다.
- **SC-002**: 사용자가 검색어나 태그를 변경했을 때 95% 이상의 경우 1초 이내에 결과 변화를 인지할 수 있다.
- **SC-003**: 사용자는 최근 작성한 노트를 목록 상단 3개 안에서 10초 이내에 찾아낼 수 있다.
- **SC-004**: 사용자의 노트 수정 작업 중 100%가 모달 전환 없이 같은 화면 맥락에서 완료된다.
- **SC-005**: 사용자는 검색어와 태그 필터를 함께 사용해 원하는 노트를 15초 이내에 다시 찾을 수 있다.
- **SC-006**: 사용자는 목록 카드의 제목, 시간, 태그, 내용 미리보기만 보고 최근 노트의 주제를 구분할 수 있다.

## Assumptions

- 초기 버전의 사용자는 한 명이며, 계정 관리나 권한 구분은 범위에서 제외한다.
- 초기 버전은 로컬 환경에서 사용하는 웹 애플리케이션이며, 원격 동기화는 포함하지 않는다.
- 노트는 같은 사용자 환경에서 다시 열었을 때 유지되는 로컬 저장을 기본값으로 한다.
- Markdown은 작성 가능해야 하지만, 고급 서식 도구나 협업 기능은 초기 범위에 포함하지 않는다.
- 기본 사용 환경은 데스크톱 브라우저이며, 키보드 중심 입력 흐름을 우선한다.
- 노트 삭제는 첫 구현 범위에 포함되며, 삭제된 노트는 복구 기능 없이 즉시 목록에서 제거되는 것을 기본값으로 한다.
