# Quickstart: 계정 프로필 UI 및 상세정보 화면

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

1. 로그인 후 메인 화면 상단의 프로필 버튼을 클릭한다.
2. 전체 화면 프로필 뷰가 열리고 이메일, 가입일, provider가 표시되는지 확인한다.
3. `name`, `displayName`을 수정해 저장하고 성공 메시지가 보이는지 확인한다.
4. 새로고침 후 수정한 프로필 값이 유지되는지 확인한다.
5. 메인으로 돌아가기를 눌렀을 때 노트 화면으로 복귀하는지 확인한다.
6. 토큰이 무효한 상태로 `/api/auth/me` 요청이 실패하면 인증 화면으로 돌아가는지 확인한다.

## Notes

- 프로필 화면은 별도 라우터가 아니라 `App.jsx` 내부 조건부 렌더링으로 동작한다.
- 이메일과 가입일은 읽기 전용이다.
