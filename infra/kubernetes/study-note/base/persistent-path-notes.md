# Backend hostPath persistence

`008` MVP는 단일 EC2 단일 노드 전제를 받아들이고, 백엔드 SQLite DB 파일과 업로드 파일을 hostPath로 보존한다.

`012-db-migration`으로 파일 기반 JSON 저장소(`data.json`, `users.json`)가 SQLite로 대체되었다.

호스트 경로:

- `/var/lib/study-note/backend/study-note.db`
- `/var/lib/study-note/backend/uploads/`

컨테이너 경로:

- `/var/lib/study-note/backend/study-note.db` (`STUDY_NOTE_DB_FILE` 환경변수)
- `/app/uploads/`

제약:

- 이 방식은 단일 노드에서만 안전하다.
- 노드 교체 시 DB 파일 백업/복원이 필요하다.
- 정식 백업, 원격 볼륨, HA는 후속 spec으로 남긴다.
