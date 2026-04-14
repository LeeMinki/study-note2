# Implementation Plan: 노트 편집 레이아웃 확장

**Branch**: `002-expand-note-layout` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-expand-note-layout/spec.md`

## Summary

노트 작성 시 NoteComposer 열이 280–340px로 좁아 불편한 문제를 해결한다.
사용자가 레이아웃 전환 버튼을 클릭하면 `.contentGrid`가 단일 열로 전환되어
NoteComposer가 전체 너비를 차지하고 NoteList는 아래에 쌓인다.
선택한 레이아웃은 `localStorage`에 저장되어 다음 접속 시에도 유지된다.
변경은 프론트엔드 전용이며 새로운 의존성 없음.

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18
**Primary Dependencies**: React (frontend) / Express.js (backend) — 기존 의존성 전용
**Storage**: 브라우저 localStorage (`study-note-layout` 키, 값: `default` | `wide`)
**Testing**: 없음 (현재 프로젝트에 테스트 프레임워크 미설정)
**Target Platform**: 데스크톱 웹 브라우저 (WSL Ubuntu 개발 환경)
**Project Type**: Web application (monorepo: frontend + backend)
**Performance Goals**: 레이아웃 전환 1초 이내 (CSS class 토글로 충분히 달성 가능)
**Constraints**: 새 의존성 추가 금지, 백엔드 변경 없음, 모바일 스코프 외
**Scale/Scope**: 단일 사용자, 로컬 JSON 파일 기반 저장소

## Constitution Check

*GATE: 구현 시작 전 통과 확인 완료.*

- **I. Monorepo Boundary**: 순수 프론트엔드 변경. 백엔드 소스 임포트 없음. 레이아웃 선호는 localStorage 저장으로 HTTP API 호출 불필요. ✅
- **II. English Code, Korean Commentary**: 모든 식별자 영어(camelCase/PascalCase), 주석·커밋 메시지 한국어. ✅
- **III. Stable API Contract**: 새 백엔드 엔드포인트 없음. 기존 API 계약 변경 없음. ✅
- **IV. Dependency Approval & Storage Simplicity**: 새 패키지 없음. localStorage 사용은 별도 설치 불필요. ✅
- **V. Fast, Predictable UX**: CSS 클래스 토글로 즉시 전환. 인라인 버튼(모달 없음). 키보드 접근 가능. ✅

## Project Structure

### Documentation (this feature)

```text
specs/002-expand-note-layout/
├── plan.md              ← 이 파일
├── research.md          ← Phase 0 산출물
├── data-model.md        ← Phase 1 산출물
├── quickstart.md        ← Phase 1 산출물
└── tasks.md             ← /speckit.tasks 산출물
```

### Source Code (변경 파일)

```text
frontend/
└── src/
    ├── hooks/
    │   └── useLayoutPreference.js   ← 신규: localStorage 기반 레이아웃 선호 훅
    ├── components/
    │   └── NoteComposer.jsx         ← 수정: 레이아웃 전환 버튼 추가
    ├── App.jsx                      ← 수정: layoutMode 상태 및 CSS class 적용
    └── styles/
        └── app.css                  ← 수정: wide 레이아웃 CSS modifier 추가
```

## Phase 0: Research

모든 기술적 의사결정 사항은 코드베이스 분석으로 해결 완료.

### research.md 요약

| 결정 | 선택 | 이유 |
|------|------|------|
| 레이아웃 저장 방식 | `localStorage` | 백엔드 변경 없이 간단하게 선호 저장 가능, constitution IV 부합 |
| 레이아웃 전환 메커니즘 | CSS class 토글 | JS 연산 없이 즉각적 전환, 새 의존성 불필요 |
| 넓은 레이아웃 정의 | `grid-template-columns: 1fr` (단일 열) | NoteComposer 전체 너비 확보, NoteList 아래 배치 |
| 전환 컨트롤 위치 | NoteComposer 헤더 내 (sectionHeading) | 편집 맥락 안에 인라인 배치, constitution V 부합 |
| 상태 관리 | 커스텀 훅 `useLayoutPreference` | App.jsx에서 상태 + localStorage 동기화 캡슐화 |

## Phase 1: Design & Contracts

### data-model.md 요약

**LayoutPreference (localStorage)**
- Key: `study-note-layout`
- Values: `"default"` | `"wide"`
- Default: `"default"` (키 없을 때)
- 저장 시점: 토글 버튼 클릭 즉시
- 읽기 시점: 앱 초기 마운트

**CSS 클래스 매핑**
| layoutMode | `.contentGrid` 클래스 | `.composerPanel` 클래스 |
|---|---|---|
| `"default"` | `contentGrid` | `composerPanel` |
| `"wide"` | `contentGrid contentGrid--wide` | `composerPanel composerPanel--wide` |

**CSS 정의 (신규 추가)**
```css
.contentGrid--wide {
  grid-template-columns: 1fr;
}

.composerPanel--wide {
  position: static;
}

.layoutToggle {
  /* NoteComposer 헤더 우측 토글 버튼 */
}
```

### 인터페이스 계약

백엔드 API 변경 없음 — contracts/ 폴더 불필요.

### 컴포넌트 인터페이스

**useLayoutPreference()**
- 반환: `{ layoutMode, toggleLayout }`
- `layoutMode`: `"default"` | `"wide"`
- `toggleLayout()`: 모드 전환 후 localStorage 저장

**NoteComposer props 추가**
- `layoutMode`: `"default"` | `"wide"` — 토글 버튼 상태 표시
- `onToggleLayout`: `() => void` — 부모(App)의 toggleLayout 전달

### quickstart.md

```bash
# 개발 서버 실행
cd frontend && npm run dev

# 검증 방법
# 1. 브라우저에서 앱 접속
# 2. NoteComposer 우측 상단 레이아웃 토글 버튼 클릭
# 3. contentGrid가 단일 열로 전환 확인
# 4. 페이지 새로고침 후 레이아웃 유지 확인
# 5. 다시 클릭 시 2열 레이아웃 복원 확인
```

## Agent Context Update

이 피처는 프론트엔드 전용. CLAUDE.md의 기존 컨텍스트로 충분하며 별도 업데이트 불필요.
