# Backend hostPath persistence

`008` MVP는 단일 EC2 단일 노드 전제를 받아들이고, 백엔드 로컬 JSON 파일과 업로드 파일을 hostPath로 보존한다.

호스트 경로:

- `/var/lib/study-note/backend/data.json`
- `/var/lib/study-note/backend/users.json`
- `/var/lib/study-note/backend/uploads/`

컨테이너 경로:

- `/app/data.json`
- `/app/users.json`
- `/app/uploads/`

제약:

- 이 방식은 단일 노드에서만 안전하다.
- 노드 교체 시 파일 백업/복원이 필요하다.
- 정식 백업, 원격 볼륨, 데이터베이스 이전은 후속 spec으로 남긴다.
