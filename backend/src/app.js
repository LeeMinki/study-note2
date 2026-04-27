const fs = require("fs");
const path = require("path");
const express = require("express");
const notesRoutes = require("./routes/notesRoutes");
const groupsRoutes = require("./routes/groupsRoutes");
const imageRoutes = require("./routes/imageRoutes");
const authRoutes = require("./routes/authRoutes");
const ssoRoutes = require("./routes/ssoRoutes");
const { requireAuth } = require("./middleware/authMiddleware");
const { createErrorResponse } = require("./utils/responseEnvelope");

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  "https://study-note.yuna-pa.com,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim());

function createApp() {
  const app = express();

  app.use((request, response, next) => {
    const origin = request.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
  });

  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.status(200).json({
      success: true,
      data: { status: "ok" },
      error: null,
    });
  });

  // 인증 라우트 (인증 불필요)
  app.use("/api/auth", authRoutes);
  app.use("/api/auth/sso", ssoRoutes);

  // 노트/그룹/이미지 라우트 (JWT 인증 필요)
  app.use("/api/notes", requireAuth, notesRoutes);
  app.use("/api/groups", requireAuth, groupsRoutes);
  app.use("/api/images", requireAuth, imageRoutes);

  // 업로드된 이미지 — requireAuth 통과 후 파일 서빙
  app.get("/uploads/:filename", requireAuth, (request, response) => {
    const filename = path.basename(request.params.filename);
    const filePath = path.join(__dirname, "../uploads", filename);
    if (!fs.existsSync(filePath)) {
      return response.status(404).json(createErrorResponse("이미지를 찾을 수 없습니다."));
    }
    response.sendFile(filePath);
  });

  app.use((error, _request, response, _next) => {
    response.status(500).json(createErrorResponse(error.message || "Internal server error."));
  });

  return app;
}

if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    console.error("[보안] JWT_SECRET 환경변수가 설정되지 않았습니다. 서버를 시작할 수 없습니다.");
    process.exit(1);
  }

  const { initialize } = require("./db");

  const db = initialize();

  const app = createApp();
  const port = Number(process.env.PORT || 3001);

  app.listen(port, () => {
    console.log(`Study Note backend listening on ${port}`);
  });
}

module.exports = {
  createApp,
};
