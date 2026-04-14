const { register, login } = require("../services/authService");
const { createSuccessResponse, createErrorResponse } = require("../utils/responseEnvelope");

async function registerHandler(request, response) {
  try {
    const result = await register(request.body);
    return response.status(201).json(createSuccessResponse(result));
  } catch (error) {
    const status = error.message === "이미 사용 중인 이메일입니다." ? 409 : 400;
    return response.status(status).json(createErrorResponse(error.message));
  }
}

async function loginHandler(request, response) {
  try {
    const result = await login(request.body);
    return response.status(200).json(createSuccessResponse(result));
  } catch (error) {
    return response.status(401).json(createErrorResponse(error.message));
  }
}

module.exports = { registerHandler, loginHandler };
