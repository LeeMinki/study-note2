# Study Note

Study Note는 개발 및 학습 내용을 빠르게 기록하고, 검색과 태그 필터링으로 다시 찾기 쉽게 만드는
단일 사용자 웹 애플리케이션이다.

현재 저장소는 Spec Kit 기반으로 기능 명세와 구현 계획을 먼저 정리하는 흐름으로 운영되고 있으며,
실제 애플리케이션 구현은 모노레포 구조를 전제로 준비되어 있다.

## 목적

- 개발 중 떠오른 내용을 빠르게 기록한다.
- 최근 노트를 빠르게 훑어본다.
- 태그와 검색으로 원하는 노트를 즉시 다시 찾는다.
- 초기에는 로컬 JSON 저장으로 시작하고, 나중에 저장소를 바꿔도 프론트엔드 전체를 뜯어고치지 않도록 유지한다.

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

현재 저장소에는 구현 전 단계 산출물이 정리되어 있다.

- 기능 명세: [`specs/001-study-note-app/spec.md`](specs/001-study-note-app/spec.md)
- 구현 계획: [`specs/001-study-note-app/plan.md`](specs/001-study-note-app/plan.md)
- 연구 메모: [`specs/001-study-note-app/research.md`](specs/001-study-note-app/research.md)
- 데이터 모델: [`specs/001-study-note-app/data-model.md`](specs/001-study-note-app/data-model.md)
- API 계약: [`specs/001-study-note-app/contracts/openapi.yaml`](specs/001-study-note-app/contracts/openapi.yaml)
- 실행 가이드: [`specs/001-study-note-app/quickstart.md`](specs/001-study-note-app/quickstart.md)

즉, 이 저장소는 지금 바로 완성된 앱 코드보다는 구현을 위한 설계 문서가 먼저 준비된 상태다.

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

## 구현 순서

구현은 아래 순서로 진행할 계획이다.

1. Core CRUD
2. 필터링/검색
3. Markdown 렌더링 보강

이 순서는 [`plan.md`](specs/001-study-note-app/plan.md)에 더 자세히 정리되어 있다.

## 실행 방식

아직 실제 애플리케이션 런타임 코드는 들어오지 않았기 때문에 지금 당장 `npm run dev`로 앱을 띄우는 단계는 아니다.
대신 구현 전 준비 문서를 바탕으로 다음 작업을 진행하는 저장소 상태다.

실제 구현이 시작되면 실행 흐름은 아래를 기준으로 한다.

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

자세한 예상 실행 절차와 수동 검증 순서는 [`quickstart.md`](specs/001-study-note-app/quickstart.md)를 참고하면 된다.

현재 저장소에는 기본 모노레포 디렉터리와 placeholder 엔트리 파일만 준비되어 있다.
React, Express, Axios, Markdown 렌더링 관련 패키지가 실제로 필요해지는 시점에는
설치를 진행하기 전에 반드시 사용자 승인을 먼저 요청한다.

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
5. 구현 및 PR 생성

필요한 경우 Jira 티켓과 GitHub PR을 연결하고, 작업 완료 후 Jira에 PR 링크를 남기는 운영 흐름도 함께 사용한다.
