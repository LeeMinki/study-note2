# Tasks: Security Hardening

**Input**: Design documents from `/specs/014-security-hardening/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: 사용자 요청 순서(식별→위험도 분류→빠른 수정→레거시 제거→문서화)와 spec.md 우선순위(P1→P2→P3)를 맞춰 구성.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: 식별 (보안 점검)

**Purpose**: 코드베이스 전체에서 보안 취약점과 레거시 경로를 탐색하고 기록

- [X] T001 [P] 백엔드 인증/인가 흐름 점검 — JWT 발급·검증·만료 정책, requireAuth 적용 경로 목록화 in `backend/src/services/authService.js`, `backend/src/middleware/authMiddleware.js`, `backend/src/routes/`
- [X] T002 [P] SSO 인증 경계 점검 — `/api/auth/sso/*` 엔드포인트별 인증 필요 여부 확인, state 검증 로직 확인 in `backend/src/controllers/ssoController.js`, `backend/src/services/ssoService.js`
- [X] T003 [P] 입력 검증 및 민감정보 노출 점검 — 사용자 입력 검증 위치, 에러 응답에 스택트레이스/내부 경로 포함 여부 확인 in `backend/src/models/user.js`, `backend/src/models/note.js`, `backend/src/app.js`
- [X] T004 [P] 레거시 data.json/users.json 마이그레이션 코드 탐색 — migrate.js 존재 확인, app.js 내 startup hook 호출 위치 기록 in `backend/src/db/migrate.js`, `backend/src/app.js`
- [X] T005 [P] secret/env 관리 점검 — JWT_SECRET fallback 패턴 위치, .env.example 존재 및 필수 항목 확인 in `backend/src/services/authService.js`, `backend/src/controllers/ssoController.js`, `backend/.env.example`
- [X] T006 [P] CORS 설정 점검 — 와일드카드 사용 여부 확인 in `backend/src/app.js`
- [X] T007 [P] 이미지 업로드 접근 제어 점검 — `/uploads` 정적 서빙 인증 여부 확인, 파일명 sanitize 여부 확인 in `backend/src/app.js`, `backend/src/services/imageService.js`
- [X] T008 [P] 인프라/배포 설정 점검 — ConfigMap/Secret 항목 확인, CI 워크플로우에 보안 스캔 단계 유무 확인 in `infra/kubernetes/study-note/base/configmap.yaml`, `.github/workflows/pr-checks.yml`
- [X] T009 [P] 의존성 취약점 점검 — `npm audit` 실행 (백엔드/프론트엔드) 결과 기록

---

## Phase 2: 위험도 분류 (점검 결과 정리)

**Purpose**: Phase 1 점검 결과를 P1/P2/P3로 분류하고 수정 순서 확정

**⚠️ NOTE**: Phase 1 완료 후 진행. research.md의 분석 결과 활용.

- [X] T010 `specs/014-security-hardening/research.md`의 우선순위 분류(P1/P2/P3)가 Phase 1 점검 결과와 일치하는지 확인 — 불일치 발견 시 research.md 보완 (이미 사전 분석 완료, 대부분 확인만 필요)

---

## Phase 3: P1 빠른 수정 — 레거시 마이그레이션 제거 (US1)

**Story Goal**: 서버 시작 시 data.json/users.json 기반 마이그레이션이 실행되지 않는다

**Independent Test**: 서버 시작 로그에 "[마이그레이션]" 문자열이 없고, `grep -r "data.json\|users.json\|migrate" backend/src` 결과가 없다

- [X] T011 [US1] `backend/src/db/migrate.js` 파일 전체 삭제
- [X] T012 [US1] `backend/src/app.js`에서 `require('./db/migrate')` import 제거 및 `migrate(db)` 호출 제거
- [X] T013 [US1] 서버 시작 후 마이그레이션 로그 없음 확인 — `npm run dev` 실행 결과 검증

---

## Phase 4: P1 빠른 수정 — CORS 강화 (US2)

**Story Goal**: 허용된 도메인에서만 API 요청이 가능하다

**Independent Test**: `curl -H "Origin: http://evil.example.com" -I localhost:3001/api/health` 응답에 `access-control-allow-origin` 헤더가 없다

- [X] T014 [US2] `backend/src/app.js` CORS 미들웨어를 `ALLOWED_ORIGINS` 환경변수 기반으로 교체 — `Access-Control-Allow-Origin: *` 제거, `Vary: Origin` 헤더 추가
- [X] T015 [US2] `infra/kubernetes/study-note/base/configmap.yaml`에 `ALLOWED_ORIGINS: https://study-note.yuna-pa.com` 추가
- [X] T016 [US2] `backend/.env.example`에 `ALLOWED_ORIGINS` 항목 추가

---

## Phase 5: P1 빠른 수정 — JWT_SECRET 필수화 및 SSO 인증 경계 (US3)

**Story Goal**: JWT_SECRET 미설정 시 서버 시작 중단. SSO 인증 경계 일관성 확보.

**Independent Test**: `JWT_SECRET= node src/app.js` 실행 시 오류 메시지와 함께 즉시 종료

- [X] T017 [P] [US3] `backend/src/app.js`의 `require.main === module` 블록 최상단에 `JWT_SECRET` 환경변수 존재 검증 추가 — 없으면 에러 메시지 출력 후 `process.exit(1)`
- [X] T018 [P] [US3] `backend/src/services/authService.js`에서 `JWT_SECRET` fallback 값 제거 — `const JWT_SECRET = process.env.JWT_SECRET` (fallback 없음)
- [X] T019 [P] [US3] `backend/src/controllers/ssoController.js`에서 `JWT_SECRET` fallback 값 제거 — `const JWT_SECRET = process.env.JWT_SECRET` (fallback 없음)
- [X] T020 [US3] SSO 콜백에서 유효하지 않은 state 전달 시 안전하게 거부되는지 기존 동작 확인 및 문서화 in `backend/src/controllers/ssoController.js`

---

## Phase 6: P2 수정 — 인증 엔드포인트 속도 제한 (US4)

**Story Goal**: 로그인/회원가입 엔드포인트에 IP 기반 속도 제한이 적용된다

**Independent Test**: 로그인 엔드포인트에 21회 연속 요청 시 429 응답 반환

- [X] T021 [US4] `backend/src/middleware/rateLimitMiddleware.js` 신규 생성 — in-process Map 기반 속도 제한 미들웨어 (신규 패키지 없음), `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX` 환경변수 지원, `Retry-After` 헤더 포함, 만료 항목 setInterval 정리
- [X] T022 [US4] `backend/src/routes/authRoutes.js`에 로그인(`POST /login`)과 회원가입(`POST /register`) 라우트에 `rateLimit` 미들웨어 적용
- [X] T023 [US4] 429 응답이 `{ success: false, data: null, error: "..." }` envelope를 따르는지 확인

---

## Phase 7: P2 수정 — 이미지 접근 제어 (US5)

**Story Goal**: `/uploads` 이미지를 인증 없이 직접 접근할 수 없다

**Independent Test**: 미인증 `GET /uploads/<filename>` → 401 응답

- [X] T024 [US5] `backend/src/app.js`에서 `express.static("/uploads")` 제거, `requireAuth` 미들웨어를 통과하는 `GET /uploads/:filename` 라우트로 교체 — `path.basename()` 경로 순회 방지, 404 시 JSON envelope 응답
- [X] T025 [US5] `backend/src/services/imageService.js` 파일명 sanitize 강화 — `path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_')` 적용
- [X] T026 [US5] `frontend/src/hooks/useAuthenticatedImages.js` 신규 생성 — DOM ref를 받아 컨테이너 내 `/uploads/` img 태그를 fetch+Blob URL로 교체하는 훅, localStorage `study-note-token` 사용, cleanup 시 `URL.revokeObjectURL` 호출
- [X] T027 [US5] `frontend/src/components/NoteCard.jsx`에서 `.markdownBody` ref 추가 후 `useAuthenticatedImages` 훅 적용 — `dangerouslySetInnerHTML` 렌더링 후 useEffect로 `/uploads/` src를 가진 img 태그들을 Blob URL로 교체 (renderMarkdown.js는 변경 불필요, NoteCard.jsx만 수정)

---

## Phase 8: P3 수정 — CI 의존성 취약점 스캔 (US6)

**Story Goal**: PR CI에서 의존성 취약점이 자동으로 감지된다

**Independent Test**: `.github/workflows/pr-checks.yml`에 `npm audit` 스텝이 존재하고, CI에서 실행된다

- [X] T028 [US6] `.github/workflows/pr-checks.yml`에 `npm audit --audit-level=high` 스텝 추가 — 백엔드, 프론트엔드 각각 (기존 `npm ci` 스텝 뒤에 추가)

---

## Phase 9: 문서화 및 마무리

**Purpose**: 운영 가이드, 보안 체크리스트, 후속 과제 정리

- [X] T029 [P] `infra/docs/secrets.md`에 신규 환경변수(`ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`) 항목 추가 및 JWT_SECRET 필수화 정책 업데이트
- [X] T030 [P] `backend/.env.example` 최종 검토 — `JWT_SECRET` 필수 표시(미설정 시 시작 불가), T016/T021에서 추가된 항목 누락 없는지 확인 및 보완
- [X] T031 [P] `specs/014-security-hardening/quickstart.md` 최종 확인 및 운영 체크리스트 업데이트
- [X] T032 기존 기능 회귀 테스트 — 로그인, SSO 로그인, 노트 CRUD, 이미지 업로드/조회, 프로필 Google 계정 연결 전 흐름 수동 검증

---

## Dependencies

```
Phase 1 (T001-T009) → Phase 2 (T010) → Phase 3-5 (T011-T020) → Phase 6-8 (T021-T028) → Phase 9 (T029-T032)

Phase 1 내: T001-T009 전부 병렬 가능 [P]
Phase 3-5 내:
  - T011 → T012 → T013 (순차, 같은 파일)
  - T017, T018, T019 병렬 가능 [P]
Phase 7 내:
  - T024, T025, T026 병렬 가능 [P]
  - T027은 T026 완료 후 (훅 사용)
Phase 9 내:
  - T029, T030, T031 병렬 가능 [P]
  - T032는 T021-T031 완료 후 (최종 검증)
```

## Parallel Execution Examples

**Phase 1 병렬 실행** (독립적 점검):
```
T001 || T002 || T003 || T004 || T005 || T006 || T007 || T008 || T009
```

**Phase 3-5 병렬 실행** (P1 수정 — 서로 다른 파일):
```
T014 || T017 || T018 || T019  (CORS, JWT 검증 각각 독립)
T011 → T012 → T013            (migrate.js 삭제 순차)
```

**Phase 6-8 병렬 실행** (P2/P3 — 서로 다른 영역):
```
T021 → T022 → T023  (속도 제한 순차)
T024 || T025 || T026  (이미지 접근 제어 병렬)
T028                  (CI 스캔 독립)
```

## Implementation Strategy

**MVP 범위 (즉시 배포 가능)**: Phase 3 + Phase 4 + Phase 5 (T011-T020)
- migrate.js 삭제 → CORS 강화 → JWT_SECRET 필수화
- 단독으로 배포 가능, 기능 영향 없음
- 가장 빠르게 최대 보안 효과

**2차 배포**: Phase 6 + Phase 7 + Phase 8 (T021-T028)
- 속도 제한 + 이미지 접근 제어 + CI 스캔
- 프론트엔드 변경 포함 (이미지 Blob URL)

**마무리**: Phase 9 (T029-T032)
- 문서 업데이트 및 회귀 테스트
