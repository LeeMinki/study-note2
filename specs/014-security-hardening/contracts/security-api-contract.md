# Security API Contract: 014 Security Hardening

## 변경되는 엔드포인트

### GET /uploads/:filename (변경)

업로드 이미지 파일 접근. 기존 정적 파일 서빙 → 인증 미들웨어 통과 라우트로 변경.

**변경 전**: `express.static` — 누구나 접근 가능

**변경 후**:
- **Headers (필수)**: `Authorization: Bearer <jwt>`
- **Response 200**: 이미지 파일 (Content-Type: image/*)
- **Response 401** (미인증):
  ```json
  { "success": false, "data": null, "error": "인증이 필요합니다." }
  ```
- **Response 404** (파일 없음):
  ```json
  { "success": false, "data": null, "error": "이미지를 찾을 수 없습니다." }
  ```

---

### POST /api/auth/login (변경)

속도 제한 추가. 응답 형식 변경 없음.

**추가 응답 코드**:
- **Response 429** (속도 제한 초과):
  ```json
  { "success": false, "data": null, "error": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }
  ```
  **Headers**: `Retry-After: <seconds>`

---

### POST /api/auth/register (변경)

속도 제한 추가. 응답 형식 변경 없음.

**추가 응답 코드**:
- **Response 429**: 로그인과 동일 형식

---

## 삭제되는 동작

- 서버 시작 시 `users.json`/`data.json` 파일 읽기 및 DB 삽입 동작 제거
- `Access-Control-Allow-Origin: *` 헤더 제거

## 추가되는 동작

- CORS: 허용 출처만 `Access-Control-Allow-Origin` 반영. 미허용 출처는 CORS 헤더 미포함.
- JWT_SECRET 미설정 시 서버 시작 즉시 중단.

## 프론트엔드 이미지 로딩 변경

노트 콘텐츠는 `renderMarkdown.js`로 HTML 문자열 생성 후 `NoteCard.jsx`에서 `dangerouslySetInnerHTML`로 렌더링된다. img 태그를 React props로 제어할 수 없으므로 **DOM ref 기반 일괄 교체** 방식을 사용한다.

- `frontend/src/hooks/useAuthenticatedImages.js` 신규 훅: DOM ref를 받아 `/uploads/` src를 가진 img 태그를 fetch+Blob URL로 일괄 교체
- `frontend/src/components/NoteCard.jsx` 수정: `.markdownBody` div에 ref 추가 후 훅 적용
- `frontend/src/utils/renderMarkdown.js`: 변경 없음
