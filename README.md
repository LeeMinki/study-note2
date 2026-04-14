# Study Note

Study Note는 개발 및 학습 내용을 빠르게 기록하고, 검색과 태그 필터링으로 다시 찾기 쉽게 만드는
웹 애플리케이션이다.

저장소는 Spec Kit 기반으로 기능 명세와 구현 계획을 먼저 정리한 뒤, 실제 코드를 같은 모노레포 안에서
구현하는 흐름으로 운영된다.

## 목적

- 개발 중 떠오른 내용을 빠르게 기록한다.
- 최근 노트를 빠르게 훑어본다.
- 태그와 검색으로 원하는 노트를 즉시 다시 찾는다.
- 로컬 JSON 저장으로 시작하고, 나중에 저장소를 바꿔도 프론트엔드 전체를 뜯어고치지 않도록 유지한다.

## 아키텍처 원칙

- 저장소는 `frontend/` 와 `backend/` 로 분리된 모노레포 구조를 따른다.
- frontend는 backend 소스를 직접 import 하지 않는다.
- frontend와 backend는 반드시 HTTP API로만 통신한다.
- 데이터 접근과 파일 저장 책임은 모두 backend가 가진다.
- backend의 모든 JSON 응답은 아래 envelope을 따른다.

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## 현재 상태

현재 저장소에는 Spec Kit 산출물과 실제 애플리케이션 코드가 함께 들어 있다.

- 프론트엔드: `frontend/` React + Vite
- 백엔드: `backend/` Express
- 저장소: `backend/data.json`, `backend/users.json`, `backend/uploads/`
- 인증: JWT 기반 로그인/회원가입, 계정별 노트 분리
- 노트 기능: CRUD, 검색, 태그 필터, 이미지 붙여넣기, 마크다운 이미지 렌더링, 자동 임시저장

- 기능 명세: [`specs/001-study-note-app/spec.md`](specs/001-study-note-app/spec.md)
- 구현 계획: [`specs/001-study-note-app/plan.md`](specs/001-study-note-app/plan.md)
- 연구 메모: [`specs/001-study-note-app/research.md`](specs/001-study-note-app/research.md)
- 데이터 모델: [`specs/001-study-note-app/data-model.md`](specs/001-study-note-app/data-model.md)
- API 계약: [`specs/001-study-note-app/contracts/openapi.yaml`](specs/001-study-note-app/contracts/openapi.yaml)
- 실행 가이드: [`specs/001-study-note-app/quickstart.md`](specs/001-study-note-app/quickstart.md)
- 후속 기능 스펙:
  [`specs/002-expand-note-layout`](specs/002-expand-note-layout),
  [`specs/003-image-paste-autosave`](specs/003-image-paste-autosave),
  [`specs/004-auth-login`](specs/004-auth-login)

## 예정 구조

```text
backend/
  src/
    routes/
    controllers/
    services/
    repositories/
    utils/
  data.json

frontend/
  src/
    components/
    services/
    hooks/
    utils/
    styles/
```

## 핵심 기능 범위

- 노트 작성/수정/삭제
- Markdown 입력 및 렌더링 표시
- 태그 정규화 및 태그 클릭 필터링
- 제목/본문 검색
- 검색과 태그 필터의 동시 적용
- 목록 카드에 제목, 시간, 태그, 내용 미리보기 표시
- 카드 내부 인라인 편집
- `Ctrl + Enter`, `Cmd + Enter` 저장 지원

## 구현된 범위

현재 `main` 기준으로 아래 기능이 반영되어 있다.

1. 노트 작성/수정/삭제
2. 제목/본문 검색
3. 태그 정규화 및 태그 필터
4. 마크다운 렌더링
5. 이미지 붙여넣기 업로드 및 이미지 렌더링
6. 자동 임시저장 및 복원
7. JWT 로그인/회원가입
8. 계정별 노트 분리

## 실행 방식

fresh clone 직후에는 각 앱 디렉터리에서 먼저 의존성을 설치해야 한다.
`node_modules`는 저장소에 포함하지 않는 것을 원칙으로 하므로, 설치 없이 바로 `npm run dev`를 실행하면
`Cannot find module 'express'`, `vite: not found` 같은 오류가 발생할 수 있다.

실행 흐름은 아래 순서를 기준으로 한다.

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

기본 포트는 프론트엔드 `5173`, 백엔드 `3001`이며, 프론트엔드는 `VITE_API_BASE_URL`이 없으면
`http://localhost:3001`을 사용한다.

자세한 실행 절차와 수동 검증 순서는 [`quickstart.md`](specs/001-study-note-app/quickstart.md)를 참고하면 된다.

## 의존성 정책

- 새로운 패키지가 필요하면 자동 설치하지 않는다.
- 먼저 사용자 승인 요청을 해야 한다.
- 가능한 한 기존 의존성과 기본 기능을 우선 사용한다.

예를 들어 Markdown 렌더링을 위해 외부 패키지가 필요해 보이면, 바로 설치하지 않고 먼저 승인부터 받아야 한다.

## 개발 환경

- 기본 개발 환경: WSL Ubuntu
- shell 친화적인 Linux/WSL 흐름을 우선한다.
- 줄바꿈은 LF 기준으로 유지한다.

## 작업 흐름

이 저장소는 Spec Kit 기반 워크플로를 따른다.

일반적인 진행 순서는 아래와 같다.

1. `specify`로 기능 명세 작성
2. `clarify`로 애매한 요구사항 확정
3. `plan`으로 설계 산출물 생성
4. `tasks`로 구현 작업 분해
5. 구현 및 검증
6. PR 생성 및 병합
7. Jira 이슈 업데이트/종료

필요한 경우 Jira 티켓과 GitHub PR을 연결하고, 작업 완료 후 Jira에 PR 링크를 남기는 운영 흐름도 함께 사용한다.
