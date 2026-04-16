# Research: 계정 프로필 UI 및 상세정보 화면

**Date**: 2026-04-16 | **Feature**: 006-account-profile-ui

## 결정 사항

### 프로필 진입 방식
- **Decision**: 메인 앱 내부 상태(`currentView`) 전환
- **Rationale**: 별도 라우터 없이 전체 화면 전환형 프로필 화면을 제공할 수 있고, 기존 노트 앱 상태를 유지하기 쉽다.
- **Alternatives considered**: 라우터 도입 — 새 의존성과 구조 변경이 필요하다.

### 현재 사용자 복원 방식
- **Decision**: 앱 시작 시 `GET /api/auth/me`
- **Rationale**: localStorage 토큰만으로 UI를 그리지 않고, 실제 사용자 데이터를 서버에서 확인할 수 있다.
- **Alternatives considered**: 로그인 응답만 캐싱 — 새로고침 후 최신 프로필 데이터와 어긋날 수 있다.

### 프로필 수정 범위
- **Decision**: `name`, `displayName`만 수정 허용
- **Rationale**: 이메일/가입 시각은 표시 전용 정보로 유지해 보안과 UX를 단순하게 만든다.
- **Alternatives considered**: 이메일 수정까지 허용 — 별도 검증과 재인증 흐름이 필요하다.
