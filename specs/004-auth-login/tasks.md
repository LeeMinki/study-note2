# Tasks: 로그인/회원가입 및 계정별 노트 분리

**Feature**: 004-auth-login | **Created**: 2026-04-15
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## 백엔드 - 인증 시스템

- [x] T001: `bcryptjs`, `jsonwebtoken` 패키지 설치
- [x] T002: `backend/src/models/user.js` 생성 — createUser, validateUserInput (provider 필드 포함)
- [x] T003: `backend/src/repositories/fileUserRepository.js` 생성 — users.json 읽기/쓰기
- [x] T004: `backend/src/services/authService.js` 생성 — register/login/verifyToken
- [x] T005: `backend/src/middleware/authMiddleware.js` 생성 — Bearer JWT 검증, req.user 주입
- [x] T006: `backend/src/controllers/authController.js` 생성 — registerHandler, loginHandler
- [x] T007: `backend/src/routes/authRoutes.js` 생성 — POST /api/auth/register, /login

## 백엔드 - 노트 소유자 격리

- [x] T008: `backend/src/models/note.js` 수정 — createNote에 userId 파라미터 추가
- [x] T009: `backend/src/services/notesService.js` 수정 — userId 기반 노트 필터링, 소유권 검증
- [x] T010: `backend/src/controllers/notesController.js` 수정 — req.user.userId 서비스로 전달
- [x] T011: `backend/src/app.js` 수정 — authRoutes 등록, notes/images 라우트에 requireAuth 적용, Authorization 헤더 CORS 허용

## 프론트엔드

- [x] T012: `frontend/src/services/authApi.js` 생성 — registerUser/loginUser fetch
- [x] T013: `frontend/src/hooks/useAuth.js` 생성 — 토큰 관리, login/register/logout
- [x] T014: `frontend/src/components/AuthForm.jsx` 생성 — 로그인/회원가입 토글 폼
- [x] T015: `frontend/src/services/notesApi.js` 수정 — axios interceptor로 Authorization 헤더 자동 첨부
- [x] T016: `frontend/src/App.jsx` 수정 — useAuth 연동, 미인증 시 AuthForm 표시, 로그아웃 버튼
- [x] T017: `frontend/src/styles/app.css` 수정 — AuthForm 스타일 추가

## 검증

- [x] T018: 프론트엔드 빌드 통과 (npm run build)
- [x] T019: 백엔드 문법 확인 (node createApp)
