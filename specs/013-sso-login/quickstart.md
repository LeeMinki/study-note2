# Quickstart: 013 SSO Login

## 사전 조건

- Google Cloud Console에서 OAuth2 앱 등록 완료
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 확보
- 승인된 리다이렉트 URI: `https://study-note.yuna-pa.com/api/auth/sso/google/callback`
- 로컬 테스트용 추가 URI: `http://localhost:3001/api/auth/sso/google/callback`

## 로컬 개발 환경 설정

```bash
# backend/.env (또는 환경변수 직접 설정)
GOOGLE_CLIENT_ID=<Google Console에서 복사>
GOOGLE_CLIENT_SECRET=<Google Console에서 복사>
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/sso/google/callback
APP_BASE_URL=http://localhost:5173
```

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## 시나리오 1: 신규 SSO 사용자 최초 로그인

1. `http://localhost:5173` 접속 → 로그인 화면 확인
2. "Google로 로그인" 버튼 클릭
3. Google 계정 선택 및 권한 허용
4. Study Note 메인 화면 진입 확인
5. 노트 작성 → DB에 `user_id`로 연결되어 저장됨 확인

**검증**:
```bash
# DB에서 SSO 계정 확인
sqlite3 backend/study-note.db "SELECT id, email, provider, provider_id FROM users;"
```

## 시나리오 2: 기존 local 계정과 SSO 연결

1. 먼저 이메일/비밀번호로 계정 생성 후 노트 2개 작성
2. 로그아웃
3. 동일 이메일의 Google 계정으로 SSO 로그인
4. 기존 노트 2개가 그대로 보이는지 확인
5. 이메일/비밀번호로도 로그인 가능한지 확인 (두 방법 모두 허용)

**DB 확인**:
```bash
sqlite3 backend/study-note.db "SELECT provider, provider_id, password_hash IS NOT NULL as has_pwd FROM users WHERE email='<your-email>';"
# provider=google, provider_id=<sub>, has_pwd=1 이면 연결 성공
```

## 시나리오 3: SSO 취소 흐름

1. "Google로 로그인" 클릭
2. Google 인증 화면에서 "취소" 클릭
3. Study Note 로그인 화면으로 복귀 확인
4. 오류 메시지 표시 확인

## 시나리오 4: SSO 전용 계정에 local 비밀번호 로그인 시도

1. Google SSO로만 가입한 계정의 이메일로 비밀번호 로그인 시도
2. "이 계정은 Google 로그인을 사용합니다" 오류 메시지 확인

## Kubernetes 운영 환경 배포

```bash
# 1. Google OAuth2 시크릿 생성
kubectl create secret generic study-note-google-oauth \
  --namespace study-note \
  --from-literal=GOOGLE_CLIENT_ID='<value>' \
  --from-literal=GOOGLE_CLIENT_SECRET='<value>'

# 2. ConfigMap에 callback URL 추가 (kustomization 또는 직접)
kubectl patch configmap study-note-config -n study-note \
  --patch '{"data":{"GOOGLE_CALLBACK_URL":"https://study-note.yuna-pa.com/api/auth/sso/google/callback","APP_BASE_URL":"https://study-note.yuna-pa.com"}}'

# 3. 배포 후 동작 확인
curl -I https://study-note.yuna-pa.com/api/auth/sso/google
# HTTP/1.1 302 Found, Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

## 회귀 테스트 체크리스트

- [ ] 기존 이메일/비밀번호 로그인 정상 동작
- [ ] 기존 회원가입 정상 동작
- [ ] SSO 신규 계정 생성 후 노트 CRUD
- [ ] SSO + local 연결 계정 양쪽 로그인
- [ ] SSO 로그아웃 후 재접근 시 로그인 화면
- [ ] SSO 취소 시 로그인 화면 복귀 및 오류 메시지
