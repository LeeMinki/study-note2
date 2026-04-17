const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const {
  assertEnvelope,
  createTestStorage,
  removeTestStorage,
  applyTestStorage,
  resetTestStorageEnv,
} = require("./helpers/testData");

let activeStorage;

afterEach(async () => {
  if (activeStorage) {
    await removeTestStorage(activeStorage);
    activeStorage = null;
  }

  resetTestStorageEnv();
});

test("register and login return token and public user", async () => {
  activeStorage = await createTestStorage();
  applyTestStorage(activeStorage);
  const { register, login } = require("../src/services/authService");
  const { createSuccessResponse } = require("../src/utils/responseEnvelope");

  const registerResult = await register({
    name: "Test User",
    displayName: "Tester",
    email: "tester@example.com",
    password: "password123",
  });
  const registerEnvelope = createSuccessResponse(registerResult);

  assertEnvelope(assert, registerEnvelope, true);
  assert.equal(typeof registerEnvelope.data.token, "string");
  assert.equal(registerEnvelope.data.user.email, "tester@example.com");
  assert.equal(registerEnvelope.data.user.passwordHash, undefined);

  const loginResult = await login({
    email: "tester@example.com",
    password: "password123",
  });
  const loginEnvelope = createSuccessResponse(loginResult);

  assertEnvelope(assert, loginEnvelope, true);
  assert.equal(typeof loginEnvelope.data.token, "string");
});

test("login with no account returns controlled auth error", async () => {
  activeStorage = await createTestStorage();
  applyTestStorage(activeStorage);
  const { login } = require("../src/services/authService");
  const { createErrorResponse } = require("../src/utils/responseEnvelope");

  await assert.rejects(
    () => login({
      email: "missing@example.com",
      password: "password123",
    }),
    /이메일 또는 비밀번호/
  );

  const envelope = createErrorResponse("이메일 또는 비밀번호가 올바르지 않습니다.");
  assertEnvelope(assert, envelope, false);
});
