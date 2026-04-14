# Tasks: 이미지 붙여넣기 및 자동 임시저장

**Feature**: 003-image-paste-autosave | **Created**: 2026-04-14
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## US1 - 이미지 붙여넣기 → 마크다운 자동 삽입

- [x] T001: `backend/uploads/` 디렉토리 생성 및 `.gitkeep` 추가
- [x] T002: `backend`에 `multer` 패키지 설치 (`npm install multer`)
- [x] T003: `backend/src/services/imageService.js` 생성 — multer diskStorage 설정 (5MB 제한, image/* MIME 필터, `Date.now()-originalname` 파일명)
- [x] T004: `backend/src/controllers/imageController.js` 생성 — `POST /api/images` 핸들러, 성공 시 `{ success: true, data: { url: '/uploads/filename' }, error: null }` 응답
- [x] T005: `backend/src/routes/imageRoutes.js` 생성 — multer upload 미들웨어 + imageController 연결
- [x] T006: `backend/src/app.js` 수정 — imageRoutes 등록 (`/api/images`), `express.static` 미들웨어 추가 (`/uploads` 경로)
- [x] T007: `frontend/src/services/imagesApi.js` 생성 — `uploadImage(file)` 함수, `FormData`로 `POST /api/images` 호출
- [x] T008: `frontend/src/components/NoteComposer.jsx` 수정 — content textarea에 `onPaste` 핸들러 추가: 이미지 감지 시 `event.preventDefault()`, 업로드 중 `![업로드 중...]` 임시 삽입, 완료 후 `![image](url)` 교체, 실패 시 임시 텍스트 제거 + 에러 메시지 표시

## US2 - 렌더링 영역에서 이미지 표시

- [x] T009: `frontend/src/utils/renderMarkdown.js` 수정 — `applyInlineMarkdown()`에 이미지 패턴 추가: 기울임(`*...*`) 패턴 다음, 링크(`[...](...)`) 패턴 앞에 `![alt](url)` → `<img src="url" alt="alt" style="max-width:100%" />` 삽입

## US3 - 작성 중 자동 임시저장 및 복원

- [x] T010: `frontend/src/hooks/useDraftNote.js` 생성 — `title/content/tags` 변경 후 3초 debounce로 localStorage(`study-note-draft`)에 저장, 초기 로드 시 draft 감지 후 반환, `clearDraft()` 함수 제공
- [x] T011: `frontend/src/components/NoteComposer.jsx` 수정 — `useDraftNote` 연동: draft 존재 시 인라인 복원 배너 표시 ("복원"/"삭제" 버튼), 복원 클릭 시 폼 채우기, 삭제 클릭 시 `clearDraft()`, 노트 저장 성공 시 `clearDraft()` 호출
- [x] T012: `frontend/src/styles/app.css` 수정 — `.draftBanner` 스타일 추가 (인라인 배너, 복원/삭제 버튼)

## 완성도 검증

- [x] T013: 개발 서버 실행 후 이미지 붙여넣기 기능 수동 테스트 (업로드 성공, 임시 텍스트, 실패 케이스)
- [x] T014: 렌더링 영역에서 이미지 표시 확인 (URL 정상, 깨진 URL alt 표시, max-width 적용)
- [x] T015: 자동 임시저장 및 복원 수동 테스트 (입력 → 3초 대기 → 새로고침 → 복원 배너 확인)
