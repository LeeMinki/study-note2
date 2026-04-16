# Quickstart: 회원가입 검증 및 프로필 필드 확장

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

1. 회원가입 탭에 `name`, `displayName`, `email`, `password`, `passwordConfirm` 필드가 모두 보이는지 확인한다.
2. 비밀번호 확인이 다를 때 서버 요청 없이 오류가 표시되는지 확인한다.
3. 이름 또는 표시 이름이 비어 있을 때 제출이 막히는지 확인한다.
4. 정상 입력으로 회원가입 후 응답 기반 로그인 상태가 유지되는지 확인한다.
5. 이후 로그아웃하고 다시 로그인했을 때 `name`, `displayName`이 프로필/상단 UI에 유지되는지 확인한다.

## Notes

- `passwordConfirm`은 클라이언트 전용 필드이며 서버 저장 대상이 아니다.
- 서버는 `name`, `displayName`을 trim 후 저장한다.
