const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { assertEnvelope, createTestDb, closeTestDb } = require("./helpers/testData");

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

function saveTestUser(userId) {
  const { saveUser } = require("../src/repositories/dbUserRepository");
  const now = new Date().toISOString();
  saveUser({
    id: userId,
    email: `${userId}@example.com`,
    name: userId,
    displayName: userId,
    passwordHash: "hash",
    provider: "local",
    providerId: null,
    createdAt: now,
  });
}

afterEach(() => {
  closeTestDb();
});

test("groups API auth middleware rejects missing Authorization header", () => {
  createTestDb();
  const { requireAuth } = require("../src/middleware/authMiddleware");
  const response = createMockResponse();
  let calledNext = false;

  requireAuth({ headers: {} }, response, () => {
    calledNext = true;
  });

  assert.equal(calledNext, false);
  assert.equal(response.statusCode, 401);
  assertEnvelope(assert, response.body, false);
});

test("groups handlers create, list, rename, and delete with envelope", async () => {
  createTestDb();
  saveTestUser("user-1");
  const {
    createGroupHandler,
    deleteGroupHandler,
    listGroupsHandler,
    renameGroupHandler,
  } = require("../src/controllers/groupsController");
  const user = { userId: "user-1" };

  const createResponse = createMockResponse();
  await createGroupHandler({ body: { name: "AWS" }, user }, createResponse);
  assert.equal(createResponse.statusCode, 201);
  assertEnvelope(assert, createResponse.body, true);
  assert.equal(createResponse.body.data.name, "AWS");

  const groupId = createResponse.body.data.id;
  const renameResponse = createMockResponse();
  await renameGroupHandler({ params: { groupId }, body: { name: "Backend" }, user }, renameResponse);
  assert.equal(renameResponse.statusCode, 200);
  assertEnvelope(assert, renameResponse.body, true);
  assert.equal(renameResponse.body.data.name, "Backend");

  const listResponse = createMockResponse();
  await listGroupsHandler({ user }, listResponse);
  assert.equal(listResponse.statusCode, 200);
  assertEnvelope(assert, listResponse.body, true);
  assert.deepEqual(listResponse.body.data.map((group) => group.name), ["Backend"]);

  const deleteResponse = createMockResponse();
  await deleteGroupHandler({ params: { groupId }, user }, deleteResponse);
  assert.equal(deleteResponse.statusCode, 200);
  assertEnvelope(assert, deleteResponse.body, true);
  assert.equal(deleteResponse.body.data.id, groupId);
});
