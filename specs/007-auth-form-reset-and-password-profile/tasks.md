# Tasks: 인증 폼 상태 초기화 및 프로필 비밀번호 변경 지원

**Feature**: 007-auth-form-reset-and-password-profile | **Created**: 2026-04-15
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## 백엔드

- [x] T001: `backend/src/services/authService.js` 수정 — 현재 비밀번호 검증 및 비밀번호 변경 로직 추가
- [x] T002: `backend/src/controllers/authController.js` 수정 — 비밀번호 변경 핸들러 추가
- [x] T003: `backend/src/routes/authRoutes.js` 수정 — `PATCH /api/auth/me/password` 추가

## 프론트엔드

- [x] T004: `frontend/src/components/AuthForm.jsx` 수정 — 탭 전환 시 로그인/회원가입 폼 상태 및 오류 초기화
- [x] T005: `frontend/src/services/authApi.js` 수정 — 비밀번호 변경 API 추가
- [x] T006: `frontend/src/hooks/useAuth.js` 수정 — 비밀번호 변경 호출 및 오류 처리 추가
- [x] T007: `frontend/src/components/ProfileView.jsx` 수정 — 별도 비밀번호 변경 섹션 추가
- [x] T008: `frontend/src/styles/app.css` 수정 — 프로필 비밀번호 변경 섹션 스타일 추가

## 문서 및 검증

- [x] T009: `README.md` 수정 — `001`~`006` 스펙 설명과 구현 상태 보강
- [x] T010: 프론트엔드 빌드 통과 (`cd frontend && npm run build`)
- [x] T011: 백엔드 앱 로드 확인 (`cd backend && node -e "require('./src/app').createApp()"`)
