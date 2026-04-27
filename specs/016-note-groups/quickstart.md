# Quickstart: Note Groups

## 전제 조건

- Node.js 22, npm
- 기존 backend/frontend 의존성 설치 완료
- `JWT_SECRET` 설정
- SQLite DB 사용 가능
- 신규 패키지 설치 없음

## 1. 로컬 백엔드 실행

```bash
cd backend
export JWT_SECRET=test-secret-for-local-dev-min-32-chars
export STUDY_NOTE_DB_FILE=/tmp/study-note-groups.db
npm install
npm start
```

확인:

```bash
curl -sS http://localhost:3001/api/health
```

## 2. 로컬 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 3. 수동 검증 흐름

### S1. 그룹 생성/목록

1. 로그인 또는 회원가입한다.
2. 프로필 버튼 옆의 `그룹 관리`를 눌러 그룹 관리 화면으로 이동한다.
3. 그룹 관리 화면에서 `AWS` 그룹을 생성한다.
4. 그룹 목록에 `AWS`가 표시되는지 확인한다.
5. `backend` 그룹도 생성한다.
6. 그룹 목록이 이름 오름차순으로 표시되는지 확인한다.

Expected:

- 그룹은 현재 사용자에게만 표시된다.
- 이름은 trim된 값으로 저장된다.
- 빈 이름은 저장되지 않는다.

### S1-1. 노트 작성 중 그룹 생성

1. 새 노트 작성 영역을 확인한다.
2. 제목 입력 전에 표시되는 그룹 선택 영역에서 새 그룹 이름을 입력한다.
3. `그룹 추가`를 누른다.

Expected:

- 새 그룹이 생성된다.
- 생성된 그룹이 작성 중인 노트의 선택 그룹으로 즉시 지정된다.

### S2. 그룹 이름 중복

1. `AWS` 그룹이 있는 상태에서 `aws` 또는 ` AWS `를 생성한다.

Expected:

- 같은 계정 안에서는 중복 오류가 표시된다.
- 오류 문구는 `이미 같은 이름의 그룹이 있습니다. 다른 이름을 입력해주세요.`처럼 사용자 친화적인 한국어로 표시된다.
- 다른 계정에서는 같은 그룹 이름을 사용할 수 있다.

### S2-1. 그룹별 노트 확인

1. `AWS` 그룹에 노트를 1개 이상 저장한다.
2. `그룹 관리` 화면으로 이동한다.
3. `AWS` 그룹 행을 클릭해 펼친다.
4. 표시된 노트 제목을 클릭한다.

Expected:

- 펼쳐진 그룹 아래에 해당 그룹의 노트 제목이 표시된다.
- 노트 제목을 클릭하면 본문 미리보기가 인라인으로 표시된다.

### S3. 노트에 그룹 할당

1. 새 노트를 작성한다.
2. 그룹 선택에서 `AWS`를 선택한다.
3. 저장한다.
4. 노트 카드에 `AWS` 그룹이 표시되는지 확인한다.

Expected:

- 태그는 기존 방식대로 유지된다.
- 그룹은 태그와 별도로 표시된다.

### S4. 노트 그룹 변경/해제

1. 기존 노트를 편집한다.
2. 그룹을 `backend`로 변경하고 저장한다.
3. 다시 편집해 그룹 없음으로 변경하고 저장한다.

Expected:

- 노트는 한 번에 하나의 그룹에만 속한다.
- 그룹 없음 상태도 정상 표시된다.
- Ctrl/Cmd + Enter 저장 동작은 유지된다.

### S5. 그룹 필터 + 검색 + 태그

1. 서로 다른 그룹과 태그를 가진 노트를 여러 개 만든다.
2. 그룹 필터를 선택한다.
3. 검색어를 입력한다.
4. 태그를 선택한다.

Expected:

- 그룹, 검색어, 태그 조건을 모두 만족하는 노트만 표시된다.
- 정렬은 최신순이다.
- 결과가 없으면 명확한 empty state가 표시된다.

### S6. 그룹 없음 필터

1. 그룹 없는 노트를 만든다.
2. 그룹 없음 필터를 선택한다.

Expected:

- 어떤 그룹에도 속하지 않은 노트만 표시된다.

### S7. 그룹 삭제

1. 노트가 들어 있는 그룹을 삭제한다.
2. 그룹 없음 필터를 선택한다.

Expected:

- 그룹은 목록에서 사라진다.
- 해당 그룹의 노트는 삭제되지 않는다.
- 해당 노트는 그룹 없음 상태로 표시된다.

### S8. 계정 격리

1. 사용자 A로 그룹과 노트를 만든다.
2. 로그아웃 후 사용자 B로 로그인한다.
3. 그룹 목록과 노트 목록을 확인한다.

Expected:

- 사용자 B는 사용자 A의 그룹을 볼 수 없다.
- 사용자 B는 사용자 A의 그룹을 자신의 노트에 할당할 수 없다.

### S9. 60초 핵심 흐름 확인

1. 새 그룹을 생성한다.
2. 새 노트를 작성하면서 해당 그룹을 선택한다.
3. 생성한 그룹 필터를 선택한다.

Expected:

- 60초 안에 그룹 생성, 노트 작성, 그룹 필터 확인까지 완료할 수 있다.
- 필터 결과에는 방금 작성한 노트가 표시된다.

## 4. 자동 테스트

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
npm run build
```

## 5. API 수동 확인 예시

토큰 발급 후:

```bash
TOKEN="<jwt>"
```

그룹 생성:

```bash
curl -sS -X POST http://localhost:3001/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"AWS"}'
```

그룹 목록:

```bash
curl -sS http://localhost:3001/api/groups \
  -H "Authorization: Bearer $TOKEN"
```

그룹 없음 노트 필터:

```bash
curl -sS "http://localhost:3001/api/notes?group=none" \
  -H "Authorization: Bearer $TOKEN"
```

그룹/검색/태그 동시 필터:

```bash
curl -sS "http://localhost:3001/api/notes?groupId=<group-id>&search=k3s&tag=aws" \
  -H "Authorization: Bearer $TOKEN"
```

## 6. 문서 업데이트 확인

구현 완료 시 아래 문서를 갱신한다.

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- 필요 시 `infra/docs/operations.md`

## 7. 운영 배포 확인

PR 병합 후 main 배포 workflow와 Argo CD sync가 완료되면:

```bash
ssh -i ~/.ssh/study-note-yuna-pa studynote@study-note.yuna-pa.com

sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl rollout status \
  deployment/study-note-backend -n study-note

curl -f https://study-note.yuna-pa.com/api/health
```

수동 smoke:

- 로그인
- 그룹 생성
- 노트 그룹 할당
- 그룹 필터
- 그룹 삭제 후 노트 보존
