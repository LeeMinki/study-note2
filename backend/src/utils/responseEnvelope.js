function createSuccessResponse(data) {
  return {
    success: true,
    data,
    error: null,
  };
}

function createErrorResponse(error, data = null) {
  return {
    success: false,
    data,
    error,
  };
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
};
