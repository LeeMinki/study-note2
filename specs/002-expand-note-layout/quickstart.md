# Quickstart: 노트 편집 레이아웃 확장

## Prerequisites

- WSL Ubuntu 또는 동등한 Linux shell 환경
- `backend/`, `frontend/` 의존성 설치 완료
- 인증 가능한 테스트 계정 1개

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

1. 브라우저에서 앱에 로그인한다.
2. 메인 노트 화면에서 NoteComposer 상단 레이아웃 전환 UI를 확인한다.
3. `wide`를 선택해 composer가 단일 열 전체 너비로 확장되는지 확인한다.
4. `default`를 선택해 기본 2열 레이아웃으로 복귀하는지 확인한다.
5. `narrow`를 선택해 composer 폭이 더 좁아지는지 확인한다.
6. 레이아웃 전환 중 작성 중이던 제목/본문/태그 입력값이 유지되는지 확인한다.
7. 페이지를 새로고침해 마지막 선택 레이아웃이 localStorage 기반으로 복원되는지 확인한다.

## Notes

- 현재 구현은 2단계가 아니라 `narrow/default/wide` 3단계 레이아웃을 지원한다.
- 레이아웃 선호는 프론트엔드 localStorage에만 저장되며 백엔드 API 호출은 발생하지 않는다.
