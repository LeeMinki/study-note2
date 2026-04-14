const { createSuccessResponse, createErrorResponse } = require("../utils/responseEnvelope");

// POST /api/images — 이미지 업로드 후 접근 URL 반환
function uploadImage(request, response) {
  const file = request.file;

  if (!file) {
    return response.status(400).json(createErrorResponse("업로드된 파일이 없습니다."));
  }

  const url = `/uploads/${file.filename}`;

  return response.status(201).json(createSuccessResponse({ url }));
}

module.exports = {
  uploadImage,
};
