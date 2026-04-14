# Research: 노트 편집 레이아웃 확장

**Date**: 2026-04-14 | **Feature**: 002-expand-note-layout

## 결정 사항

### 레이아웃 저장 방식
- **Decision**: 브라우저 localStorage
- **Rationale**: 백엔드 변경 없이 단순하게 선호 저장 가능. 기기 간 동기화는 미지원이나 단일 사용자 로컬 앱 특성상 적합. constitution IV(Storage Simplicity) 부합.
- **Alternatives considered**: 백엔드 preferences API — 기기 간 동기화 가능하나 새 엔드포인트/모델/저장소 추가 필요. 현재 스코프 대비 과도.

### 레이아웃 전환 메커니즘
- **Decision**: CSS class 토글 (`.contentGrid--wide`)
- **Rationale**: JavaScript 연산 없이 즉각적 전환. CSS 미디어쿼리와 자연스럽게 통합. 기존 `@media (max-width: 880px)` 패턴과 일관성 유지.
- **Alternatives considered**: CSS-in-JS inline style — 동일하게 동작하나 기존 코드 스타일과 불일치.

### 전환 컨트롤 UI 위치
- **Decision**: NoteComposer 패널 내 `sectionHeading` 우측
- **Rationale**: 편집 맥락 안에 인라인 배치로 constitution V("inline editing preferred") 부합. 전역 헤더보다 기능 연관성이 높음.
- **Alternatives considered**: 전역 hero 섹션 — 위치는 눈에 띄나 편집 컨텍스트와 멀어 직관성 감소.

### 상태 관리
- **Decision**: 커스텀 훅 `useLayoutPreference`
- **Rationale**: App.jsx에서 localStorage 읽기/쓰기 로직 분리. 재사용 가능. 기존 `useKeyboardSave` 훅 패턴과 일관성.
- **Alternatives considered**: App.jsx 직접 구현 — 단순하지만 관심사 분리 미흡.
