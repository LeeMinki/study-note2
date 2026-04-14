# Implementation Plan: 회원가입 검증 및 프로필 필드 확장

**Branch**: `005-signup-validation-and-fields` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)

## Summary

회원가입 폼에 `name`, `displayName`, `passwordConfirm`을 추가하고, 백엔드 사용자 모델과 인증 응답에 프로필 필드를 포함한다. 비밀번호 확인은 프론트엔드에서 선검증하고, 서버는 확장된 사용자 입력을 저장/반환한다.

## Technical Context

**Language/Version**: Node.js 18, React 19
**Primary Dependencies**: Express.js, bcryptjs, jsonwebtoken, fetch
**Storage**: `users.json`
**Target Platform**: Linux/WSL, 데스크톱 브라우저
**Project Type**: 웹 애플리케이션 (monorepo)
**Constraints**: 신규 패키지 추가 없음, 기존 인증 UX 유지, 로그인 탭과 회원가입 탭 동작 분리

## Constitution Check

- [x] monorepo 경계: 프론트엔드는 인증 API만 호출하고 백엔드가 저장/검증 책임을 가진다.
- [x] JSON envelope: `POST /api/auth/register`, `POST /api/auth/login` 응답 envelope 유지.
- [x] 스토리지: `users.json` 변경은 repository/service 레이어를 통해서만 처리.
- [x] 식별자 규칙: PascalCase 컴포넌트, camelCase 함수/변수 유지.
- [x] 신규 의존성: 없음.
- [x] UX: 기존 인라인 AuthForm 확장, 모달/라우터 추가 없음.
- [x] Linux/WSL 친화적 작업 흐름 유지.

## Project Structure

```text
backend/src/
├── models/
│   └── user.js                      수정: profile 필드 검증 및 createUser 확장
├── services/
│   └── authService.js               수정: register/login 응답에 profile 필드 포함
└── controllers/
    └── authController.js            유지: 기존 오류 분기 재사용

frontend/src/
├── components/
│   └── AuthForm.jsx                 수정: 회원가입 입력 필드/클라이언트 검증 추가
├── services/
│   └── authApi.js                   수정: register payload 확장
└── hooks/
    └── useAuth.js                   수정: register 시 확장 payload 전달
```

## Key Design Decisions

1. `passwordConfirm`은 프론트엔드 폼 상태에만 존재하고 API 요청 본문에는 포함하지 않는다.
2. 이름과 표시 이름은 서버 저장 전에 trim 처리한다.
3. 로그인 응답도 동일한 사용자 프로필 구조를 반환해 이후 프로필 UI 기능과 정합성을 맞춘다.
4. 서버 검증 메시지는 기존 `authController` 400/409 흐름을 유지한다.
