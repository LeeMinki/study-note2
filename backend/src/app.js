const path = require("path");
const express = require("express");
const notesRoutes = require("./routes/notesRoutes");
const imageRoutes = require("./routes/imageRoutes");
const authRoutes = require("./routes/authRoutes");
const ssoRoutes = require("./routes/ssoRoutes");
const { requireAuth } = require("./middleware/authMiddleware");
const { createErrorResponse } = require("./utils/responseEnvelope");

function createApp() {
  const app = express();

  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    // Authorization 헤더 허용 추가
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

  // 노트/이미지 라우트 (JWT 인증 필요)
  app.use("/api/notes", requireAuth, notesRoutes);
  app.use("/api/images", requireAuth, imageRoutes);

  // 업로드된 이미지 정적 파일 서빙
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.use((error, _request, response, _next) => {
    response.status(500).json(createErrorResponse(error.message || "Internal server error."));
  });

  return app;
}

if (require.main === module) {
  const { initialize } = require("./db");
  const { migrate } = require("./db/migrate");

  const db = initialize();
  migrate(db);

  const app = createApp();
  const port = Number(process.env.PORT || 3001);

  app.listen(port, () => {
    console.log(`Study Note backend listening on ${port}`);
  });
}

module.exports = {
  createApp,
};
