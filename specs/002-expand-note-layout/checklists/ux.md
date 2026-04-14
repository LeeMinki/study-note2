# UX Checklist: 노트 편집 레이아웃 확장

**Purpose**: 레이아웃 확장 기능의 UX 요구사항 완성도 및 품질 검증
**Created**: 2026-04-14
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [x] CHK001 레이아웃 전환 컨트롤의 위치(NoteComposer 헤더 내)가 명세에 정의되어 있는가? [Completeness, Spec §FR-001]
- [x] CHK002 넓은 레이아웃 모드에서의 시각적 변화(NoteComposer 전체 너비, NoteList 아래 배치)가 명세에 명확히 기술되어 있는가? [Completeness, Spec §FR-005, Clarifications]
- [x] CHK003 레이아웃 선택 저장 방식(localStorage)이 명세에 명시되어 있는가? [Completeness, Spec §CA-002]
- [x] CHK004 3단계 레이아웃 옵션(좁음/기본/넓음)의 범위가 P3 스토리로 명확히 분리되어 있는가? [Completeness, Spec §US3]

## Requirement Clarity

- [x] CHK005 "넓은" 레이아웃이 구체적 수치(뷰포트 80% 이상)로 정량화되어 있는가? [Clarity, Spec §FR-005, §SC-002]
- [x] CHK006 레이아웃 전환 즉시 적용 요건이 측정 가능한 기준(1초 이내)으로 정의되어 있는가? [Clarity, Spec §SC-005]
- [x] CHK007 "좁음" 레이아웃이 구체적 수치(뷰포트 50% 이하)로 정량화되어 있는가? [Clarity, Spec §US3]
- [x] CHK008 레이아웃 전환 시 노트 내용 손실 없음 요건이 명확히 기술되어 있는가? [Clarity, Spec §FR-003, §SC-004]

## Requirement Consistency

- [x] CHK009 P1(레이아웃 전환)과 P2(선호 저장)의 수락 시나리오가 서로 일관되는가? [Consistency, Spec §US1, §US2]
- [x] CHK010 Constitution V(인라인 편집 선호, 모달 자제)와 NoteComposer 헤더 내 인라인 토글 방식이 일치하는가? [Consistency, Spec §CA-004]
- [x] CHK011 FR-002(최소 2가지 모드)와 US3(3단계 옵션) 간 범위 확장 방향이 모순 없이 기술되어 있는가? [Consistency, Spec §FR-002, §US3]

## Scenario Coverage

- [x] CHK012 레이아웃 전환 후 노트 내용이 유지됨을 확인하는 수락 시나리오가 존재하는가? [Coverage, Spec §US1]
- [x] CHK013 페이지 재방문(새로고침, 브라우저 재시작) 시 레이아웃 유지 시나리오가 정의되어 있는가? [Coverage, Spec §US2]
- [x] CHK014 3단계 옵션에서 현재 선택된 옵션의 강조 표시 요건이 수락 시나리오에 포함되어 있는가? [Coverage, Spec §US3]

## Edge Case Coverage

- [x] CHK015 모바일/좁은 뷰포트에서의 레이아웃 동작이 Edge Cases 섹션에 기술되어 있는가? [Edge Case, Spec §Edge Cases]
- [x] CHK016 레이아웃 전환 중 자동 저장 발생 시 내용 손실 여부가 Edge Cases에 언급되어 있는가? [Edge Case, Spec §Edge Cases]
- [x] CHK017 여러 탭에서 레이아웃 변경 시 다른 탭 영향 여부가 Edge Cases에 기술되어 있는가? [Edge Case, Spec §Edge Cases]

## Non-Functional Requirements

- [x] CHK018 키보드 접근성 요건(FR-006)이 측정 가능한 형태로 정의되어 있는가? [Coverage, Spec §FR-006]
- [x] CHK019 레이아웃 전환 성능 목표(1초 이내)가 성공 기준에 포함되어 있는가? [Completeness, Spec §SC-005]
- [x] CHK020 모바일 지원 제외가 Assumptions에 명시되어 있는가? [Completeness, Spec §Assumptions]

## Dependencies & Assumptions

- [x] CHK021 localStorage 기반 저장으로 인한 기기 간 비동기화 한계가 Assumptions에 명시되어 있는가? [Assumption, Spec §Assumptions]
- [x] CHK022 새 외부 의존성 없음이 계획(CA-003)에 명시되어 있는가? [Dependency, Spec §CA-003]
- [x] CHK023 레이아웃 선호가 전역 적용(노트별 개별 설정 아님)임이 Assumptions에 기술되어 있는가? [Assumption, Spec §Assumptions]

## Notes

- 모든 항목 통과 (23/23)
- Check items off as completed: `[x]`
- 이 체크리스트는 요구사항 품질을 검증하며, 구현 동작 검증이 아님
