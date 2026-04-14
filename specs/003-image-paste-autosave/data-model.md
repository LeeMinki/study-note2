# Data Model: 이미지 붙여넣기 및 자동 임시저장

**Date**: 2026-04-14

## UploadedImage (백엔드 런타임 객체)

```js
{
  filename: string,       // multer 생성 고유 파일명 (Date.now() + '-' + originalname)
  originalName: string,   // 원본 파일명
  mimetype: string,       // image/png, image/jpeg, image/gif, image/webp
  size: number,           // bytes (최대 5MB = 5,242,880)
  url: string,            // /uploads/{filename}
  uploadedAt: string,     // ISO 8601
}
```

## DraftNote (localStorage)

**Key**: `study-note-draft`

```js
{
  title: string,    // NoteComposer title 입력값
  content: string,  // NoteComposer content 입력값
  tags: string,     // 쉼표 구분 원본 문자열
  savedAt: string,  // ISO 8601
}
```

## API 계약

### POST /api/images

**Request**: `multipart/form-data`, field: `image`

**Response (성공)**:
```json
{
  "success": true,
  "data": { "url": "/uploads/1713098400000-screenshot.png" },
  "error": null
}
```

**Response (실패)**:
```json
{
  "success": false,
  "data": null,
  "error": "파일 크기가 5MB를 초과합니다."
}
```

**제약**:
- 최대 파일 크기: 5MB
- 허용 MIME: image/png, image/jpeg, image/gif, image/webp
- 필드명: `image`
