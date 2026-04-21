# Quickstart: 014 Security Hardening

## 로컬 개발 환경 설정

```bash
# backend/.env — 필수 항목 (JWT_SECRET 없으면 서버 시작 안 됨)
JWT_SECRET=local-dev-secret-min-32-chars-long
GOOGLE_CLIENT_ID=<Google Console에서 복사>
GOOGLE_CLIENT_SECRET=<Google Console에서 복사>
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/sso/google/callback
APP_BASE_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## 검증 시나리오

### 시나리오 1: 레거시 마이그레이션 제거 확인

```bash
# 서버 시작 로그에 마이그레이션 관련 메시지가 없어야 함
cd backend && npm run dev
# "[마이그레이션]" 로그가 출력되지 않음을 확인
grep -r "migrate\|data.json\|users.json" src/ --include="*.js"
# 결과 없어야 함
```

### 시나리오 2: CORS 정책 확인

```bash
# 허용 도메인: 정상 응답
curl -H "Origin: http://localhost:5173" \
  -I http://localhost:3001/api/health
# access-control-allow-origin: http://localhost:5173 확인

# 미허용 도메인: CORS 헤더 없음
curl -H "Origin: http://evil.example.com" \
  -I http://localhost:3001/api/health
# access-control-allow-origin 헤더 없음 확인
```

### 시나리오 3: JWT_SECRET 필수화

```bash
# JWT_SECRET 없이 시작 시도
JWT_SECRET= node src/app.js
# 오류 메시지와 함께 즉시 종료 확인
```

### 시나리오 4: 속도 제한

```bash
# 로그인 엔드포인트에 20회 초과 요청
for i in {1..25}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# 21번째 이후부터 429 확인
```

### 시나리오 5: 이미지 접근 제어

```bash
# 이미지 업로드 후 URL 확인
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.token')

# 미인증 접근
curl -I http://localhost:3001/uploads/some-image.png
# HTTP/1.1 401 확인

# 인증된 접근
curl -I -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/uploads/some-image.png
# HTTP/1.1 200 확인
```

### 시나리오 6: 기존 기능 회귀 없음

- [ ] 이메일/비밀번호 로그인 정상 동작
- [ ] Google SSO 로그인 정상 동작
- [ ] 노트 CRUD 정상 동작
- [ ] 이미지 업로드 및 노트 뷰어에서 이미지 표시 정상 동작
- [ ] 프로필 Google 계정 연결 정상 동작

## 운영 환경 배포 체크리스트

```bash
# 1. JWT_SECRET 설정 확인
kubectl get secret study-note-secret -n study-note -o jsonpath='{.data.JWT_SECRET}' | base64 -d | wc -c
# 0이면 설정 안 됨 — kubectl로 설정 필요

# 2. GOOGLE_CLIENT_ID/SECRET 설정 확인
kubectl get secret study-note-secret -n study-note -o jsonpath='{.data.GOOGLE_CLIENT_ID}' | base64 -d

# 3. ConfigMap ALLOWED_ORIGINS 확인
kubectl get configmap study-note-config -n study-note -o yaml | grep ALLOWED_ORIGINS

# 4. 배포 후 CORS 확인
curl -H "Origin: https://study-note.yuna-pa.com" \
  -I https://study-note.yuna-pa.com/api/health
# access-control-allow-origin: https://study-note.yuna-pa.com 확인

# 5. 미인증 이미지 접근 차단 확인
curl -I https://study-note.yuna-pa.com/uploads/<any-filename>
# HTTP/2 401 확인
```

## 보안 운영 가이드

### JWT_SECRET 관리
- 최소 32자 이상의 랜덤 문자열 사용
- 정기 교체 시 기존 로그인 토큰이 무효화됨 → 사용자 재로그인 필요
- 교체는 배포 시간 외 유지보수 시간에 수행

### ALLOWED_ORIGINS 관리
- ConfigMap의 `ALLOWED_ORIGINS`로 관리
- 추가 도메인 필요 시 ConfigMap 업데이트 후 롤링 재시작

### 속도 제한 조정
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` 환경변수로 조정
- 기본값: 15분 창, 최대 20회 (로그인), 10회 (회원가입)

### 의존성 취약점 모니터링
- PR 머지 시 CI에서 자동 스캔 실행
- high/critical 발견 시 CI 실패 → PR 즉시 확인 후 패치

## 후속 보안 과제 (이번 범위 밖)

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| Content-Security-Policy 헤더 | XSS 방어 헤더 추가 | 낮음 |
| HTTP Strict-Transport-Security | HSTS (현재 Ingress 처리) | 낮음 |
| JWT 리프레시 토큰 | 7일 만료 → 짧은 액세스 + 리프레시 토큰 | 중간 |
| 이미지 URL 서명 | Blob URL 대신 서명된 임시 URL | 낮음 |
| 로그인 실패 알림 | 연속 실패 시 알림 | 낮음 |
| SSO 세션 취소 | Google 앱 권한 취소 감지 | 낮음 |
