# Research: 로그인/회원가입 및 계정별 노트 분리

**Date**: 2026-04-16 | **Feature**: 004-auth-login

## 결정 사항

### 인증 방식
- **Decision**: JWT 기반 stateless 인증
- **Rationale**: local JSON 저장소 기반 구조에서도 간단하게 적용 가능하고, 프론트엔드는 토큰만 저장하면 되어 기존 단일 화면 구조와 잘 맞는다.
- **Alternatives considered**: 서버 세션 저장 방식 — 세션 저장소와 추가 상태 관리가 필요해 현재 스코프 대비 복잡하다.

### 비밀번호 저장 방식
- **Decision**: `bcryptjs` 해시 저장
- **Rationale**: 평문 비밀번호 저장을 피하면서도 Node/Express 환경에서 가볍게 적용 가능하다.
- **Alternatives considered**: 자체 해시 구현 — 보안상 부적절.

### 인증 상태 복원
- **Decision**: 프론트엔드 localStorage에 JWT 저장 후, 앱 시작 시 `GET /api/auth/me`로 복원
- **Rationale**: 토큰 존재만으로 인증 성공을 가정하지 않고 서버에서 현재 사용자 상태를 다시 확인할 수 있다.
- **Alternatives considered**: 토큰 payload만 읽어 프론트에서 복원 — 만료/사용자 삭제 상태를 제대로 반영하기 어렵다.

### 계정별 노트 분리 방식
- **Decision**: 노트 모델에 `userId`를 추가하고 서비스 레이어에서 사용자별 필터링
- **Rationale**: 기존 파일 저장 구조를 크게 바꾸지 않으면서 데이터 격리를 구현할 수 있다.
- **Alternatives considered**: 사용자별 별도 파일 저장 — 파일 수와 저장 로직이 불필요하게 복잡해진다.

### 인증 UI 구조
- **Decision**: 별도 라우터 없이 `AuthForm` 조건부 렌더링
- **Rationale**: 기존 단일 화면 앱 구조를 유지하면서 로그인/회원가입 경험을 추가할 수 있다.
- **Alternatives considered**: React Router 도입 — 신규 의존성과 구조 변화가 필요해 현재 스코프 밖이다.
