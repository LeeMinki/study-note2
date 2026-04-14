# Implementation Plan: 로그인/회원가입 및 계정별 노트 분리

**Branch**: `004-auth-login` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)

## Summary

JWT 기반 이메일/비밀번호 인증 시스템 추가. 백엔드에 회원가입/로그인 API, JWT 검증 미들웨어, 노트 소유자 격리를 구현하고, 프론트엔드에서 인증 상태에 따라 로그인 폼 또는 메인 앱을 조건부 렌더링.

## Technical Context

**Language/Version**: Node.js 18, React 18
**Primary Dependencies**: Express.js, bcryptjs (승인), jsonwebtoken (승인)
**Storage**: users.json (신규), data.json (기존, userId 필드 추가)
**Target Platform**: Linux/WSL, 데스크톱 브라우저
**Project Type**: 웹 애플리케이션 (monorepo)
**Constraints**: JWT 유효기간 7일, 비밀번호 최소 6자, saltRounds=10

## Constitution Check

- [x] monorepo 경계: 인증 로직 전부 백엔드. 프론트엔드는 API 호출만.
- [x] JSON envelope: POST /api/auth/register, POST /api/auth/login 모두 `{ success, data, error }` 형식.
- [x] 스토리지: users.json은 fileUserRepository로만 접근. 비밀번호 평문 미저장.
- [x] 식별자: camelCase/PascalCase 준수. authMiddleware, useAuth, AuthForm.
- [x] 신규 의존성: bcryptjs, jsonwebtoken — 사용자 승인 완료.
- [x] UX: AuthForm 조건부 렌더링 (모달 없음). 로그인/회원가입 토글 인라인.
- [x] Linux/WSL 친화적.

## Project Structure

```text
backend/src/
├── app.js                           수정: authRoutes 등록, notes 라우트에 authMiddleware 적용
├── middleware/
│   └── authMiddleware.js            신규: JWT 검증, req.user 주입
├── models/
│   ├── note.js                      수정: createNote에 userId 추가
│   └── user.js                      신규: createUser, validateUserInput
├── repositories/
│   └── fileUserRepository.js        신규: users.json 읽기/쓰기
├── services/
│   ├── authService.js               신규: register, login 로직
│   └── notesService.js              수정: userId 기반 필터링
├── controllers/
│   ├── authController.js            신규: register/login 핸들러
│   └── notesController.js           수정: req.user.userId 전달
└── routes/
    └── authRoutes.js                신규: POST /api/auth/register, /login

frontend/src/
├── App.jsx                          수정: useAuth 연동, 조건부 렌더링
├── services/
│   ├── authApi.js                   신규: register/login fetch
│   └── notesApi.js                  수정: Authorization 헤더 추가
├── hooks/
│   └── useAuth.js                   신규: 토큰 관리, 로그인 상태
└── components/
    └── AuthForm.jsx                 신규: 로그인/회원가입 폼 (토글)
```

## Key Design Decisions

1. **JWT secret**: `process.env.JWT_SECRET` → 미설정 시 개발용 fallback 문자열
2. **토큰 저장**: localStorage `study-note-token`
3. **노트 userId 필터**: `notesService.getNotes(query, userId)` — 서비스 레이어에서 필터
4. **노트 소유권 검증**: update/delete 시 `note.userId !== userId`이면 404 반환 (소유자 노출 방지)
5. **기존 노트(userId 없음)**: orphaned — 어떤 계정에도 노출되지 않음
6. **SSO 준비**: User 모델에 `provider: "local"` 필드 포함
7. **authApi.js**: fetch 기반 (axios 미사용, 기존 notesApi.js와 다르나 신규 의존성 없음)
8. **Authorization 헤더**: notesApi.js에서 `localStorage.getItem("study-note-token")` 직접 읽기 (useAuth 순환 의존 방지)
