const path = require("path");
const multer = require("multer");

// 업로드 디렉토리: 프로젝트 루트 기준 backend/uploads/
const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// 허용 MIME 타입
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

// 최대 파일 크기: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, UPLOADS_DIR);
  },
  filename(_request, file, callback) {
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    callback(null, uniqueName);
  },
});

function fileFilter(_request, file, callback) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error("지원하지 않는 이미지 형식입니다. PNG, JPEG, GIF, WebP만 허용됩니다."), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = {
  upload,
};
