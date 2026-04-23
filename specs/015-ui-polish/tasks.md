# Tasks: UI Polish

**Input**: Design documents from `/specs/015-ui-polish/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Organization**: 공통 스타일 → 상태 UI → 화면별(P1→P2→P3) → 반응형 점검 → 문서화

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일을 다루므로 병렬 실행 가능
- **[Story]**: 해당 User Story ([US1]~[US5])
- 파일 경로는 레포지토리 루트 기준

---

## Phase 1: Setup — 공통 스타일 기반 구축

**Purpose**: 모든 화면이 공유하는 CSS 디자인 토큰과 공통 유틸리티 클래스를 `app.css`에 정의. 이후 모든 Phase가 이 토큰을 참조.

**⚠️ CRITICAL**: 이 Phase가 완료되기 전까지 각 화면 Phase를 시작하지 않는다.

- [X] T001 `frontend/src/styles/app.css`의 `:root` 블록 최상단에 CSS 변수 섹션 추가. 추가할 변수: `--color-brand: #9c4f19`, `--color-brand-dark: #7f4b13`, `--color-text: #1d1b16`, `--color-text-muted: #6a5c4a`, `--color-text-subtle: #5e5548`, `--color-text-error: #8f2424`, `--color-text-success: #1c6b3c`, `--color-surface: rgba(255, 250, 243, 0.9)`, `--color-border: rgba(74, 49, 22, 0.12)`, `--color-tag-bg: rgba(229, 171, 84, 0.18)`, `--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 14px`, `--space-lg: 20px`, `--space-xl: 32px`, `--radius-sm: 8px`, `--radius-md: 14px`, `--radius-lg: 20px`, `--radius-pill: 999px`

- [X] T002 `frontend/src/styles/app.css`에서 하드코딩된 색상 값을 CSS 변수로 교체. 대상: `.panel`의 border/background, `.primaryButton`의 background, `.ghostButton`의 background/color, `.dangerButton`의 color/background, `.tag`의 color/background, `.tagActive`의 color/background, `.textInput/.textArea/.searchInput`의 border/background, `.errorText/.errorBanner`의 color, `.successText`의 color, `.markdownBody`의 color/code background, `.eyebrow`의 color, `.heroText`의 color

- [X] T003 `frontend/src/styles/app.css`에서 하드코딩된 간격/반지름 값을 CSS 변수로 교체. 대상: `.panel`의 border-radius/padding, `.primaryButton/.ghostButton/.dangerButton/.tag`의 border-radius/padding, `.textInput/.textArea/.searchInput`의 border-radius/padding, `.authPanel`의 gap, `.composerPanel/.noteCard/.editorStack/.noteList`의 gap

- [X] T004 `frontend/src/styles/app.css` 파일 전체에 섹션 주석 추가. 섹션 순서: `/* ── 디자인 토큰 ─── */`, `/* ── 리셋 및 기본 ─── */`, `/* ── 레이아웃 ─── */`, `/* ── 컴포넌트 ─── */`, `/* ── 상태 ─── */`, `/* ── 인증 화면 ─── */`, `/* ── 프로필 화면 ─── */`, `/* ── 반응형 ─── */`

**Checkpoint**: CSS 변수 정의 완료 — 기존 렌더링 결과와 동일한지 브라우저에서 육안 확인 후 다음 Phase 진행

---

## Phase 2: 상태 UI — 로딩/빈/오류 표시

**Purpose**: 모든 화면에서 공유하는 loading/empty/error 상태 시각 표현 통일. NoteList가 주요 대상.

**Story Goal**: 로딩·빈·오류 상태가 각각 시각적으로 구별되고 CSS 스피너를 포함한다 (FR-004, SC-002)

**Independent Test**: 노트 목록 갱신 시 스피너 + 한국어 텍스트 표시 확인, 빈 상태/필터 결과 없음 각각 확인 (quickstart.md S3)

- [X] T005 `frontend/src/styles/app.css`의 `/* ── 상태 ─── */` 섹션에 CSS 스피너 추가. `@keyframes spin { to { transform: rotate(360deg); } }` 정의 후 `.spinner { display: inline-block; width: 18px; height: 18px; border: 2px solid var(--color-border); border-top-color: var(--color-brand); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }` 추가

- [X] T006 `frontend/src/styles/app.css`에 `.loadingState { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-lg); color: var(--color-text-muted); }` 추가. `.emptyState`에 `padding: var(--space-xl) var(--space-lg);` 추가

- [X] T007 `frontend/src/components/NoteList.jsx`의 로딩 분기를 수정. `<section className="panel emptyState">Loading notes...</section>` → `<section className="panel loadingState"><span className="spinner" aria-hidden="true" />노트 불러오는 중…</section>`

- [X] T008 `frontend/src/components/NoteList.jsx`의 빈 상태 텍스트 한국어화. `"No notes yet"` → `"아직 노트가 없습니다"`, `"Create your first study note to get started."` → `"첫 번째 노트를 작성해보세요."`, `"No matching notes"` → `"일치하는 노트가 없습니다"`, `"Try clearing the current search or tag filter."` → `"검색어나 태그 필터를 초기화해보세요."`, `"Clear filters"` → `"필터 초기화"`

---

## Phase 3: US1 — 인증 화면

**Story Goal**: 인증 화면이 브랜드 정체성을 갖추고, 폼 요소가 수직 중앙 정렬되며, Google SSO 버튼이 이메일 폼과 시각적으로 균형을 이룬다 (User Story 1)

**Independent Test**: 미인증 상태로 접근 → hero + 탭 + 폼 + SSO 버튼 배치 확인, 320px 너비에서 잘림 없음 (quickstart.md S1)

- [X] T009 [US1] `frontend/src/styles/app.css`의 `.authFormWrapper` 스타일 수정. 현재: `display: flex; justify-content: center; padding-top: 16px;` → 변경: `display: flex; justify-content: center; align-items: center; min-height: 60vh; padding: var(--space-lg) 0;` — 폼이 화면 수직 중앙 근처에 위치하도록

- [X] T010 [US1] `frontend/src/styles/app.css`의 `.authTabButton` 스타일 개선. `font-weight: 500` 유지, 활성 탭(`.authTabButton--active`) 구분감 강화: `background: rgba(116, 87, 57, 0.12)` → `background: var(--color-tag-bg); color: var(--color-text);` 로 변경

- [X] T011 [US1] `frontend/src/components/AuthForm.jsx`에서 hero 영역과 authPanel 사이 간격 점검. `<main className="appShell">` 내부 `<section className="hero">` 다음 `<div className="authFormWrapper">` 구조 유지, authPanel gap 확인 — 변경 불필요 시 T011 스킵

---

## Phase 4: US2 — 노트 목록 및 헤더

**Story Goal**: 인증 후 메인 화면 헤더에 사용자 이름이 표시되고, 프로필/로그아웃 버튼이 명확히 구별된다 (User Story 2)

**Independent Test**: 로그인 후 메인 화면 → 사용자 이름 포함 인사말 표시, 프로필/로그아웃 버튼 계층 확인 (quickstart.md S2)

- [X] T012 [US2] `frontend/src/App.jsx`의 인증 후 메인 화면(`return` 블록) hero 텍스트 변경. `<h1>Capture fast. Find faster.</h1>` → `<h1>안녕하세요, {currentUser?.displayName || currentUser?.name}님</h1>`. `<p className="heroText">Keep development notes lightweight, searchable, and easy to edit in place.</p>` → `<p className="heroText">노트를 작성하고 검색하세요.</p>`. **주의**: AuthForm 내부 hero는 변경하지 않는다

- [X] T013 [US2] `frontend/src/App.jsx`의 `heroActionRow` 내 프로필/로그아웃 버튼 스타일 점검. 현재 두 버튼 모두 `ghostButton` — 로그아웃 버튼에 `dangerButton` 클래스 적용으로 시각 구분 강화. `<button className="ghostButton" type="button" onClick={logout}>로그아웃</button>` → `<button className="dangerButton" type="button" onClick={logout}>로그아웃</button>`

- [X] T014 [US2] `frontend/src/styles/app.css`의 `.hero` 섹션에 `align-items: start;` 확인. 현재 `display: grid; gap: 20px; margin-bottom: 24px;` 유지. `h1` 밑 heroText 간격 일관성 확인 — `margin: 12px 0 0` 유지

---

## Phase 5: US3 — 노트 카드 및 작성/수정

**Story Goal**: 모든 노트 카드가 동일한 여백·폰트·버튼 스타일을 가지며, 편집 모드 전환이 부드럽고, 노트 작성 영역의 입력 흐름이 명확하다 (User Story 3)

**Independent Test**: 여러 노트 목록에서 카드 일관성 확인, 편집 모드 전환 후 저장/취소 버튼 확인, 긴 제목(60자+) 카드 레이아웃 확인 (quickstart.md S4, S5)

- [X] T015 [P] [US3] `frontend/src/components/NoteCard.jsx`의 버튼 텍스트 한국어화. `"Save"` → `"저장"`, `"Cancel"` → `"취소"`, `"Edit"` → `"편집"`, `"Delete"` → `"삭제"`. 오류 메시지: `"Title is required."` → `"제목은 필수입니다."`

- [X] T016 [P] [US3] `frontend/src/styles/app.css`에 긴 제목 처리 추가. `.noteCard h3` 규칙에 `overflow-wrap: break-word; word-break: break-word;` 추가. 태그 10개+ 처리: `.tagList`의 `flex-wrap: wrap` 이미 있으므로 확인 후 `max-height` 없이 유지 (현재 설계대로)

- [X] T017 [P] [US3] `frontend/src/components/NoteComposer.jsx`의 텍스트 한국어화. `"Quick Note"` → `"새 노트"`, `"Write fast. Save with Ctrl/Cmd + Enter."` → `"Ctrl/Cmd + Enter로 빠르게 저장"`, placeholder `"Title"` → `"제목"`, placeholder `"Markdown content"` → `"내용 (마크다운 지원)"`, placeholder `"Tags separated by commas"` → `"태그 (쉼표로 구분)"`, `"Save Note"` → `"저장"`, `"Title is required."` → `"제목은 필수입니다."`

- [X] T018 [US3] `frontend/src/styles/app.css`에서 `.notePreview`의 스타일 점검. 현재 `font-size: 0.95rem; color: var(--color-text-muted)` — 변경 불필요 시 스킵. `.markdownBody` 이미지 overflow 처리: `.markdownBody img { max-width: 100%; height: auto; }` 추가

---

## Phase 6: US4 — 프로필/계정 화면

**Story Goal**: 프로필 화면의 각 섹션이 패널로 명확히 구분되고, Google 연결 성공/실패 메시지가 색상으로 상태를 구별한다 (User Story 4)

**Independent Test**: 프로필 화면 진입 → 섹션 구분 확인, Google 연결 성공 메시지 초록색 표시 확인 (quickstart.md S6)

- [X] T019 [US4] `frontend/src/components/ProfileView.jsx` 파일을 읽고 현재 구조 파악. 확인 항목: (1) 각 섹션(계정 요약, 프로필 수정, 비밀번호 변경, Google 연결)이 `.panel` 클래스로 감싸져 있는지 — 없으면 최외곽 컨테이너에 `className="panel ..."` 추가. (2) `linkSuccess` prop이 `true`일 때 메시지가 자동으로 사라지는 로직(예: `useEffect` + `setTimeout`)이 있는지 — 없으면 ProfileView.jsx에 `useEffect(() => { if (linkSuccess) { const t = setTimeout(() => onLinkSuccessClear?.(), 4000); return () => clearTimeout(t); } }, [linkSuccess]);` 패턴 또는 동등한 방식으로 구현 (단, 부모 컴포넌트 App.jsx에 `setLinkSuccess(false)` 콜백이 없으면 로컬 state로 처리)

- [X] T020 [US4] `frontend/src/components/ProfileView.jsx`에서 Google 연결 성공 메시지 스타일 확인. `linkSuccess` prop이 `true`일 때 표시되는 메시지에 `.successText` 클래스 적용 확인. 없으면 `<p className="successText">Google 계정이 연결되었습니다.</p>` 형태로 추가

- [X] T021 [US4] `frontend/src/components/ProfileView.jsx`에서 오류 메시지 스타일 확인. `errorMessage` / `ssoError` 관련 표시에 `.errorText` 클래스 적용 확인. 섹션 제목 `h2` margin 일관성 확인

---

## Phase 7: US5 — 반응형 점검

**Story Goal**: 320px~1400px 너비 범위 전체에서 레이아웃 깨짐 없이 콘텐츠가 표시된다 (User Story 5)

**Independent Test**: 개발자 도구에서 320px, 600px, 880px, 1400px 너비별 각 화면 확인 (quickstart.md S7)

- [X] T022 [P] [US5] `frontend/src/styles/app.css`의 `@media (max-width: 880px)` 블록 점검. `.contentGrid`, `.profileGrid` 1열 전환 확인. `.composerPanel` position 해제 확인. CSS 스피너 + loadingState flex 레이아웃이 좁은 화면에서 줄바꿈 없이 표시되는지 확인 — 필요 시 `flex-wrap: wrap` 추가

- [X] T023 [P] [US5] 320px 너비에서 authFormWrapper/authPanel 잘림 확인. `authPanel`의 `width: min(440px, 100%)` 이미 적용 중이므로 추가 수정 불필요한지 확인. 필요 시 `authFormWrapper`에 `padding: 0 var(--space-sm)` 추가

- [X] T024 [US5] `frontend/src/styles/app.css`에서 `.hero h1`의 `clamp(2rem, 6vw, 3.8rem)` 320px 최솟값 확인. `2rem = 32px`로 320px 화면에서 허용 가능 — 유지. `heroText`, `eyebrow` 좁은 화면 줄바꿈 자연스러운지 확인

---

## Phase 8: 레거시 Migration 정리 확인

**Purpose**: FR-012 이행 상태 검증 — 제거할 레거시 migration UI가 없음을 최종 확인

- [X] T025 프론트엔드 코드 전체에서 migration 관련 문구 검색. `grep -rn "migration\|migrate\|data\.json\|file.based\|fallback" frontend/src/` 실행. 결과에 사용자 노출 UI 문구가 없으면 완료. 발견 시 해당 파일에서 문구/상태 제거

---

## Phase 9: Polish & 디자인 가이드 문서화

**Purpose**: 전체 적용 후 일관성 최종 점검, 디자인 원칙 문서 작성

- [X] T026 `frontend/src/styles/app.css` 최종 점검. CSS 변수 미적용 하드코딩 색상/간격 값 잔존 여부 확인: `grep -n "#[0-9a-fA-F]\{3,6\}\|rgba\|px" frontend/src/styles/app.css | grep -v "var(--\|/\*\|radial-gradient\|linear-gradient\|clamp\|backdrop-filter\|opacity\|transform\|animation\|0px\|50%\|100%\|calc"`. 발견된 하드코딩 값 중 토큰으로 교체 가능한 항목 교체

- [X] T027 `frontend` 디렉터리에서 기존 테스트 전체 실행. `cd frontend && npm test` 결과 8/8 통과 확인 (SC-005). 실패 시 원인 파악 및 수정

- [X] T028 프론트엔드 빌드 검증. `cd frontend && VITE_API_BASE_URL=/ npm run build` 실행. `dist/` 생성 및 빌드 오류 없음 확인

- [X] T029 `specs/015-ui-polish/` 아래 `design-guide.md` 파일 생성. 내용: 색상 토큰 표(변수명/값/용도), 간격 토큰 표, 반지름 토큰 표, 버튼 스타일 규칙, 상태 UI 패턴(loading/empty/error 각 클래스명), 반응형 브레이크포인트 규칙(880px 기준), 폰트 적용 원칙

---

## 의존성 그래프

```
Phase 1 (T001-T004: CSS 토큰)
  └─ Phase 2 (T005-T008: 상태 UI)
       ├─ Phase 3 (T009-T011: 인증) [P: T009~T011]
       ├─ Phase 4 (T012-T014: 메인 헤더) [P: T012~T014]
       ├─ Phase 5 (T015-T018: 노트 카드/작성) [P: T015, T016, T017]
       ├─ Phase 6 (T019-T021: 프로필) [순서 필요: T019 → T020, T021]
       └─ Phase 7 (T022-T024: 반응형) [P: T022, T023]
            └─ Phase 8 (T025: 레거시 확인)
                 └─ Phase 9 (T026-T029: 최종 점검 + 문서화)
```

Phase 2 완료 후 Phase 3~7은 **병렬 진행 가능** (각각 다른 파일 대상).

## 병렬 실행 예시

```bash
# Phase 3~7 병렬 진행 가능 작업 묶음:
T009, T010, T011  # AuthForm 스타일
T012, T013, T014  # App.jsx hero
T015, T016, T017  # NoteCard + NoteComposer
T022, T023, T024  # 반응형
```

## 구현 전략

- **MVP 범위**: Phase 1 + 2 완료 → 핵심 개선(CSS 토큰 + 스피너 + 상태 한국어화) 즉시 체감
- **전체 완료**: Phase 1~9 순차 진행, Phase 3~7 병렬 가능
- **기능 회귀 없음**: 모든 변경은 JSX 텍스트 또는 CSS 스타일만 수정, 로직 불변
- **테스트**: T027에서 기존 8개 테스트 통과 확인 (별도 신규 테스트 작성 불필요)
