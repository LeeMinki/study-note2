# Tasks: 계정 프로필 UI 및 상세정보 화면

**Feature**: 006-account-profile-ui | **Created**: 2026-04-15
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## 백엔드

- [x] T001: `backend/src/repositories/fileUserRepository.js` 수정 — 사용자 프로필 업데이트 저장 지원
- [x] T002: `backend/src/services/authService.js` 수정 — `getCurrentUser`, `updateCurrentUser` 추가
- [x] T003: `backend/src/controllers/authController.js` 수정 — `GET/PATCH /api/auth/me` 핸들러 추가
- [x] T004: `backend/src/routes/authRoutes.js` 수정 — 인증 보호된 `me` 라우트 추가

## 프론트엔드

- [x] T005: `frontend/src/services/authApi.js` 수정 — 현재 사용자 조회/수정 API 추가
- [x] T006: `frontend/src/hooks/useAuth.js` 수정 — `currentUser` 상태, 새로고침 복원, 프로필 수정, 토큰 만료 처리
- [x] T007: `frontend/src/components/ProfileView.jsx` 생성 — 전체 화면 프로필 조회/수정 UI
- [x] T008: `frontend/src/App.jsx` 수정 — 프로필 버튼, 화면 전환, 로그아웃/복귀 동선 연결
- [x] T009: `frontend/src/styles/app.css` 수정 — 프로필 화면 스타일 추가

## 문서 및 검증

- [x] T010: `README.md` 수정 — 프로필 화면/프로필 편집 기능 반영
- [x] T011: 프론트엔드 빌드 통과 (`cd frontend && npm run build`)
- [x] T012: 백엔드 앱 로드 확인 (`cd backend && node -e "require('./src/app').createApp()"`)
