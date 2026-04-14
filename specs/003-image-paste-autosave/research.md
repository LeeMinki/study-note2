# Research: 이미지 붙여넣기 및 자동 임시저장

**Date**: 2026-04-14

## 기존 코드 분석

### backend/src/app.js
- CORS 미들웨어, express.json(), /api/notes 라우트, 전역 에러 핸들러
- imageRoutes 및 express.static("uploads") 추가 필요

### backend/src/utils/responseEnvelope.js
- createSuccessResponse(data), createErrorResponse(message) 유틸리티 존재
- 모든 신규 엔드포인트에서 동일하게 사용

### frontend/src/utils/renderMarkdown.js
- applyInlineMarkdown(): 코드 → 굵게 → 기울임 → 링크 순서
- ![alt](url) 이미지 패턴 미지원 — 링크 패턴 앞에 추가 필요

### frontend/src/components/NoteComposer.jsx
- title, content, tags 상태 관리
- paste 이벤트 핸들러 없음
- useDraftNote 연동 및 복원 배너 추가 필요

## 의존성 분석

- multer: 사용자 승인 완료, backend에만 설치
- 프론트엔드: 기존 fetch API 충분
