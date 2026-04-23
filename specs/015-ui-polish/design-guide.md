# Design Guide: Study Note UI

**Feature**: 015-ui-polish | **Updated**: 2026-04-23

CSS 변수 기반 디자인 토큰과 컴포넌트 스타일 규칙 정리. 모든 변수는 `frontend/src/styles/app.css`의 `:root` 블록에 정의됨.

---

## 디자인 방향

Notion/Linear 스타일에서 영감을 받은 깔끔하고 현대적인 노트앱 디자인.
- 흰 표면 + slate 계열 중성 텍스트 + violet 액센트
- 과한 장식 없이 가독성과 계층감 우선
- 기존 베이지·브라운 팔레트에서 완전 교체

---

## 색상 토큰

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `--color-brand` | `#7c3aed` | 주 버튼 배경, 스피너 강조색, 액센트 |
| `--color-brand-dark` | `#6d28d9` | 버튼 hover, 활성 태그 배경 |
| `--color-brand-light` | `#ede9fe` | 태그 배경, 탭 활성 배경 |
| `--color-brand-accent` | `#8b5cf6` | eyebrow 텍스트 |
| `--color-text` | `#0f172a` | 기본 텍스트 |
| `--color-text-muted` | `#64748b` | 보조 텍스트 (날짜, 레이블, 설명) |
| `--color-text-subtle` | `#94a3b8` | placeholder, authDivider |
| `--color-text-error` | `#dc2626` | 오류 메시지 |
| `--color-text-success` | `#16a34a` | 성공 메시지 |
| `--color-bg` | `#f8fafc` | 페이지 배경 |
| `--color-surface` | `#ffffff` | 패널·카드 배경 |
| `--color-surface-2` | `#f1f5f9` | 입력 필드 배경, hover 배경 |
| `--color-border` | `#e2e8f0` | 패널 테두리, 구분선, 스피너 기본색 |
| `--color-border-focus` | `#7c3aed` | 입력 필드 focus 테두리 |
| `--color-tag-bg` | `#ede9fe` | 태그 배경 |
| `--color-ui-fg` | `#475569` | ghost 버튼 텍스트, 레이블 |
| `--color-ui-fg-inv` | `#ffffff` | 활성 버튼 텍스트 (어두운 배경 위) |
| `--color-ui-body` | `#1e293b` | 마크다운 본문, 프로필 값 텍스트 |

---

## 간격 토큰

| 변수명 | 값 | 사용 예 |
|--------|-----|--------|
| `--space-xs` | `4px` | 탭 gap, 버튼 그룹 gap |
| `--space-sm` | `8px` | 일반 flex gap, 검색바 gap |
| `--space-md` | `14px` | 카드 내부 gap, 입력 padding |
| `--space-lg` | `20px` | 섹션 gap, loadingState padding |
| `--space-xl` | `32px` | appShell padding, emptyState padding |

---

## 반지름 토큰

| 변수명 | 값 | 사용 예 |
|--------|-----|--------|
| `--radius-sm` | `6px` | 코드 인라인, 에러 배너 |
| `--radius-md` | `10px` | 입력 필드, 코드블록 pre, draftBanner |
| `--radius-lg` | `16px` | 패널 카드 |
| `--radius-pill` | `999px` | 버튼, 태그, 탭 |

---

## 버튼 스타일 규칙

| 클래스 | 용도 | 색상 |
|--------|------|------|
| `.primaryButton` | 주 행동 (저장, 제출) | violet 배경 + 흰 텍스트 |
| `.ghostButton` | 보조 행동 (취소, 프로필 이동) | slate-100 배경 + 테두리 |
| `.dangerButton` | 파괴적 행동 (삭제, 로그아웃) | 빨간 반투명 배경 + 빨간 텍스트 |
| `.tag` | 태그 선택/필터 | violet 반투명 배경 |
| `.tagActive` | 활성 태그 | violet 배경 + 흰 텍스트 |

모든 버튼: `border-radius: var(--radius-pill)`, `padding: 7px 14px`, `font-size: 0.875rem`

---

## 상태 UI 패턴

| 상태 | 클래스 | 내용 |
|------|--------|------|
| 로딩 | `.panel.loadingState` | `.spinner` + 텍스트 ("노트 불러오는 중…") |
| 빈 상태 | `.panel.emptyState` | h3 + p + 선택적 버튼 |
| 오류 (배너) | `.errorBanner` | 빨간 배경 + 테두리, `--color-text-error` |
| 오류 (인라인) | `.errorText` | 텍스트만, `--color-text-error` |
| 성공 | `.successText` | 텍스트만, `--color-text-success` |

스피너: `@keyframes spin` + `.spinner { 16px, border-top violet, 0.7s linear infinite }`

---

## 반응형 브레이크포인트

| 너비 | 동작 |
|------|------|
| > 880px | 2열 레이아웃 (NoteComposer + NoteList), profileGrid 3열 |
| ≤ 880px | 1열 전환, composerPanel sticky 해제, profileHero grid 전환 |
| 최소 320px | `min-width: 320px` body, `width: min(420px, 100%)` authPanel |

---

## 폰트 원칙

- **폰트 패밀리**: `"IBM Plex Sans", "Noto Sans KR", sans-serif` (변경 금지)
- **기본 line-height**: `1.5`
- **eyebrow**: `0.75rem`, `700`, `0.12em` letter-spacing, uppercase, violet 색상
- **hero h1**: `clamp(1.6rem, 4vw, 2.6rem)`, `700`
- **authLabel**: `0.875rem`, `500`
- **notePreview**: `0.875rem`
- **섹션 h2**: `1rem`, `600`
- 다크모드: 이번 범위 밖

---

## 보안 주의사항

- 인증 토큰은 **`sessionStorage`** 에 저장. 브라우저 탭/창 종료 시 자동 삭제
- 마운트 시 JWT `exp` 클라이언트 검증 포함 (`loadStoredToken()` in `useAuth.js`)
- `layoutPreference` 등 비민감 데이터만 `localStorage` 유지

---

## 에디터 컴포넌트 (RichEditor)

| 클래스 | 역할 |
|--------|------|
| `.richEditor` | 에디터 루트 컨테이너 |
| `.editorModeBar` / `.editorModeBtn` | 텍스트 편집기 ↔ 마크다운 모드 전환 탭 |
| `.editorModeBtn--active` | 활성 모드 탭 (violet 배경) |
| `.editorSubTabs` / `.editorSubTab` | 편집 ↔ 미리보기 서브탭 |
| `.editorSubTab--active` | 활성 서브탭 |
| `.editorToolbar` | 텍스트 편집기 서식 툴바 |
| `.editorToolbarBtn` / `--active` | 툴바 버튼 / 활성 상태 |
| `.editorSelect` | 툴바 드롭다운 (단락 스타일, 글꼴, 크기) |
| `.editorContentWrap` | TipTap 편집 영역 래퍼 (placeholder 지원) |
| `.markdownTextarea` | 마크다운 편집 textarea |
| `.editorMarkdownPreview` | 미리보기 영역 (`.markdownBody` 상속) |

## 전체화면 오버레이 (NoteFullscreen)

| 클래스 | 역할 |
|--------|------|
| `.fullscreenOverlay` | 고정 배경 (z-index 100, backdrop-filter blur) |
| `.fullscreenPanel` | 콘텐츠 패널 (max-width 860px, scroll) |
| `.fullscreenHeader` | 제목 + 닫기 버튼 행 |
| `.fullscreenTitle` | 노트 제목 (1.5rem, 700) |
| `.fullscreenClose` | ✕ 닫기 버튼 |
| `.fullscreenBody` | 본문 (`.markdownBody` 확장, min-height 200px) |

---

## 파일 구조

```text
frontend/src/styles/app.css  ← 단일 CSS 파일 (토큰 + 전체 스타일)
```

섹션 순서: 디자인 토큰 → 리셋/기본 → 레이아웃 → 컴포넌트 → 상태 → 인증 화면 → 프로필 화면 → 반응형
