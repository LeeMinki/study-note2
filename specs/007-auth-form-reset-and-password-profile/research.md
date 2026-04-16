# Research: 인증 폼 상태 초기화 및 프로필 비밀번호 변경 지원

**Date**: 2026-04-16 | **Feature**: 007-auth-form-reset-and-password-profile

## 결정 사항

### 인증 폼 상태 분리
- **Decision**: 로그인 폼 상태와 회원가입 폼 상태를 별도 state bucket으로 유지
- **Rationale**: 탭 전환 시 서로의 입력값과 오류 메시지가 섞이지 않도록 보장할 수 있다.
- **Alternatives considered**: 단일 폼 상태 재사용 — 현재 누수 문제의 원인이 된다.

### 탭 전환 시 초기화 방식
- **Decision**: `mode` 변경 시 `useEffect`에서 반대 탭 상태를 명시적으로 초기화
- **Rationale**: 브라우저 자동완성과 컴포넌트 state 불일치를 줄이고, 로컬 오류도 함께 지울 수 있다.
- **Alternatives considered**: submit 이후에만 초기화 — 전환 시점 누수 문제를 해결하지 못한다.

### 비밀번호 변경 위치
- **Decision**: 프로필 화면 내부 별도 섹션
- **Rationale**: 기존 프로필 편집 흐름 안에서 계정 관리 기능을 확장할 수 있고 모달 없이 처리 가능하다.
- **Alternatives considered**: 별도 화면/모달 — 현재 앱 구조와 어긋난다.
