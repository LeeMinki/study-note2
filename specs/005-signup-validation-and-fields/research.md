# Research: 회원가입 검증 및 프로필 필드 확장

**Date**: 2026-04-16 | **Feature**: 005-signup-validation-and-fields

## 결정 사항

### 비밀번호 확인 검증 위치
- **Decision**: 클라이언트 선검증 후 서버 요청 전 차단
- **Rationale**: 불필요한 API 호출을 줄이고 사용자가 즉시 오류를 이해할 수 있다.
- **Alternatives considered**: 서버만 검증 — 왕복 비용이 늘고 UX가 불필요하게 느려진다.

### 프로필 필드 저장 구조
- **Decision**: `name`, `displayName`를 User 모델의 필수 필드로 승격
- **Rationale**: 이후 프로필 화면과 인증 응답에서 동일 구조를 재사용할 수 있다.
- **Alternatives considered**: 별도 profile 객체 중첩 저장 — 현재 저장소 구조에서는 과도하다.

### 로그인 응답 확장
- **Decision**: 로그인 성공 응답에도 `name`, `displayName` 포함
- **Rationale**: 로그인 직후 상단 프로필 버튼과 화면 표시 이름을 바로 렌더링할 수 있다.
- **Alternatives considered**: 로그인 후 별도 프로필 조회 강제 — 초기 렌더링이 복잡해진다.
