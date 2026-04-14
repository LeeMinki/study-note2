# Tasks: 회원가입 검증 및 프로필 필드 확장

**Feature**: 005-signup-validation-and-fields | **Created**: 2026-04-15
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## 백엔드

- [x] T001: `backend/src/models/user.js` 수정 — `name`, `displayName` 검증 및 `createUser` 확장
- [x] T002: `backend/src/services/authService.js` 수정 — register/login 응답에 profile 필드 포함

## 프론트엔드

- [x] T003: `frontend/src/services/authApi.js` 수정 — 회원가입 payload에 `name`, `displayName` 포함
- [x] T004: `frontend/src/hooks/useAuth.js` 수정 — register 인자를 객체 기반으로 확장
- [x] T005: `frontend/src/components/AuthForm.jsx` 수정 — 회원가입 필드 추가 및 비밀번호 확인 클라이언트 검증
- [x] T006: `frontend/src/styles/app.css` 수정 — 추가 입력/오류 상태 스타일 보강

## 문서 및 검증

- [x] T007: `README.md` 수정 — 현재 구현 상태와 인증/프로필 데이터 설명 최신화
- [x] T008: 프론트엔드 빌드 통과 (`cd frontend && npm run build`)
- [x] T009: 백엔드 앱 로드 확인 (`cd backend && node -e "require('./src/app').createApp()"`)
