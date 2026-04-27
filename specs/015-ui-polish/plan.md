# Implementation Plan: UI Polish

**Branch**: `015-ui-polish` | **Date**: 2026-04-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-ui-polish/spec.md`

## Summary

현재 동작하는 React SPA의 시각적 완성도를 높인다. `frontend/src/styles/app.css`에 CSS 변수 기반 디자인 토큰을 추가하고, 각 컴포넌트의 텍스트·상태 표시·타이포그래피·간격을 일관성 있게 개선한다. 로딩 상태에 CSS 스피너를 추가하고, 영어로 남아 있는 사용자 노출 문구를 한국어로 통일하며, 인증 후 메인 화면 hero를 사용자 이름 기반 인사말로 교체한다.

구현 과정에서 범위가 확장되어 TipTap 기반 WYSIWYG 리치 텍스트 편집기와 전체화면 뷰어가 추가되었다. 기존 마크다운 textarea를 유지하면서 텍스트 편집기 모드를 병렬로 제공하며, 두 모드 모두 편집/미리보기 서브탭을 지원한다.

## Technical Context

**Language/Version**: React 19 + Vite (frontend only)
**Primary Dependencies**: TipTap (WYSIWYG 에디터) 추가 — `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*` 7개 패키지
**Storage**: 인증 토큰 `localStorage` → `sessionStorage` 전환
**Testing**: Node.js built-in test runner (`node --test`, `npm test` in `/frontend`)
**Target Platform**: 브라우저 (WSL Ubuntu + 로컬 브라우저 개발 환경)
**Project Type**: Web application (frontend UI only)
**Performance Goals**: 번들 크기 ~650KB (TipTap 포함, gzip 205KB)
**Constraints**: 백엔드 API 변경 없음

## Constitution Check

*GATE: 모든 항목 통과. Phase 0 이후 재확인 불필요 (순수 프론트엔드 스타일 변경).*

- **프론트/백엔드 경계**: 모든 변경은 `frontend/src/` 내부. 백엔드 API 호출 구조 변경 없음. ✅
- **JSON envelope 형식**: API 엔드포인트 신규/변경 없음. ✅
- **스토리지 소유권**: 인증 토큰 `localStorage` → `sessionStorage` 교체 (보안). 레이아웃 프리퍼런스(`localStorage`)는 유지. ✅
- **명명 규칙**: PascalCase 컴포넌트, camelCase 함수/변수. 한국어 텍스트는 JSX 문자열에만. ✅
- **신규 의존성**: TipTap 에디터 패키지 추가 (기능 확장으로 인한 범위 변경). ✅
- **UX 원칙**: 인라인 편집 유지, 모달 없음, 빠른 렌더링 우선. ✅
- **작은 단위 변경**: 컴포넌트별 분리, WSL 친화적 명령어 사용. ✅

## 디자인 방향성

- **톤**: 현대적이고 깔끔한 Notion/Linear 스타일. 흰 표면 + 중성 텍스트 + 바이올렛 액센트
- **색상 팔레트**: **zinc/slate 기반 + violet 액센트** (기존 베이지·브라운 완전 교체)
  - 배경: `#f8fafc` (slate-50)
  - 표면: `#ffffff` (흰 카드)
  - 텍스트: `#0f172a` (slate-900), `#64748b` (slate-500 muted)
  - 브랜드: `#7c3aed` (violet-700)
  - 테두리: `#e2e8f0` (slate-200)
- **폰트**: IBM Plex Sans, Noto Sans KR — 유지
- **애니메이션**: 최소화. hover/focus 기본 피드백만. 로딩 스피너 하나만 추가
- **다크모드**: 이번 범위 밖
- **보안**: `localStorage` → `sessionStorage` 전환 + JWT 만료 클라이언트 검증

## 화면별 우선순위

| 우선순위 | 화면 | 핵심 개선 |
|---------|------|---------|
| P1 | 인증 화면 (AuthForm) | 수직 중앙 정렬, 브랜드 영역 명확화 |
| P1 | 메인 화면 헤더 (App.jsx hero) | 사용자 이름 노출, 버튼 계층 정리 |
| P1 | 노트 목록 상태 (NoteList) | CSS 스피너, 한국어 빈/로딩/오류 상태 |
| P2 | 노트 카드 (NoteCard) | 버튼 한국어화, 긴 제목 처리 |
| P2 | 노트 작성 (NoteComposer) | 텍스트 한국어화, 섹션 제목 개선 |
| P2 | 프로필 화면 (ProfileView) | 섹션 패널 구분, 성공/실패 메시지 |
| P3 | CSS 디자인 토큰 | `:root` CSS 변수, 전체 적용 |
| P3 | 반응형 점검 | 320px~1400px 깨짐 없음 확인 |

## 컴포넌트 단위 개선 계획

### CSS 디자인 토큰 (app.css)

`app.css` 파일 최상단 `:root` 블록에 CSS 변수 섹션 추가. 기존 hardcoded 색상·간격·반지름 값을 변수로 추출하여 교체. 기존 `font-family`, `background`, `line-height` 규칙은 유지.

```css
/* ── 디자인 토큰 ─────────────────────────── */
:root {
  /* 색상 — 브랜드 (violet) */
  --color-brand:        #7c3aed;
  --color-brand-dark:   #6d28d9;
  --color-brand-light:  #ede9fe;
  --color-brand-accent: #8b5cf6;

  /* 색상 — UI */
  --color-ui-fg:        #475569;
  --color-ui-fg-inv:    #ffffff;
  --color-ui-body:      #1e293b;

  /* 색상 — 텍스트 */
  --color-text:         #0f172a;
  --color-text-muted:   #64748b;
  --color-text-subtle:  #94a3b8;
  --color-text-error:   #dc2626;
  --color-text-success: #16a34a;

  /* 색상 — 배경·표면 */
  --color-bg:           #f8fafc;
  --color-surface:      #ffffff;
  --color-surface-2:    #f1f5f9;
  --color-border:       #e2e8f0;
  --color-border-focus: #7c3aed;
  --color-tag-bg:       #ede9fe;

  /* 간격 */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  14px;
  --space-lg:  20px;
  --space-xl:  32px;

  /* 반지름 */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-pill: 999px;
}
```

기존 베이지/브라운 팔레트에서 **zinc/slate + violet** 팔레트로 완전 교체.

### 로딩 상태 (app.css + NoteList.jsx)

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.loadingState {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 24px;
  color: var(--color-text-muted);
}
```

`NoteList.jsx` 로딩 분기:
```jsx
// 기존
<section className="panel emptyState">Loading notes...</section>

// 변경 후
<section className="panel loadingState">
  <span className="spinner" aria-hidden="true" />
  노트 불러오는 중…
</section>
```

### 인증 화면 (AuthForm.jsx + app.css)

- `authFormWrapper`: `min-height: 60vh; align-items: center;` → 폼이 화면 중앙에 위치
- AuthForm의 hero `h1` "Capture fast. Find faster." — **유지** (브랜드 첫인상, 인증 전 화면)
- hero 영역과 authPanel 사이 간격 일관성 확인

### 메인 화면 헤더 (App.jsx)

인증 후 메인 화면의 hero 텍스트를 사용자 이름 기반으로 변경:

```jsx
// 기존 App.jsx hero
<h1>Capture fast. Find faster.</h1>
<p className="heroText">Keep development notes lightweight...</p>

// 변경 후
<h1>안녕하세요, {currentUser?.displayName || currentUser?.name}님</h1>
<p className="heroText">노트를 작성하고 검색하세요.</p>
```

- 프로필/로그아웃 버튼 구분: 프로필은 `ghostButton`, 로그아웃은 별도 버튼 — 현 구조 유지
- `heroActionRow` 우측 정렬 유지

### 노트 목록 빈/오류 상태 (NoteList.jsx)

```jsx
// 변경 내용
"No notes yet" → "아직 노트가 없습니다"
"Create your first study note to get started." → "첫 번째 노트를 작성해보세요."
"No matching notes" → "일치하는 노트가 없습니다"
"Try clearing the current search or tag filter." → "검색어나 태그 필터를 초기화해보세요."
"Clear filters" → "필터 초기화"
```

### 노트 카드 (NoteCard.jsx)

```jsx
// 버튼 텍스트 한국어화
"Save" → "저장"
"Cancel" → "취소"
"Edit" → "편집"
"Delete" → "삭제"

// 오류 메시지
"Title is required." → "제목은 필수입니다."
```

- `h3` 제목 긴 텍스트 처리: CSS에 `overflow-wrap: break-word` 추가
- `notePreview`: 스타일 유지, 2-3줄 클리핑은 현재 `previewText` 유틸로 처리 중 — 유지

### 노트 작성 (NoteComposer.jsx)

```jsx
// 텍스트 변경
"Quick Note" → "새 노트"
"Write fast. Save with Ctrl/Cmd + Enter." → "Ctrl/Cmd + Enter로 빠르게 저장"
placeholder "Title" → "제목"
placeholder "Markdown content" → "내용 (마크다운 지원)"
placeholder "Tags separated by commas" → "태그 (쉼표로 구분)"
"Save Note" → "저장"
"Title is required." → "제목은 필수입니다."
```

### 프로필 화면 (ProfileView.jsx)

- 섹션 패널 구분: `.panel` 클래스로 각 섹션을 카드로 감싸는 구조 → ProfileView 현황 확인 후 적용
- `linkSuccess` 성공 메시지: `.successText` 클래스 적용 (초록색) — 이미 있는 클래스 활용
- SSO 오류 메시지: `.errorText` 클래스 적용 (빨간색) — 이미 있는 클래스 활용
- 섹션 제목 Typography: `h2` 스타일 일관성 확인

### emptyState 텍스트 정렬 개선

```css
.emptyState {
  text-align: center;
  padding: 32px 24px;  /* 기존 padding 없음 → 추가 */
}
```

## Typography / Spacing / Color / State 개선 방향

### Typography

| 요소 | 현재 | 변경 |
|------|------|------|
| `.hero h1` | `clamp(2rem, 6vw, 3.8rem)` | 유지 |
| `.eyebrow` | `0.82rem` | 유지 |
| `.notePreview` | `0.95rem` | 유지 |
| `.authLabel` | `0.9rem` | 유지 |
| `h3` (NoteCard) | 기본 | `overflow-wrap: break-word` 추가 |

### Spacing

- `emptyState`: padding 없음 → `padding: 32px 24px` 추가
- `loadingState`: `padding: 24px` + `gap: var(--space-sm)` 신규
- `errorBanner`: 기존 `margin: 0 0 18px` 유지, 색상 유지

### Color (토큰 적용)

기존 하드코딩된 색상 값을 CSS 변수로 교체. 값 자체는 동일하게 유지:

| 기존 값 | 변수 |
|---------|------|
| `#9c4f19` | `var(--color-brand)` |
| `#7f4b13` | `var(--color-brand-dark)` |
| `#1d1b16` | `var(--color-text)` |
| `#6a5c4a` | `var(--color-text-muted)` |
| `rgba(74, 49, 22, 0.12)` | `var(--color-border)` |

### State UI 요약

| 상태 | 현재 | 변경 |
|------|------|------|
| 로딩 | "Loading notes..." (텍스트만) | CSS 스피너 + "노트 불러오는 중…" |
| 빈 상태 | "No notes yet" (영어) | "아직 노트가 없습니다" |
| 필터 없음 | "No matching notes" (영어) | "일치하는 노트가 없습니다" |
| 오류 | errorBanner 텍스트 | 현 구조 유지, 텍스트 개선 |
| 성공 | linkSuccess → successText | 현 클래스 활용 확인 |

## 반응형 개선 범위

- **기존 880px 브레이크포인트**: 유지. `contentGrid`, `profileGrid` 1열 전환 이미 작동 중
- **320px 최소 너비**: `appShell` `calc(100% - 32px)` 패딩으로 이미 처리
- **추가 확인 항목**:
  - 320px에서 `authPanel` padding/margin 확인 (`width: min(440px, 100%)` 이미 적용)
  - emptyState 텍스트 줄바꿈 (패딩 추가 후 확인)
  - CSS 스피너 + 텍스트 flex 레이아웃 좁은 화면 확인
- **신규 브레이크포인트 불필요**: 현재 구조가 320px~1400px에서 적절히 동작

## 레거시 Migration UI 정리 계획

**결과**: 제거할 항목 없음.

- `backend/src/db/migrate.js` — 014에서 이미 삭제됨
- 프론트엔드 코드 전체에 migration 상태 메시지, file-based fallback 문구, "마이그레이션 중" 알림 없음
- FR-012 완료 상태 — 추가 작업 불필요

## 기존 구조를 해치지 않는 구현 전략

1. **CSS 변수 추가 → 기존 값 교체**: `:root`에 변수 추가 후, 기존 하드코딩 값을 `var()` 참조로 교체. 렌더링 픽셀 결과 동일. 한 번에 app.css 전체 처리.
2. **JSX 텍스트만 변경**: 컴포넌트 함수 로직, props 구조, 이벤트 핸들러 변경 없음. 문자열 리터럴만 한국어로 교체.
3. **CSS 클래스 추가**: `.spinner`, `.loadingState` 신규 추가. 기존 `.emptyState` 수정은 padding만.
4. **NoteList 분기 단순 교체**: `isLoading` 분기의 JSX만 수정. 로직 불변.
5. **App.jsx hero 텍스트**: 인증 후 화면(`return` 블록)의 `h1`, `p.heroText`만 변경. AuthForm의 hero 불변.
6. **테스트 영향 없음**: 기존 8개 테스트는 컴포넌트 로직/API/렌더링 결과를 검증. 텍스트 변경은 snapshot 기반 테스트가 없으므로 통과 유지 예상.

## 최종 스타일/디자인 원칙 문서화 방향

`app.css` 파일 구조를 섹션 주석으로 명확화:

```css
/* ── 디자인 토큰 ─────────────────────────── */
/* 색상, 간격, 반지름 CSS 변수 */

/* ── 리셋 및 기본 ───────────────────────── */
/* :root 폰트, body, box-sizing */

/* ── 레이아웃 ────────────────────────────── */
/* .appShell, .hero, .contentGrid, .profileGrid */

/* ── 컴포넌트 ────────────────────────────── */
/* .panel, 버튼, 입력 필드, 태그, 카드 */

/* ── 상태 ─────────────────────────────────── */
/* .loadingState, .spinner, .emptyState, .errorBanner */

/* ── 인증 화면 ───────────────────────────── */
/* .authForm*, .ssoButton, .authDivider */

/* ── 프로필 화면 ─────────────────────────── */
/* .profile*, .googleLinkSection */

/* ── 반응형 ──────────────────────────────── */
/* @media (max-width: 880px) */
```

## Project Structure

### Documentation (this feature)

```text
specs/015-ui-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output (완료)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks 명령)
```

### Source Code (변경 대상)

```text
frontend/
├── src/
│   ├── styles/
│   │   └── app.css                    # CSS 변수, 스피너, 에디터/전체화면 스타일
│   ├── App.jsx                        # hero 텍스트 변경 (인증 후)
│   ├── utils/
│   │   ├── contentUtils.js            # [신규] isRichContent, renderContent
│   │   └── previewText.js             # HTML/마크다운 양쪽 strip 지원
│   ├── hooks/
│   │   ├── useAuth.js                 # sessionStorage 전환, JWT 만료 검증
│   │   └── useAuthenticatedImages.js  # 셀렉터 버그 수정 (^= → *=)
│   ├── services/
│   │   ├── authApi.js                 # sessionStorage 전환
│   │   ├── notesApi.js                # sessionStorage 전환
│   │   └── imagesApi.js               # sessionStorage 전환
│   └── components/
│       ├── RichEditor.jsx             # [신규] TipTap + 마크다운 이중 모드 에디터
│       ├── NoteFullscreen.jsx         # [신규] 전체화면 오버레이 뷰어
│       ├── NoteList.jsx               # 로딩/빈/오류 상태 한국어화 + 스피너
│       ├── NoteCard.jsx               # RichEditor 통합, 전체화면 버튼
│       ├── NoteComposer.jsx           # RichEditor 통합, 텍스트 한국어화
│       ├── AuthForm.jsx               # hero 텍스트 한국어화
│       └── ProfileView.jsx            # 섹션 구분, 메시지 스타일 확인
```

**변경 없음**: 모든 백엔드 파일, API 엔드포인트

## Complexity Tracking

> 헌법 위반 없음 — 이 섹션은 해당 없음
