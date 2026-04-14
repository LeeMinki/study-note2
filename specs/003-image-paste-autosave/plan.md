# Implementation Plan: 이미지 붙여넣기 및 자동 임시저장

**Branch**: `003-image-paste-autosave` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-image-paste-autosave/spec.md`

## Summary

클립보드 이미지를 Ctrl+V로 붙여넣으면 백엔드에 자동 업로드되고 마크다운 이미지 문법이 삽입된다. 렌더링 영역에서 `![alt](url)` 문법을 실제 이미지로 표시하며, NoteComposer 입력 내용을 3초 debounce로 localStorage에 자동 임시저장하고 페이지 재방문 시 복원한다.

- **Backend**: `multer`로 `POST /api/images` 엔드포인트 추가, `/uploads` 정적 파일 서빙
- **Frontend (렌더러)**: `renderMarkdown.js`에 이미지 패턴 추가 (링크 패턴 앞에 삽입)
- **Frontend (작성기)**: paste 이벤트 핸들러, `useDraftNote` hook, 복원 배너

## Technical Context

**Language/Version**: Node.js 18 (backend), React 18 (frontend)
**Primary Dependencies**: Express.js, multer (신규 승인 완료), React hooks
**Storage**: 백엔드 로컬 파일시스템 `/uploads`, 임시저장은 localStorage (`study-note-draft`)
**Testing**: 수동 기능 테스트
**Target Platform**: Linux/WSL, 데스크톱 브라우저
**Project Type**: 웹 애플리케이션 (monorepo: frontend + backend)
**Performance Goals**: 이미지 업로드 완료까지 3초 이내 (네트워크 정상 조건)
**Constraints**: 최대 업로드 크기 5MB, 지원 형식 PNG/JPEG/GIF/WebP
**Scale/Scope**: MVP — 새 노트 작성 폼에만 적용, 기존 노트 편집 제외

## Constitution Check

- [x] monorepo 경계 유지: 프론트엔드는 `fetch`로 `POST /api/images`를 호출하며, 백엔드 소스를 직접 참조하지 않는다.
- [x] JSON 응답 envelope 준수: `POST /api/images` 응답 → `{ success: boolean, data: { url: string }, error: string | null }`
- [x] 스토리지 소유권: 이미지 파일은 백엔드 `imageService.js`에서만 처리하며 `fileNoteRepository`와 독립적이다.
- [x] 식별자 영문/camelCase 준수: `imageController`, `imageRoutes`, `imageService`, `useDraftNote`, `imagesApi`
- [x] 신규 의존성: `multer` — 사용자 승인 완료 (CA-003). 프론트엔드는 기존 `fetch` API로 충분하여 추가 의존성 없음.
- [x] UX: paste 이벤트는 textarea 인라인 처리, 임시저장 복원 안내는 NoteComposer 내 인라인 배너로 표시. 별도 모달 없음.
- [x] Linux/WSL 친화적 명령어 사용, 작은 단위 변경으로 분리.

## Project Structure

### Documentation (this feature)

```text
specs/003-image-paste-autosave/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
backend/
├── uploads/                          # 이미지 업로드 저장 디렉토리 (신규)
└── src/
    ├── app.js                        # 수정: imageRoutes 등록, /uploads 정적 서빙
    ├── controllers/
    │   └── imageController.js        # 신규: POST /api/images 핸들러
    ├── routes/
    │   └── imageRoutes.js            # 신규: 이미지 라우터
    └── services/
        └── imageService.js           # 신규: multer 설정, 파일 저장 로직

frontend/src/
├── hooks/
│   └── useDraftNote.js               # 신규: 3초 debounce 자동저장, 복원 hook
├── services/
│   └── imagesApi.js                  # 신규: POST /api/images fetch 래퍼
├── components/
│   └── NoteComposer.jsx              # 수정: paste 핸들러, 복원 배너
└── utils/
    └── renderMarkdown.js             # 수정: 이미지 패턴 추가
```

## Phase 0: Research

### 기존 코드 분석 결과

**backend/src/app.js**
- CORS 미들웨어, `express.json()`, `/api/notes` 라우트, 전역 에러 핸들러 구조
- 추가 필요: `express.static("uploads")` → `/uploads` 경로로 서빙
- 추가 필요: `imageRoutes` 등록 (`/api/images`)

**frontend/src/utils/renderMarkdown.js**
- `applyInlineMarkdown()`: 코드 → 굵게 → 기울임 → 링크 순서로 처리
- 이미지 패턴 `![alt](url)` 없음 — **링크 패턴 앞에 삽입 필요** (링크 패턴이 먼저 매칭되면 이미지가 링크로 처리됨)
- 삽입 위치: `.replace(/\*([^*]+)\*/g, ...)` 다음, `.replace(/\[([^\]]+)\]...` 이전

**frontend/src/components/NoteComposer.jsx**
- content textarea에 `paste` 이벤트 핸들러 추가 필요
- `useDraftNote` hook 연동 필요
- 복원 배너 UI 추가 필요

## Phase 1: Design

### 데이터 모델

**UploadedImage (백엔드, 런타임 객체)**
```js
{
  filename: string,    // multer가 생성한 고유 파일명 (예: 1713098400000-image.png)
  originalName: string,
  mimetype: string,
  size: number,        // bytes
  url: string,         // /uploads/{filename}
  uploadedAt: string,  // ISO 8601
}
```

**DraftNote (localStorage, `study-note-draft` 키)**
```js
{
  title: string,
  content: string,
  tags: string,         // 쉼표 구분 원본 문자열
  savedAt: string,      // ISO 8601
}
```

### API 계약

**POST /api/images**
- Request: `multipart/form-data`, field name: `image`
- Response (성공): `{ success: true, data: { url: "/uploads/filename.png" }, error: null }`
- Response (실패): `{ success: false, data: null, error: "오류 메시지" }`
- 제약: 최대 5MB, 허용 MIME: `image/png`, `image/jpeg`, `image/gif`, `image/webp`

### 핵심 구현 결정

1. **multer 설정**: `diskStorage`로 `backend/uploads/` 에 저장, 파일명: `Date.now() + '-' + 원본파일명`
2. **업로드 중 임시 텍스트**: `![업로드 중...]` placeholder를 커서 위치에 삽입 → 완료 후 `![image](url)`로 교체
3. **paste 핸들러**: `event.clipboardData.items`를 순회하여 `image/` MIME type 감지 → 이미지가 있으면 `event.preventDefault()` 후 업로드 → 텍스트만 있으면 기본 동작 유지
4. **debounce**: `useEffect` + `setTimeout` 3000ms, 의존성 배열 `[title, content, tags]`
5. **이미지 렌더링**: `<img src="$2" alt="$1" style="max-width:100%" />` — 컨테이너 초과 방지
6. **복원 배너**: localStorage에 draft 존재 시 NoteComposer 상단에 인라인 배너 표시, "복원"/"삭제" 버튼 제공

## Complexity Tracking

해당 사항 없음 — 모든 구현이 Constitution 원칙 내에서 처리됨.
