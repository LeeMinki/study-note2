# Implementation Plan: 계정 프로필 UI 및 상세정보 화면

**Branch**: `006-account-profile-ui` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)

## Summary

인증된 현재 사용자에 대한 `me` 조회/수정 API를 추가하고, 프론트엔드 메인 앱에서 프로필 버튼을 통해 전체 화면 프로필 뷰로 전환한다. 프로필 뷰는 이메일/가입일시를 읽기 전용으로 보여주고, `name`, `displayName`은 수정 저장할 수 있다.

## Technical Context

**Language/Version**: Node.js 18, React 19
**Primary Dependencies**: Express.js, React, axios, fetch
**Storage**: `users.json`
**Target Platform**: Linux/WSL, 데스크톱 브라우저
**Project Type**: 웹 애플리케이션 (monorepo)
**Constraints**: 신규 패키지 추가 없음, 라우터 미도입, JWT 기반 인증 흐름 유지

## Constitution Check

- [x] monorepo 경계: 프로필 데이터는 백엔드 API에서만 읽고 쓴다.
- [x] JSON envelope: `GET /api/auth/me`, `PATCH /api/auth/me` 응답 envelope 유지.
- [x] 스토리지: `users.json` 갱신은 repository/service 레이어를 통해 처리.
- [x] 식별자 규칙: 기존 camelCase/PascalCase 규칙 유지.
- [x] 신규 의존성: 없음.
- [x] UX: 프로필 버튼과 전체 화면 조건부 렌더링 사용, 모달/라우터 추가 없음.
- [x] Linux/WSL 친화적 작업 흐름 유지.

## Project Structure

```text
backend/src/
├── repositories/
│   └── fileUserRepository.js        수정: 사용자 업데이트 저장 지원
├── services/
│   └── authService.js               수정: current user 조회/프로필 수정
├── controllers/
│   └── authController.js            수정: me 조회/수정 핸들러 추가
└── routes/
    └── authRoutes.js                수정: GET/PATCH /api/auth/me 추가

frontend/src/
├── App.jsx                          수정: 프로필 버튼/화면 전환 연결
├── components/
│   └── ProfileView.jsx              신규: 전체 화면 프로필 뷰
├── hooks/
│   └── useAuth.js                   수정: 현재 사용자 로드/프로필 수정/토큰 만료 처리
└── services/
    └── authApi.js                   수정: getCurrentUser, updateCurrentUser 추가
```

## Key Design Decisions

1. 로그인/회원가입 응답의 사용자 객체를 `useAuth` 상태에 보관하고, 새로고침 시 `GET /api/auth/me`로 복원한다.
2. 프로필 저장은 `PATCH /api/auth/me`로 처리하고, 성공 시 `useAuth.currentUser`를 즉시 갱신한다.
3. 유효하지 않은 토큰으로 `me` 요청이 실패하면 localStorage 토큰을 제거하고 인증 화면으로 되돌린다.
4. 프로필 화면은 메인 앱 내부 상태 전환으로 구현해 기존 노트 목록 상태를 유지한다.
