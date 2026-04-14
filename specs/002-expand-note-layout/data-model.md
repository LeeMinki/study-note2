# Data Model: 노트 편집 레이아웃 확장

**Date**: 2026-04-14 | **Feature**: 002-expand-note-layout

## LayoutPreference

**저장소**: 브라우저 localStorage
**키**: `study-note-layout`
**타입**: `"default"` | `"wide"`
**기본값**: `"default"` (키 없을 때)

| 필드 | 타입 | 설명 |
|------|------|------|
| value | `"default"` \| `"wide"` | 현재 선택된 레이아웃 모드 |

## CSS 클래스 매핑

| layoutMode | contentGrid 클래스 추가 | 효과 |
|---|---|---|
| `"default"` | 없음 | `grid-template-columns: minmax(280px, 340px) minmax(0, 1fr)` (2열) |
| `"wide"` | `contentGrid--wide` | `grid-template-columns: 1fr` (단일 열) |

## 상태 흐름

```
앱 마운트
  → useLayoutPreference: localStorage.getItem('study-note-layout')
  → 없으면 'default', 있으면 저장값 사용
  → layoutMode 상태 초기화

사용자가 토글 클릭
  → toggleLayout() 호출
  → layoutMode: 'default' ↔ 'wide' 전환
  → localStorage.setItem('study-note-layout', newMode)
  → App.jsx에서 contentGrid에 CSS class 적용/제거
```
