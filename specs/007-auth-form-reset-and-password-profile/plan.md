# Implementation Plan: 인증 폼 상태 초기화 및 프로필 비밀번호 변경 지원

**Branch**: `007-auth-form-reset-and-password-profile` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)

## Summary

인증 폼을 로그인/회원가입 모드별 독립 상태로 정리해 탭 전환 시 입력값 누수를 제거하고, 프로필 화면에 현재 비밀번호 확인 기반의 비밀번호 변경 섹션과 백엔드 비밀번호 변경 API를 추가한다. README는 기존 스펙별 목적과 구현 상태를 요약하도록 확장한다.

## Technical Context

**Language/Version**: Node.js 18, React 19
**Primary Dependencies**: Express.js, bcryptjs, jsonwebtoken, React
**Storage**: `users.json`
**Target Platform**: Linux/WSL, 데스크톱 브라우저
**Project Type**: 웹 애플리케이션 (monorepo)
**Constraints**: 신규 패키지 추가 없음, 기존 인증 흐름 유지, 프로필 화면 내 별도 비밀번호 섹션 사용

## Constitution Check

- [x] monorepo 경계: 비밀번호 변경은 백엔드 API에서만 처리.
- [x] JSON envelope: 변경되는 인증 응답은 `{ success, data, error }` 유지.
- [x] 스토리지: `users.json` 변경은 repository/service 레이어를 통해서만 수행.
- [x] 식별자 규칙: 기존 camelCase/PascalCase 유지.
- [x] 신규 의존성: 없음.
- [x] UX: 기존 인증 폼/프로필 화면 확장, 추가 모달/라우터 없음.
- [x] Linux/WSL 친화적 작업 흐름 유지.

## Project Structure

```text
backend/src/
├── services/
│   └── authService.js               수정: 현재 비밀번호 검증 및 비밀번호 변경 추가
├── controllers/
│   └── authController.js            수정: 비밀번호 변경 핸들러 추가
└── routes/
    └── authRoutes.js                수정: PATCH /api/auth/me/password 추가

frontend/src/
├── components/
│   ├── AuthForm.jsx                 수정: 탭 전환 시 상태 초기화
│   └── ProfileView.jsx              수정: 비밀번호 변경 섹션 추가
├── hooks/
│   └── useAuth.js                   수정: 비밀번호 변경 호출 추가
└── services/
    └── authApi.js                   수정: 비밀번호 변경 API 추가
```

## Key Design Decisions

1. 인증 폼은 모드 전환 시 관련 상태를 명시적으로 초기화한다.
2. 비밀번호 변경은 `PATCH /api/auth/me/password`로 분리해 프로필 기본정보 수정과 책임을 나눈다.
3. 비밀번호 변경 성공 후 현재/새 비밀번호 입력값은 즉시 지운다.
4. README는 기능 목록이 아니라 스펙별 요약과 현재 반영 상태 중심으로 재구성한다.
