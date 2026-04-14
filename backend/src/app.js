const express = require("express");
const notesRoutes = require("./routes/notesRoutes");
const { createErrorResponse } = require("./utils/responseEnvelope");

function createApp() {
  const app = express();

  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

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

  app.use("/api/notes", notesRoutes);

  app.use((error, _request, response, _next) => {
    response.status(500).json(createErrorResponse(error.message || "Internal server error."));
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT || 3001);

  app.listen(port, () => {
    // 개발 서버 시작 로그만 남긴다.
    console.log(`Study Note backend listening on ${port}`);
  });
}

module.exports = {
  createApp,
};
