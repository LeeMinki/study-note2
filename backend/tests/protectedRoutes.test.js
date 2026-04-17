const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  assertEnvelope,
} = require("./helpers/testData");

function createMockResponse() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("notes API rejects missing Authorization header", async () => {
  const { requireAuth } = require("../src/middleware/authMiddleware");
  const response = createMockResponse();
  let calledNext = false;

  requireAuth({ headers: {} }, response, () => {
    calledNext = true;
  });

  assert.equal(calledNext, false);
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, "인증이 필요합니다.");
  assertEnvelope(assert, response.body, false);
});

test("image API rejects invalid bearer token", async () => {
  const { requireAuth } = require("../src/middleware/authMiddleware");
  const response = createMockResponse();
  let calledNext = false;

  requireAuth({ headers: { authorization: "Bearer invalid-token" } }, response, () => {
    calledNext = true;
  });

  assert.equal(calledNext, false);
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, "유효하지 않거나 만료된 토큰입니다.");
  assertEnvelope(assert, response.body, false);
});
