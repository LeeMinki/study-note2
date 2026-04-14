const { verifyToken } = require("../services/authService");
const { createErrorResponse } = require("../utils/responseEnvelope");

// Authorization: Bearer <token> 헤더를 검증하고 req.user에 페이로드를 주입한다
function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json(createErrorResponse("인증이 필요합니다."));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    request.user = { userId: payload.userId, email: payload.email };
    return next();
  } catch {
    return response.status(401).json(createErrorResponse("유효하지 않거나 만료된 토큰입니다."));
  }
}

module.exports = { requireAuth };
