const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  assertEnvelope,
} = require("./helpers/testData");

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
