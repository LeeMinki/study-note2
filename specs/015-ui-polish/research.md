# Research: UI Polish

**Feature**: 015-ui-polish
**Date**: 2026-04-21

## 1. CSS 변수 네이밍 컨벤션

**Decision**: `--color-*`, `--space-*`, `--radius-*` 접두사 체계. BEM-like 계층 없이 flat하게 유지.

**Rationale**: 현재 프로젝트 규모(1개 CSS 파일, 10개 미만 컴포넌트)에서 과도한 토큰 체계는 불필요. `--color-brand`, `--color-surface`, `--space-md` 수준의 단순 이름이 유지보수에 적합.

**Alternatives considered**:
- Tailwind/utility class: CA-003 위반 (신규 npm 패키지 금지)
- CSS-in-JS: CA-003 위반 (CSS 변수 방식으로 확정)
- `--ds-color-*` (design system prefix): 현재 규모 대비 과함

**팔레트 변경 결정 (2026-04-23)**:
초기 설계의 베이지·브라운 팔레트가 현대적인 노트앱과 거리가 있어 Notion/Linear 스타일의 zinc/slate + violet 팔레트로 완전 교체.

**토큰 목록 (app.css `:root` 섹션)**:
```css
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
```

---

## 2. CSS 스피너 패턴

**Decision**: `border` + `border-radius: 50%` + `@keyframes spin` 방식. HTML에 `.spinner` 요소 직접 삽입.

**Rationale**: 추가 라이브러리 없음. SVG 스피너보다 CSS만으로 구현이 간단하며 컬러 일관성 유지 쉬움.

**Pattern**:
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
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
  color: var(--color-text-muted);
}
```

**NoteList 적용**:
```jsx
// isLoading 분기
<section className="panel loadingState">
  <span className="spinner" aria-hidden="true" />
  노트 불러오는 중…
</section>
```

---

## 3. 컴포넌트별 현황 분석

### AuthForm.jsx
- Hero 영역: `eyebrow` "Study Note", `h1` "Capture fast. Find faster.", heroText 영어 설명 — 그대로 유지 (브랜드 문구)
- 탭, 폼 필드: 이미 한국어 레이블 사용 중
- Google SSO 버튼: `ssoButton` 클래스, 적절한 스타일 존재
- **개선 필요**: authFormWrapper에 padding-top만 있어 전체 화면 수직 중앙 정렬 미흡 → `min-height: 100vh`로 보완
- authPanel width `min(440px, 100%)` 유지

### App.jsx (인증 후 메인 화면)
- Hero: 동일한 "Capture fast. Find faster." — 인증 후에도 로그인 화면과 동일한 문구
- 사용자명: `${displayName} 프로필` 버튼으로만 노출, hero에 표시 없음
- **개선 필요**: hero의 h1을 사용자 이름 포함 인사말로 변경, 또는 heroText에 추가
- 로그아웃 버튼: ghostButton, 위치 `heroActionRow` 우측 정렬 → 현 상태 유지
- errorBanner: `<p className="errorBanner">` — 스타일은 있으나 margin/padding 부재 → 약간 개선

### NoteList.jsx
- 로딩: "Loading notes..." 텍스트만 → CSS 스피너 추가 및 한국어로
- 빈 상태: "No notes yet", "No matching notes" 영어 → 한국어로 변경
- "Clear filters" 버튼: "필터 초기화"로 변경

### NoteCard.jsx
- 버튼: "Save/Cancel/Edit/Delete" 영어 → 한국어("저장/취소/편집/삭제")로 변경
- "Title is required." 오류: "제목은 필수입니다."로 변경
- notePreview: 텍스트 크기 `0.95rem` — 유지
- 태그가 10개+ 인 경우 `tagList flex-wrap` 이미 적용되어 레이아웃 깨짐 없음
- 긴 제목: `h3`에 `overflow-wrap: break-word` 추가 필요

### NoteComposer.jsx
- "Quick Note" h2, "Write fast. Save with Ctrl/Cmd + Enter." — 한국어로 변경
- "Title", "Markdown content", "Tags separated by commas" placeholder → 한국어
- "Save Note" 버튼 → "저장"
- 드래프트 배너: 이미 한국어 ("이전에 작성 중이던 내용이 있습니다.")

### ProfileView.jsx
- 아직 읽지 않았으나 기존 코드에 `profileGrid 3열`, `googleLinkSection` 등 클래스 존재
- `linkSuccess` prop: profile 화면에서 초록 성공 메시지 표시 → 이미 구현됨 확인 필요

---

## 4. 레거시 Migration 관련 UI 현황

**결과**: 현재 코드에 레거시 migration 관련 UI 없음. `014-security-hardening`에서 `backend/src/db/migrate.js` 이미 삭제됨. 프론트엔드에 migration 상태 메시지, file-based fallback 문구 없음.

**FR-012 이행 상태**: 완료 (제거할 레거시 UI 없음)

---

## 5. 반응형 현황

- `@media (max-width: 880px)`: `contentGrid`, `profileGrid` → `grid-template-columns: 1fr`
- `composerPanel`: `position: sticky` → `position: static` (모바일에서)
- `min-width: 320px` 기준: `appShell` `width: min(1200px, calc(100% - 32px))`로 패딩 유지됨
- **개선 필요**: 320px 너비에서 authPanel, hero h1 폰트 크기 점검 (이미 `clamp` 사용 중이라 OK)
- `profileHero` 좁은 화면 grid 전환: 이미 있음

---

## 6. 인증 토큰 보안 (sessionStorage 전환)

**결정**: `localStorage` → `sessionStorage` 전환 + JWT 만료 클라이언트 검증 추가

**문제**: `localStorage`는 브라우저를 닫고 재시작해도 데이터가 유지되어 다른 사람이 접근할 수 있는 환경(공용 PC 등)에서 세션이 지속된다.

**해결**: `sessionStorage`는 탭/브라우저 종료 시 자동 삭제. 마운트 시 JWT `exp` 필드를 클라이언트에서 검증해 만료된 토큰을 즉시 제거.

**영향 파일**:
- `frontend/src/hooks/useAuth.js` — `loadStoredToken()`, `saveSession()`, `clearSession()`
- `frontend/src/services/authApi.js` — `requestAuth()` 내 token 조회
- `frontend/src/services/notesApi.js` — axios 인터셉터 내 token 조회
- `frontend/src/services/imagesApi.js` — `uploadImage()` 내 token 조회
- `frontend/src/hooks/useAuthenticatedImages.js` — 이미지 fetch token 조회

**비영향**: `useLayoutPreference.js` (`localStorage` 유지 — 비민감 데이터)

---

## 7. TipTap 리치 텍스트 에디터 (범위 확장)

**결정**: TipTap v3 (ProseMirror 기반) WYSIWYG 에디터 도입. 마크다운 textarea는 유지하고 "텍스트 편집기" / "마크다운" 두 모드 전환 방식으로 구현.

**문제**: 구현 과정에서 stale closure 버그 발생 — `useEditor`의 `onUpdate` 콜백이 마운트 시점의 `mode`를 캡처해, 마크다운 모드 전환 후에도 HTML을 부모 state에 덮어쓰는 현상.

**해결**: `modeRef = useRef(mode)` 추가, `onUpdate`에서 `modeRef.current === "rich"`일 때만 `onChange` 호출. sync `useEffect`도 `mode !== "rich"`이면 조기 리턴.

**TipTap 패키지 목록**:
- `@tiptap/react`, `@tiptap/starter-kit`
- `@tiptap/extension-image`, `@tiptap/extension-underline`
- `@tiptap/extension-text-align`, `@tiptap/extension-font-family`
- `@tiptap/extension-text-style` (FontSize 포함)

**콘텐츠 이중 포맷**: 기존 노트는 마크다운, 신규 노트는 TipTap HTML. `isRichContent()` (HTML 태그 정규식 감지)로 포맷 판별 후 `renderContent()`로 적절히 렌더링.

---

## 8. 이미지 인증 셀렉터 버그

**문제**: `useAuthenticatedImages`의 CSS 셀렉터가 `img[src^="/uploads/"]` (starts-with)이었으나, 개발 환경에서 `buildApiUrl`이 `http://localhost:3001/uploads/xxx.jpg` 절대 URL을 반환하므로 매칭 실패 → 이미지 미표시.

**원인**: CSS 속성 셀렉터는 HTML 속성값 그대로 매칭. 개발 시 `VITE_API_BASE_URL` 미설정으로 절대 URL 사용, 프로덕션(`VITE_API_BASE_URL=/`)에서는 상대 경로 사용 — 환경별 불일치.

**해결**: `^=` → `*=` (contains) 변경. 상대/절대 URL 모두 `/uploads/` 경로를 포함하므로 양쪽 환경에서 동작.

---

## 9. 구현 전략

- **CSS 변수**: `:root` 섹션을 app.css 최상단에 추가. 기존 hardcoded 값은 점진적으로 변수로 교체. 한 번에 모두 교체하되 렌더링 결과 동일하게 유지.
- **텍스트 한국어화**: 함수 로직 불변, JSX 텍스트만 변경. props/변수명 영어 유지.
- **CSS 스피너**: app.css에 `.spinner`, `.loadingState` 추가. NoteList.jsx 로딩 분기만 수정.
- **AuthForm 수직 정렬**: `authFormWrapper`에 `min-height: calc(100vh - ...)` 또는 `flex-grow: 1` 방식.
- **App.jsx hero**: h1 텍스트 변경 (인증 후 화면에서만) — AuthForm 내 hero는 유지.
- **emptyState/errorBanner**: padding, typography 개선. 별도 컴포넌트 추출 불필요.
