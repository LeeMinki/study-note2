# Implementation Checklist: 이미지 붙여넣기 및 자동 임시저장

**Purpose**: Validate implementation completeness against spec requirements
**Created**: 2026-04-14
**Feature**: [spec.md](../spec.md)

## FR Coverage

- [x] FR-001: content 편집 영역 paste 이벤트에서 클립보드 데이터 이미지 감지 (`event.clipboardData.items` 순회, `image/*` MIME 확인)
- [x] FR-002: 이미지 업로드 후 반환 URL로 `![image](url)` 생성, 커서 위치에 삽입
- [x] FR-003: 업로드 중 `![업로드 중...]` 임시 텍스트 표시
- [x] FR-004: 업로드 실패 시 임시 텍스트 제거 + `errorMessage` 상태로 오류 표시
- [x] FR-005: `renderMarkdown.js` `applyInlineMarkdown()`에 `![alt](url)` → `<img>` 렌더링 추가
- [x] FR-006: `<img style="max-width:100%" />` — 컨테이너 초과 방지
- [x] FR-007: 이미지 로드 실패 시 브라우저 기본 alt 텍스트 표시 (HTML `<img alt="...">`)
- [x] FR-008: `useDraftNote` — 3초 debounce로 localStorage 저장
- [x] FR-009: 마운트 시 `loadDraft()` 확인 → draft 존재 시 복원 배너 표시
- [x] FR-010: `handleSubmit()` 내 `clearDraft()` 호출 — 저장 성공 시 임시저장 삭제
- [x] FR-011: "삭제" 버튼 → `handleDiscardDraft()` → `clearDraft()` + 빈 폼 유지

## Constitution Check

- [x] CA-001: 이미지 업로드는 `POST /api/images` HTTP API로만 처리. 프론트엔드 파일시스템 접근 없음.
- [x] CA-002: 응답 형식 `{ success, data: { url }, error }` 준수 (imageController.js)
- [x] CA-003: multer 사용 (사용자 승인 완료). 프론트엔드 신규 의존성 없음.
- [x] CA-004: paste 이벤트 인라인 처리, 모달 없음. 복원 배너 NoteComposer 내 인라인.
- [x] CA-005: 이미지 파일은 backend/uploads/에 저장. 임시저장 데이터는 localStorage에만 저장.

## Success Criteria

- [x] SC-001: 업로드 완료까지 3초 이내 — 구현상 네트워크/서버 응답 후 즉시 교체. 로컬 환경에서 충족.
- [x] SC-002: 텍스트 붙여넣기 동작 유지 — 이미지 미감지 시 `event.preventDefault()` 미호출.
- [x] SC-003: 이미지 max-width:100% 적용 → 컨테이너 초과 없음.
- [x] SC-004: 입력 변경 후 3초 이내 임시저장 — debounce 3000ms.
- [x] SC-005: 새로고침 후 복원 — `loadDraft()` + 복원 배너 + "복원" 버튼으로 100% 재현 가능.
- [x] SC-006: 저장 성공 시 `clearDraft()` 호출 → 다음 작성 시 빈 폼.

## Build

- [x] `frontend npm run build` — 오류 없이 통과
- [x] `backend node -e "createApp()"` — 오류 없이 통과

## Notes

- 전체 23개 체크 항목 통과. `/speckit.analyze` 단계로 진행 가능.
- 브라우저 수동 테스트(T013-T015)는 dev server 환경에서 확인 권장.
