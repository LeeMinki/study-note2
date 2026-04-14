# Tasks: 노트 편집 레이아웃 확장

**Input**: Design documents from `specs/002-expand-note-layout/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 유저 스토리 (US1/US2/US3)

---

## Phase 1: Setup

**Purpose**: 이 피처는 기존 프로젝트 구조를 활용하므로 별도 초기화 불필요. 신규 파일 생성 준비.

- [x] T001 `frontend/src/hooks/useLayoutPreference.js` 빈 파일 생성

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 유저 스토리가 공유하는 레이아웃 훅 구현

**⚠️ CRITICAL**: US1~US3 구현 전에 완료 필요

- [x] T002 `frontend/src/hooks/useLayoutPreference.js`에 localStorage 기반 레이아웃 상태 훅 구현 — `layoutMode`(`'default'|'wide'`) 반환 및 `toggleLayout()` 제공, 키: `study-note-layout`

**Checkpoint**: `useLayoutPreference` 훅이 localStorage를 정상적으로 읽고 쓰는지 확인

---

## Phase 3: User Story 1 - 넓은 레이아웃으로 전환 (Priority: P1) 🎯 MVP

**Goal**: 클릭 한 번으로 NoteComposer가 전체 너비를 차지하고 NoteList가 아래에 쌓이는 레이아웃으로 전환

**Independent Test**: 레이아웃 토글 버튼 클릭 → contentGrid가 단일 열로 전환 → 노트 내용 유지 확인

### Implementation for User Story 1

- [x] T003 [P] [US1] `frontend/src/styles/app.css`에 `.contentGrid--wide` CSS 클래스 추가 — `grid-template-columns: 1fr`, `.composerPanel--wide`에 `position: static` 적용
- [x] T004 [P] [US1] `frontend/src/App.jsx`에 `useLayoutPreference` 훅 연결 — `layoutMode`에 따라 `contentGrid`에 `contentGrid--wide` 클래스 조건부 적용, `layoutMode`와 `onToggleLayout` prop을 `NoteComposer`에 전달
- [x] T005 [US1] `frontend/src/components/NoteComposer.jsx`에 레이아웃 토글 버튼 추가 — `sectionHeading` 우측에 인라인 버튼 배치, `layoutMode`에 따라 아이콘/텍스트 상태 표시 (예: "넓게" / "좁게"), `onToggleLayout` prop 연결
- [x] T006 [US1] `frontend/src/styles/app.css`에 레이아웃 토글 버튼 스타일 추가 — `.layoutToggleButton` 클래스, 기존 버튼 디자인 시스템과 일관성 유지

**Checkpoint**: 브라우저에서 토글 버튼 클릭 시 2열 ↔ 단일 열 전환 확인, 노트 입력 내용 유지 확인

---

## Phase 4: User Story 2 - 레이아웃 선택 기억 (Priority: P2)

**Goal**: 선택한 레이아웃이 페이지 새로고침 및 브라우저 재시작 후에도 유지

**Independent Test**: 넓은 레이아웃 선택 → 새로고침 → 넓은 레이아웃 유지 확인

### Implementation for User Story 2

- [x] T007 [US2] `frontend/src/hooks/useLayoutPreference.js` 검증 — 초기 마운트 시 localStorage에서 저장된 값 읽어 상태 복원 로직 확인 및 보완 (T002에서 구현된 내용 검증)
- [x] T008 [US2] `frontend/src/App.jsx`에서 초기 렌더링 시 저장된 레이아웃 모드가 올바르게 적용되는지 확인 — localStorage 값이 없을 때 `'default'` 폴백 동작 검증

**Checkpoint**: localStorage에 `study-note-layout` 값 저장 확인, 새로고침 후 레이아웃 유지 확인

---

## Phase 5: User Story 3 - 3단계 레이아웃 선택 (Priority: P3)

**Goal**: 좁음 / 기본 / 넓음 세 가지 레이아웃 옵션 제공

**Independent Test**: 3가지 옵션 각각 선택 시 contentGrid 너비가 다르게 표시 확인

### Implementation for User Story 3

- [x] T009 [P] [US3] `frontend/src/hooks/useLayoutPreference.js`를 3단계 지원으로 확장 — `layoutMode`: `'narrow'|'default'|'wide'`, `setLayout(mode)` 함수 추가 (toggleLayout 대체 또는 병행)
- [x] T010 [P] [US3] `frontend/src/styles/app.css`에 `.contentGrid--narrow` CSS 클래스 추가 — `grid-template-columns: minmax(280px, 280px) minmax(0, 1fr)` (좁은 고정 너비)
- [x] T011 [US3] `frontend/src/components/NoteComposer.jsx`의 토글 버튼을 3단계 선택 UI로 교체 — 좁음/기본/넓음 3개 버튼 또는 세그먼트 컨트롤 형태, 현재 선택 강조 표시
- [x] T012 [US3] `frontend/src/App.jsx`에서 3단계 레이아웃 클래스 매핑 업데이트 — `narrow` → `contentGrid--narrow`, `default` → 기본, `wide` → `contentGrid--wide`

**Checkpoint**: 3개 옵션 각각 선택 시 레이아웃 변화 확인, localStorage에 올바른 값 저장 확인

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T013 [P] `frontend/src/components/NoteComposer.jsx` 키보드 접근성 확인 — 레이아웃 버튼에 `aria-label` 속성 추가, Tab 포커스 동작 검증
- [x] T014 [P] `frontend/src/styles/app.css` `@media (max-width: 880px)` 구간에서 wide/narrow 모드 동작 확인 — 좁은 화면에서는 레이아웃 선택 무효화 또는 단일 열 강제 적용
- [x] T015 quickstart.md 검증 절차에 따라 전체 플로우 수동 테스트 실행

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — US1~US3 모두 차단
- **US1 (Phase 3)**: Phase 2 완료 필수 — MVP 최소 단위
- **US2 (Phase 4)**: Phase 2 완료 필수 — US1과 독립적 (훅이 이미 localStorage 처리)
- **US3 (Phase 5)**: Phase 2 완료 필수 — US1/US2와 독립적
- **Polish (Phase 6)**: 원하는 유저 스토리 완료 후

### Parallel Opportunities

```bash
# Phase 3 내 병렬 실행 가능:
T003: app.css에 CSS 클래스 추가
T004: App.jsx에 훅 연결
# (T005는 T004 완료 후)

# Phase 5 내 병렬 실행 가능:
T009: 훅 3단계 확장
T010: CSS narrow 클래스 추가
```

---

## Implementation Strategy

### MVP (US1만 구현)
1. Phase 1 → Phase 2 → Phase 3 완료
2. **검증**: 토글 버튼 동작 확인
3. 필요 시 PR 생성

### 전체 구현
1. MVP 완료 후 Phase 4 (localStorage 복원 검증)
2. Phase 5 (3단계 옵션)
3. Phase 6 (접근성, 반응형)

---

## Summary

- **총 태스크**: 15개
- **US1 (P1 MVP)**: T001~T006 (6개)
- **US2 (P2)**: T007~T008 (2개)
- **US3 (P3)**: T009~T012 (4개)
- **Polish**: T013~T015 (3개)
- **병렬 기회**: T003+T004 (Phase 3), T009+T010 (Phase 5)
- **백엔드 변경**: 없음
- **새 의존성**: 없음
