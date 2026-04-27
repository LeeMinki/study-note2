# Implementation Plan: Security Hardening

**Branch**: `014-security-hardening` | **Date**: 2026-04-21 | **Spec**: [spec.md](spec.md)

## Summary

코드베이스 분석에서 발견된 실제 취약점을 위험도 순으로 수정한다. P1(즉시): 레거시 마이그레이션 코드 제거, CORS 와일드카드 제거, JWT_SECRET 필수화. P2(고위험): 인증 엔드포인트 속도 제한, 이미지 접근 제어. P3(자동화): CI 의존성 스캔 추가. 신규 npm 패키지 없이 Node.js 22 + 기존 의존성으로 구현.

## Technical Context

**Language/Version**: Node.js 22 (backend), React 19 (frontend)
**Primary Dependencies**: Express 5, better-sqlite3, jsonwebtoken, bcryptjs (기존 유지, 신규 패키지 없음)
**Storage**: SQLite — 스키마 변경 없음
**Testing**: Node.js 내장 test runner (`node --test`)
**Target Platform**: Linux (k3s), WSL Ubuntu (개발)
**Performance Goals**: 속도 제한 미들웨어 추가 지연 < 1ms
**Constraints**: 신규 npm 패키지 없음, 기능 회귀 없음

## Constitution Check

- ✅ **monorepo 경계**: 모든 보안 로직(CORS, 속도 제한, 이미지 인증)은 백엔드에서만 처리. 프론트엔드는 이미지 fetch+Blob URL 방식으로 변경하여 Authorization 헤더 전달
- ✅ **JSON envelope**: 429, 401 신규 응답 모두 `{ success, data, error }` 형식 준수
- ✅ **storage 소유권**: DB 접근은 기존 레포지터리 계층 유지. migrate.js 제거로 파일시스템 접근 경로 제거
- ✅ **naming**: 신규 파일 `rateLimitMiddleware.js` — 규칙 준수
- ✅ **신규 패키지**: 없음. 속도 제한은 in-process Map, 이미지 접근은 기존 `requireAuth` 미들웨어 재사용
- ✅ **WSL 친화**: 표준 npm/bash 흐름

## Project Structure

### Documentation (this feature)

```text
specs/014-security-hardening/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── security-api-contract.md
└── tasks.md
```

### Source Code 변경 범위

```text
backend/
  src/
    app.js                           [수정] CORS 강화, JWT_SECRET 검증, /uploads 라우트 변경
    db/
      migrate.js                     [삭제] 레거시 data.json/users.json 마이그레이션 코드 전체
    middleware/
      rateLimitMiddleware.js         [신규] in-process Map 기반 속도 제한 미들웨어
    routes/
      authRoutes.js                  [수정] 속도 제한 미들웨어 적용
      imageRoutes.js                 [수정] /uploads 정적 서빙 → 인증 라우트로 변경
    services/
      authService.js                 [수정] JWT_SECRET fallback 제거
      imageService.js                [수정] 파일명 sanitize 강화
    controllers/
      ssoController.js               [수정] JWT_SECRET fallback 제거 (공통 검증으로 통합)

frontend/
  src/
    hooks/
      useAuthenticatedImage.js       [신규] fetch+Blob URL 이미지 로딩 훅
    components/
      NoteViewer.jsx 또는            [수정] img 태그 → useAuthenticatedImage 사용
      해당 이미지 렌더링 컴포넌트

infra/
  kubernetes/study-note/base/
    configmap.yaml                   [수정] ALLOWED_ORIGINS 추가

.github/
  workflows/
    pr-checks.yml                    [수정] npm audit --audit-level=high 스텝 추가
```

## Phase 0: Research ✅

완료. [research.md](research.md) 참조.

핵심 결정:
- migrate.js 전체 삭제 (app.js startup hook 포함)
- CORS: `ALLOWED_ORIGINS` 환경변수로 관리
- JWT_SECRET: app.js 시작 시 단일 검증 후 `process.exit(1)`
- 속도 제한: in-process Map (신규 패키지 없음), 15분 창 / 최대 20회
- 이미지 접근: requireAuth 미들웨어 + 프론트엔드 fetch+Blob URL
- SSO 인증 경계: 현재 올바르게 구현됨, 추가 수정 불필요
- CI: `pr-checks.yml`에 npm audit 스텝 추가

## Phase 1: Design ✅

완료. [data-model.md](data-model.md), [contracts/security-api-contract.md](contracts/security-api-contract.md), [quickstart.md](quickstart.md) 참조.

## 구현 상세

### P1-A: migrate.js 삭제

```
삭제: backend/src/db/migrate.js
수정: backend/src/app.js
  - require('./db/migrate') 제거
  - migrate(db) 호출 제거
```

### P1-B: CORS 강화

```js
// app.js — 기존 와일드카드 미들웨어 교체
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 
  'https://study-note.yuna-pa.com,http://localhost:5173')
  .split(',').map(o => o.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  next();
});
```

### P1-C: JWT_SECRET 필수화

```js
// app.js — require.main === module 블록 최상단
if (!process.env.JWT_SECRET) {
  console.error('[보안] JWT_SECRET 환경변수가 설정되지 않았습니다. 서버를 시작할 수 없습니다.');
  process.exit(1);
}
```

```js
// authService.js — fallback 제거
const JWT_SECRET = process.env.JWT_SECRET; // fallback 없음

// ssoController.js — fallback 제거
const JWT_SECRET = process.env.JWT_SECRET; // fallback 없음
```

### P2-A: 속도 제한 미들웨어

```js
// middleware/rateLimitMiddleware.js
const store = new Map(); // Map<ip, { count, resetAt }>

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 20;

// 만료 항목 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (entry.resetAt < now) store.delete(ip);
  }
}, 5 * 60 * 1000).unref();

function rateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json(createErrorResponse('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'));
  }
  next();
}

module.exports = { rateLimit };
```

```js
// routes/authRoutes.js — 로그인/회원가입에 적용
const { rateLimit } = require('../middleware/rateLimitMiddleware');
router.post('/login', rateLimit, loginHandler);
router.post('/register', rateLimit, registerHandler);
```

### P2-B: 이미지 접근 제어

```js
// app.js — express.static 제거, 라우트로 교체
// 삭제: app.use("/uploads", express.static(...))
// 추가:
app.get("/uploads/:filename", requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename); // 경로 순회 방지
  const filePath = path.join(__dirname, '../uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json(createErrorResponse('이미지를 찾을 수 없습니다.'));
  }
  res.sendFile(filePath);
});
```

```js
// services/imageService.js — 파일명 sanitize
const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
const uniqueName = `${Date.now()}-${sanitizedName}`;
```

```js
// frontend/src/hooks/useAuthenticatedImages.js
// NoteCard.jsx는 dangerouslySetInnerHTML로 마크다운을 렌더링하므로
// 개별 img src를 React props로 제어할 수 없다.
// 대신 DOM ref를 받아 컨테이너 내 /uploads/ img 태그를 일괄 Blob URL로 교체한다.
import { useEffect } from 'react';

export function useAuthenticatedImages(containerRef) {
  useEffect(() => {
    if (!containerRef.current) return;
    const token = localStorage.getItem('study-note-token');
    const imgs = containerRef.current.querySelectorAll('img[src^="/uploads/"]');
    const objectUrls = [];

    imgs.forEach(img => {
      fetch(img.src, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          img.src = url;
        })
        .catch(() => {}); // 로드 실패 시 원본 src 유지
    });

    return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
  });
}
```

```jsx
// frontend/src/components/NoteCard.jsx — 적용 방법
import { useRef } from 'react';
import { useAuthenticatedImages } from '../hooks/useAuthenticatedImages';

// 컴포넌트 내:
const markdownRef = useRef(null);
useAuthenticatedImages(markdownRef);

// JSX:
<div ref={markdownRef} className="markdownBody"
  dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }} />
```

### P3: CI 의존성 스캔

```yaml
# .github/workflows/pr-checks.yml — 기존 스텝 뒤에 추가
- name: Audit backend dependencies
  working-directory: backend
  run: npm audit --audit-level=high

- name: Audit frontend dependencies
  working-directory: frontend
  run: npm audit --audit-level=high
```

## 환경변수

| 변수 | 위치 | 변경 내용 |
|------|------|----------|
| `JWT_SECRET` | k8s Secret | 미설정 시 서버 시작 중단 |
| `ALLOWED_ORIGINS` | k8s ConfigMap | 신규 추가: `https://study-note.yuna-pa.com` |
| `RATE_LIMIT_WINDOW_MS` | k8s ConfigMap (선택) | 신규 추가: 기본값 900000 (15분) |
| `RATE_LIMIT_MAX` | k8s ConfigMap (선택) | 신규 추가: 기본값 20 |

## 후속 보안 과제 (이번 범위 밖)

| 항목 | 이유 | 권장 시기 |
|------|------|----------|
| Content-Security-Policy | XSS 방어, 설정 복잡 | 다음 보안 이터레이션 |
| JWT 리프레시 토큰 | 현재 7일 만료 충분 | 사용자 증가 후 |
| 이미지 URL 서명 | Blob URL로 현재 충분 | 이미지 CDN 도입 시 |
| Helmet.js | CSP/HSTS 등 헤더 모음 | NEEDS USER APPROVAL 후 |
| 로그인 실패 알림 | 소규모에서 불필요 | 규모 성장 후 |

## 운영 체크리스트

1. `ALLOWED_ORIGINS` k8s ConfigMap 업데이트: `https://study-note.yuna-pa.com`
2. `JWT_SECRET` 설정 확인 (미설정 시 서버 시작 실패)
3. 배포 후 CORS 응답 헤더 확인
4. 배포 후 `/uploads/` 미인증 접근 → 401 확인
5. 배포 후 로그인 속도 제한 동작 확인 (429)
6. 기존 기능 회귀 테스트
