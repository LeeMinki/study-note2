# Data Model: 노트 편집 레이아웃 확장

**Date**: 2026-04-14 | **Feature**: 002-expand-note-layout

## LayoutPreference

**저장소**: 브라우저 localStorage
**키**: `study-note-layout`
**타입**: `"narrow"` | `"default"` | `"wide"`
**기본값**: `"default"` (키 없을 때)

| 필드 | 타입 | 설명 |
|------|------|------|
| value | `"narrow"` \| `"default"` \| `"wide"` | 현재 선택된 레이아웃 모드 |

## CSS 클래스 매핑

| layoutMode | contentGrid 클래스 추가 | 효과 |
|---|---|---|
| `"narrow"` | `contentGrid--narrow` | composer 폭을 더 좁게 유지하는 2열 레이아웃 |
| `"default"` | 없음 | `grid-template-columns: minmax(280px, 340px) minmax(0, 1fr)` (2열) |
| `"wide"` | `contentGrid--wide` | `grid-template-columns: 1fr` (단일 열) |

## 상태 흐름

```
앱 마운트
  → useLayoutPreference: localStorage.getItem('study-note-layout')
  → 없으면 'default', 있으면 저장값 사용
  → layoutMode 상태 초기화

사용자가 레이아웃 버튼 클릭
  → setLayout(mode) 호출
  → layoutMode: 'narrow' | 'default' | 'wide' 중 하나로 갱신
  → localStorage.setItem('study-note-layout', newMode)
  → App.jsx에서 contentGrid에 CSS class 적용/제거
```
