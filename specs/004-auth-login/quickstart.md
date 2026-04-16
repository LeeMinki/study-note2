# Quickstart: 로그인/회원가입 및 계정별 노트 분리

## Setup

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## Manual Verification

1. 회원가입 탭에서 새 계정을 생성하고 즉시 메인 화면으로 진입하는지 확인한다.
2. 로그아웃 후 같은 계정으로 다시 로그인되는지 확인한다.
3. 다른 계정을 하나 더 생성한다.
4. 계정 A로 노트를 작성한 뒤 로그아웃하고 계정 B로 로그인한다.
5. 계정 B에서 계정 A의 노트가 보이지 않는지 확인한다.
6. 브라우저 새로고침 후 유효 토큰이 있으면 인증 상태가 복원되는지 확인한다.
7. 인증 없이 노트 API에 접근하면 401이 반환되는지 확인한다.

## Notes

- 현재 인증 토큰은 localStorage `study-note-token`에 저장된다.
- `users.json`은 로컬 파일 저장소이며, 비밀번호 평문은 저장하지 않는다.
