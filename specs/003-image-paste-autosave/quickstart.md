# Quickstart: 이미지 붙여넣기 및 자동 임시저장

## Prerequisites

- WSL Ubuntu 또는 동등한 Linux shell 환경
- `backend/`, `frontend/` 의존성 설치 완료
- 로그인 가능한 테스트 계정 1개
- 클립보드에 복사할 PNG/JPEG/GIF/WebP 이미지

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

### 이미지 붙여넣기

1. 브라우저에서 앱에 로그인한다.
2. NoteComposer의 내용 textarea에 포커스를 둔다.
3. 클립보드 이미지를 붙여넣어 `![업로드 중...]` 플레이스홀더가 먼저 들어가는지 확인한다.
4. 업로드 완료 후 플레이스홀더가 실제 `![image](...)` 마크다운 링크로 바뀌는지 확인한다.
5. 노트를 저장하고 카드 렌더링 영역에서 이미지가 실제로 보이는지 확인한다.

### 자동 임시저장

1. 새 노트를 작성하다가 저장하지 않고 3초 이상 멈춘다.
2. 페이지를 새로고침한다.
3. draft 복원 배너가 표시되고, 복원 시 제목/본문/태그가 되살아나는지 확인한다.
4. 삭제/무시 동작 시 draft가 제거되는지 확인한다.
5. 노트를 정상 저장한 뒤에는 draft가 비워져 다음 작성 시 빈 폼으로 시작하는지 확인한다.

## Notes

- 현재 이미지 업로드 API는 인증 보호 상태이므로 로그인 없이 검증할 수 없다.
- 업로드된 파일은 `backend/uploads/`에 저장되고 `/uploads/...` 경로로 정적 서빙된다.
