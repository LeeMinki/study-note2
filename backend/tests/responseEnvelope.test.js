const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const {
  assertEnvelope,
  closeTestDb,
  createTestDb,
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

afterEach(() => {
  closeTestDb();
});

test("success response helper uses stable envelope", () => {
  const { createSuccessResponse } = require("../src/utils/responseEnvelope");
  const body = createSuccessResponse({ status: "ok" });

  assertEnvelope(assert, body, true);
  assert.deepEqual(body.data, { status: "ok" });
});

test("error response helper uses stable envelope", () => {
  const { createErrorResponse } = require("../src/utils/responseEnvelope");
  const body = createErrorResponse("Title is required.");

  assertEnvelope(assert, body, false);
  assert.equal(body.data, null);
  assert.equal(body.error, "Title is required.");
});

test("group controller success and validation errors use stable envelope", async () => {
  createTestDb();
  const { saveUser } = require("../src/repositories/dbUserRepository");
  const { createGroupHandler } = require("../src/controllers/groupsController");
  const now = new Date().toISOString();
  saveUser({
    id: "user-1",
    email: "user-1@example.com",
    name: "user-1",
    displayName: "user-1",
    passwordHash: "hash",
    provider: "local",
    providerId: null,
    createdAt: now,
  });

  const successResponse = createMockResponse();
  await createGroupHandler({ body: { name: "AWS" }, user: { userId: "user-1" } }, successResponse);
  assert.equal(successResponse.statusCode, 201);
  assertEnvelope(assert, successResponse.body, true);

  const errorResponse = createMockResponse();
  await createGroupHandler({ body: { name: "" }, user: { userId: "user-1" } }, errorResponse);
  assert.equal(errorResponse.statusCode, 400);
  assertEnvelope(assert, errorResponse.body, false);
});
