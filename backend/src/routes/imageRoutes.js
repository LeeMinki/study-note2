const express = require("express");
const { upload } = require("../services/imageService");
const { uploadImage } = require("../controllers/imageController");
const { createErrorResponse } = require("../utils/responseEnvelope");

const router = express.Router();

// multer 에러(파일 크기 초과, 형식 오류)를 API envelope으로 변환
function handleMulterError(error, _request, response, next) {
  if (error.code === "LIMIT_FILE_SIZE") {
    return response.status(400).json(createErrorResponse("파일 크기가 5MB를 초과합니다."));
  }
  if (error.message) {
    return response.status(400).json(createErrorResponse(error.message));
  }
  return next(error);
}

// multer를 래퍼로 호출하여 에러를 직접 처리한다
router.post("/", (request, response, next) => {
  upload.single("image")(request, response, (error) => {
    if (error) return handleMulterError(error, request, response, next);
    return next();
  });
}, uploadImage);

module.exports = router;
