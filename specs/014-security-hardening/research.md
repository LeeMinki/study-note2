# Research: 014 Security Hardening

## 점검 결과 요약

코드베이스 분석을 통해 발견된 실제 취약점과 기술 결정을 기록한다.

---

## 1. 레거시 마이그레이션 경로

**Decision**: `backend/src/db/migrate.js` 전체 삭제, `app.js`의 `require('./db/migrate')` 및 `migrate(db)` 호출 제거

**Findings**:
- `migrate.js`는 서버 시작마다 `STUDY_NOTE_DATA_DIR`(또는 기본값) 경로에서 `users.json`, `data.json`을 읽어 DB에 삽입한다
- 파일이 없으면 "건너뜀" 로그 후 종료 — 운영 환경에서는 항상 이 경로를 타는 불필요한 코드
- `STUDY_NOTE_DATA_DIR` 환경변수가 조작되거나 해당 경로에 임의 JSON이 존재하면 DB 주입 가능
- DB 마이그레이션은 이미 완료되어 운영 환경에 해당 JSON 파일 없음

**Rationale**: 코드 삭제로 공격 표면 제거. DB 스키마는 `db/index.js`의 `initialize()`가 처리하므로 별도 마이그레이션 불필요.

**Alternatives considered**: 환경변수로 비활성화 — 코드 남음 자체가 리스크이므로 삭제 선택.

---

## 2. CORS 정책

**Decision**: 환경변수 `ALLOWED_ORIGINS`로 허용 출처 관리. 기본값: `https://study-note.yuna-pa.com,http://localhost:5173`

**Findings**:
- `app.js` CORS 미들웨어가 `Access-Control-Allow-Origin: *` 반환
- 인증된 요청에 대해 임의 도메인이 브라우저 CORS 제한을 우회 가능

**Rationale**: `Origin` 헤더를 허용 목록과 비교해 일치 시만 반영. 와일드카드 완전 제거.

---

## 3. JWT_SECRET 필수화

**Decision**: `authService.js`와 `ssoController.js` 양쪽에서 시작 시 `JWT_SECRET` 부재를 감지해 `process.exit(1)`

**Findings**:
- **두 파일 모두** `process.env.JWT_SECRET || 'study-note-dev-secret-change-in-production'` 패턴 사용
- fallback 값이 공개 코드에 노출되어 있어 운영 환경에서 미설정 시 JWT 위조 가능
- 공통 검증 유틸리티를 만들어 중복 제거

**Rationale**: 서버 시작 전 fail-fast로 미설정 환경 즉시 감지. `app.js`의 `require.main === module` 블록에서 한 번만 검증.

---

## 4. 속도 제한 (Rate Limiting)

**Decision**: 신규 패키지 없이 in-process Map 구현. 미들웨어로 `authRoutes`에 적용.

**Findings**:
- `npm audit` 결과 취약점 0건 — 현재 의존성 안전
- 로그인/회원가입 엔드포인트에 실패 횟수 제한 없음
- `express-rate-limit` 패키지 미승인 상태

**Implementation strategy**:
```
Map<ip, { count, resetAt }>
- window: 15분
- max: 20 요청 (로그인), 10 요청 (회원가입)
- 초과 시 429 + Retry-After 헤더
- setInterval로 만료 항목 주기적 정리
```

**Alternatives considered**: `express-rate-limit` 패키지 — 더 견고하지만 신규 패키지 승인 필요. in-process Map으로 MVP 충분.

---

## 5. 업로드 이미지 접근 제어

**Decision**: `express.static` 제거 → `requireAuth` 미들웨어를 통과하는 GET 라우트로 교체. 프론트엔드는 `<img>` 태그 대신 fetch+Blob URL 방식으로 변경.

**Findings**:
- 현재 `app.use("/uploads", express.static(...))` — JWT 없이 URL만 알면 접근 가능
- 노트 내용(인증 필요)과 첨부 이미지(공개)의 불일치

**Frontend impact**: 노트 에디터에서 이미지를 렌더링하는 `<img src="/uploads/...">` 태그들이 Bearer 토큰을 전달하지 못한다. 해결 방법:
- Blob URL 캐시: 컴포넌트 마운트 시 fetch로 이미지 로드 → `URL.createObjectURL()` → `<img src={blobUrl}>`

**Rationale**: 인증된 사용자만 자신의 노트 이미지에 접근하는 일관된 보안 경계 확립.

**File name safety**: 현재 `${Date.now()}-${file.originalname}` 패턴에서 `originalname`에 경로 구분자가 포함될 수 있음. `path.basename()` 적용 + 영숫자/점/하이픈만 허용하는 sanitize 추가.

---

## 6. CI 의존성 취약점 스캔

**Decision**: `pr-checks.yml`에 `npm audit --audit-level=high` 스텝 추가 (백엔드, 프론트엔드 각각).

**Findings**:
- 현재 `pr-checks.yml`에 `npm test`, `npm run build` 스텝 존재 — `npm audit` 스텝 없음
- `npm audit`은 별도 설치 없이 npm에 내장됨

**Rationale**: 기존 CI 구조에 스텝 추가로 자동 감지. high/critical만 실패 처리해 false positive 최소화.

---

## 7. SSO 인증 경계 점검 결과

**Findings**:
- `GET /api/auth/sso/:provider` — 인증 불필요 (올바름: 로그인 시작점)
- `POST /api/auth/sso/:provider/link-start` — `requireAuth` 적용됨 (올바름)
- `GET /api/auth/sso/:provider/callback` — 인증 불필요 (올바름: Google이 호출)
- `GET /api/auth/me`, `PATCH /api/auth/me`, `PATCH /api/auth/me/password` — `requireAuth` 적용됨 (올바름)
- CSRF: state 파라미터로 방어, `validateAndConsumeState`가 재사용 방지 (올바름)
- SSO-only 계정 local 로그인 차단 구현됨 (올바름)

**결론**: SSO 인증 경계 자체는 올바르게 구현되어 있음. 추가 수정 불필요.

---

## 8. 의존성 취약점 현황

**Findings**:
- `npm audit` 기준 취약점 0건 (2026-04-21 기준)
- 패키지 버전 업그레이드는 이번 범위 밖

**Rationale**: CI 자동 스캔 추가로 향후 취약점 조기 감지.
