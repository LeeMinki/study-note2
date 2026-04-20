# Quickstart: 파일 기반 저장소를 데이터베이스로 마이그레이션

## 전제 조건

- Node.js 22, npm
- `better-sqlite3` 사용자 승인 완료 후 설치
- k3s 클러스터 실행 중 (운영 배포 시)

## Step 1: 의존성 설치 (사용자 승인 필요)

```bash
cd backend
npm install better-sqlite3
```

> **주의**: `better-sqlite3`는 네이티브 애드온이므로 Docker 빌드 시 `node-gyp` 컴파일이 포함된다.
> Dockerfile에 `build-essential`, `python3` 등 빌드 도구가 필요하다면 멀티스테이지 빌드로 처리한다.

## Step 2: 로컬 개발 환경 확인

```bash
# DB 파일 경로 환경변수 (기본값: backend/study-note.db)
export STUDY_NOTE_DB_FILE=/tmp/test-study-note.db

# 서버 시작 (스타트업 마이그레이션 자동 실행)
cd backend && npm start

# 서버 로그에서 마이그레이션 확인
# [DB] 데이터베이스 초기화 완료
# [DB] 마이그레이션 건너뜀 — 파일 없음 (또는 DB에 데이터 존재)
```

## Step 3: 기존 데이터 마이그레이션 검증 (운영 환경)

```bash
# EC2 접속
ssh -i ~/.ssh/study-note-yuna-pa studynote@study-note.yuna-pa.com

# 기존 파일 건수 확인
sudo python3 -c "
import json
users = json.load(open('/var/lib/study-note/backend/users.json'))
data = json.load(open('/var/lib/study-note/backend/data.json'))
print(f'users: {len(users[\"users\"])}, notes: {len(data[\"notes\"])}')
"

# 마이그레이션 후 Pod 재시작 로그 확인
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl logs -n study-note \
  -l app=study-note-backend --tail=50

# DB 건수 확인 (Pod 내에서)
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl exec -n study-note \
  -it deployment/study-note-backend -- \
  node -e "
const db = require('better-sqlite3')(process.env.STUDY_NOTE_DB_FILE);
console.log('users:', db.prepare('SELECT COUNT(*) as n FROM users').get().n);
console.log('notes:', db.prepare('SELECT COUNT(*) as n FROM notes').get().n);
"
```

## Step 4: 회귀 테스트

```bash
cd backend && npm test
# 전체 테스트 통과 확인
```

## Step 5: 운영 배포 (GitOps)

```bash
# PR 머지 후 Argo CD 자동 sync
# 배포 완료 후 Pod 재시작 + 스타트업 마이그레이션 자동 실행

# 배포 상태 확인 (EC2에서)
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl rollout status \
  deployment/study-note-backend -n study-note

# 서비스 중단 시간 확인 (30초 이하 목표)
time curl -f https://study-note.yuna-pa.com/api/health
```

## 장애 복구

### DB 파일 손상 시

```bash
# 1. 원본 파일 백업 확인
ls -la /var/lib/study-note/backend/users.json
ls -la /var/lib/study-note/backend/data.json

# 2. 손상된 DB 삭제
rm /var/lib/study-note/backend/study-note.db

# 3. Pod 재시작 — 스타트업 마이그레이션이 파일에서 자동 재이관
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl rollout restart \
  deployment/study-note-backend -n study-note
```

### DB 롤백 (코드 레벨)

DB 구현체로 전환 후에는 파일 저장소 코드가 삭제된다. 코드 롤백이 필요하다면 이전 Git 태그로 이미지를 교체한다:

```bash
# kustomization.yaml에서 이전 이미지 태그로 되돌리기
# Argo CD sync 후 파일 기반 Pod 재배포
```
