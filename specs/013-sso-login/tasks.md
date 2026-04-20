# Tasks: SSO Login (013)

**Input**: `specs/013-sso-login/` — plan.md, spec.md, research.md, data-model.md, contracts/sso-api-contract.md
**Branch**: `013-sso-login`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 선행 의존 없음)
- **[Story]**: [US1] SSO 신규 로그인 / [US2] local↔SSO 계정 연결 / [US3] 로그아웃·세션 관리

---

## Phase 1: Setup

**Purpose**: 환경변수 구조 및 provider 설정 기반 마련

- [ ] T001 backend `.env.example`에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `APP_BASE_URL` 항목 추가 (`backend/.env.example`)
- [ ] T002 [P] `infra/kubernetes/study-note/base/secret-template.yaml`에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 항목 추가
- [ ] T003 [P] `infra/kubernetes/study-note/base/configmap.yaml`에 `GOOGLE_CALLBACK_URL`, `APP_BASE_URL` 항목 추가
- [ ] T004 [P] `infra/docs/secrets.md` MVP 시크릿 목록에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 항목 추가

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 user story에 공통으로 필요한 백엔드 기반 레이어

**⚠️ CRITICAL**: 이 Phase 완료 전 user story 작업 시작 불가

- [ ] T005 `backend/src/repositories/dbUserRepository.js`에 `findUserByProviderId(provider, providerId)` 함수 추가 — `SELECT * FROM users WHERE provider = ? AND provider_id = ?` 쿼리 사용
- [ ] T006 `backend/src/models/user.js`에 `createSSOUser({ email, name, displayName, provider, providerId })` 팩토리 함수 추가 — `password_hash` null, `provider`/`provider_id` 설정
- [ ] T007 `backend/src/services/ssoService.js` 신규 생성 — `generateState()`, `storeState()`, `validateAndConsumeState()` in-memory Map 구현 (TTL 10분)
- [ ] T008 `backend/src/services/ssoService.js`에 `buildGoogleAuthUrl(state)` 구현 — `https://accounts.google.com/o/oauth2/v2/auth` URL 생성, scope: `openid email profile`
- [ ] T009 `backend/src/services/ssoService.js`에 `exchangeCodeForToken(code)` 구현 — Node.js 22 내장 `fetch`로 `https://oauth2.googleapis.com/token` POST 호출
- [ ] T010 `backend/src/services/ssoService.js`에 `getGoogleUserInfo(accessToken)` 구현 — `https://www.googleapis.com/oauth2/v3/userinfo` GET 호출, `{ sub, email, email_verified, name }` 반환
- [ ] T011 `backend/src/controllers/ssoController.js` 신규 생성 — `ssoRedirectHandler`, `ssoCallbackHandler` 핸들러 스텁
- [ ] T012 `backend/src/routes/ssoRoutes.js` 신규 생성 — `GET /sso/:provider`, `GET /sso/:provider/callback` 라우트 등록
- [ ] T013 `backend/src/app.js`에 ssoRoutes 마운트 — `app.use('/api/auth', ssoRouter)`

**Checkpoint**: `curl http://localhost:3001/api/auth/sso/google` → 302 redirect to Google 확인

---

## Phase 3: User Story 1 — SSO 신규 로그인 (Priority: P1) 🎯 MVP

**Goal**: 기존 계정 없는 사용자가 Google로 최초 로그인 → 계정 자동 생성 → JWT 발급

**Independent Test**: 신규 브라우저에서 Google 로그인 → 메인 화면 진입 및 빈 노트 목록 확인

### Implementation

- [ ] T014 [US1] `backend/src/services/ssoService.js`에 `findOrCreateUser(googleProfile)` 구현 — `findUserByProviderId`로 기존 SSO 계정 조회, 없으면 `createSSOUser` + `saveUser` 실행
- [ ] T015 [US1] `backend/src/controllers/ssoController.js` `ssoRedirectHandler` 구현 — provider 검증, state 생성·저장, `buildGoogleAuthUrl`로 302 redirect
- [ ] T016 [US1] `backend/src/controllers/ssoController.js` `ssoCallbackHandler` 구현 — state 검증, code→token 교환, userinfo 조회, `findOrCreateUser`, JWT 발급
- [ ] T017 [US1] `ssoCallbackHandler` 성공 시 프론트엔드로 리다이렉트 — `${APP_BASE_URL}/#sso-token=<jwt>`
- [ ] T018 [US1] `ssoCallbackHandler` 실패 시 처리 — provider 오류·취소 시 `${APP_BASE_URL}/?sso_error=<message>` redirect
- [ ] T019 [US1] `frontend/src/App.jsx` 초기화 시 `window.location.hash`에서 `sso-token` 추출 → localStorage 저장 → `history.replaceState`로 hash 제거
- [ ] T020 [US1] `frontend/src/App.jsx` `sso_error` query param 감지 → authError 상태로 전달
- [ ] T021 [P] [US1] `frontend/src/components/AuthForm.jsx`에 "Google로 로그인" 버튼 추가 — `/api/auth/sso/google`로 이동하는 링크/버튼, 기존 폼과 시각적으로 구분되는 구분선 추가

**Checkpoint**: Google 로그인 → 메인 화면 진입, DB에 `provider='google'` 계정 생성 확인

---

## Phase 4: User Story 2 — local↔SSO 계정 연결 (Priority: P2)

**Goal**: 동일 이메일 local 계정에 SSO 로그인 시 자동 연결, 노트 소유권 유지, 두 로그인 방법 모두 허용

**Independent Test**: local 계정 + 노트 생성 → 동일 이메일 Google 로그인 → 기존 노트 100% 확인

### Implementation

- [ ] T022 [US2] `backend/src/services/ssoService.js` `findOrCreateUser` 확장 — 이메일로 local 계정 발견 시 `email_verified` 검증, `updateUser`로 `provider='google'`, `provider_id=sub` 업데이트 (password_hash 유지)
- [ ] T023 [US2] `backend/src/services/ssoService.js`에서 `email_verified: false` 케이스 처리 — 연결 거부, `email_not_verified` 오류 발생
- [ ] T024 [US2] `backend/src/services/authService.js` `login` 함수 수정 — `user.passwordHash === null`이고 `user.provider !== 'local'`인 경우 "이 계정은 Google 로그인을 사용합니다." 오류 반환
- [ ] T025 [US2] `backend/src/services/authService.js` `register` 함수 수정 — SSO로 이미 연결된 이메일 가입 시도 시 "이미 사용 중인 이메일입니다." 오류 (기존 로직 그대로)

**Checkpoint**: local 계정 노트 작성 → 동일 이메일 Google 로그인 → 기존 노트 표시 + local 로그인도 가능

---

## Phase 5: User Story 3 — 로그아웃 및 세션 관리 (Priority: P3)

**Goal**: SSO 로그인 사용자의 로그아웃이 Study Note JWT 삭제로 처리됨, Google 세션 유지

**Independent Test**: SSO 로그인 → 로그아웃 → 로그인 화면 복귀 → 뒤로가기로 접근 시 재인증 요구

### Implementation

- [ ] T026 [US3] `frontend/src/App.jsx` 및 `useAuth` hook 확인 — 기존 로그아웃 로직(localStorage JWT 삭제)이 SSO 사용자에게도 동일하게 적용되는지 검증. SSO provider 로그아웃 호출 없음 확인.
- [ ] T027 [US3] `frontend/src/components/AuthForm.jsx` SSO 오류 메시지 표시 — `sso_error` query param 값을 사용자 친화적 메시지로 변환하여 오류 배너에 표시

**Checkpoint**: SSO 로그인 → 로그아웃 → localStorage 토큰 삭제 확인, Google 계정 세션 유지 확인

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 운영 문서, 보안 강화, 회귀 검증

- [ ] T028 `infra/docs/secrets.md`에 Google OAuth2 앱 등록 절차 및 운영 체크리스트 추가 (quickstart.md의 k8s 배포 섹션 연동)
- [ ] T029 [P] `backend/src/services/ssoService.js` state store TTL 만료 정리 로직 추가 — 10분 초과 state 자동 삭제 (setInterval 또는 조회 시 lazy 정리)
- [ ] T030 [P] `backend/.env.example` 로컬 테스트용 callback URL 주석 설명 추가
- [ ] T031 quickstart.md 시나리오 4개로 수동 회귀 검증 실행 — SSO 신규 로그인, 계정 연결, 취소 흐름, SSO 전용 계정 local 로그인 차단
- [ ] T032 [P] `README.md` 현재 상태 섹션에 SSO 기능 추가 및 013 스펙 링크

---

## Dependencies & Execution Order

### Phase 의존성

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 시작, **US1·2·3 모두 블로킹**
- **Phase 3 (US1)**: Phase 2 완료 후 시작 — MVP 최소 단위
- **Phase 4 (US2)**: Phase 3 완료 후 시작 (T022가 T014의 `findOrCreateUser` 확장이므로)
- **Phase 5 (US3)**: Phase 2 완료 후 독립 시작 가능
- **Phase 6 (Polish)**: Phase 3·4·5 완료 후

### 병렬 실행 기회

```bash
# Phase 1: T002, T003, T004는 동시 실행 가능
# Phase 2: T007~T010 (ssoService 내 독립 함수), T011~T013 (다른 파일)
# Phase 3: T019/T020 (App.jsx), T021 (AuthForm.jsx) — 백엔드 T016~T018 완료 후
# Phase 6: T029, T030, T032 병렬
```

---

## Implementation Strategy

### MVP (Phase 1 + 2 + 3)

1. Phase 1: 환경변수 구조 설정
2. Phase 2: 백엔드 SSO 기반 레이어 구현
3. Phase 3: Google 신규 로그인 → JWT → 프론트 통합
4. **STOP & VALIDATE**: Google 로그인 → 노트 CRUD 전체 동작 확인
5. 기존 local 로그인 회귀 없음 확인

### 전체 완성 순서

Phase 1 → Phase 2 → Phase 3 (MVP) → Phase 4 (연결) → Phase 5 (세션) → Phase 6 (Polish)

---

## Notes

- 신규 npm 패키지 없음 — Node.js 22 내장 `fetch` 사용
- DB 스키마 변경 없음 — `provider`/`provider_id` 컬럼 이미 존재
- Google OAuth2 앱 등록(Client ID/Secret)은 사전 수동 설정 필요
- 모든 JSON 응답은 `{ success, data, error }` envelope 준수
