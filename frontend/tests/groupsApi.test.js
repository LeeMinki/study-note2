import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQueryParams } from "../src/services/notesApi.js";

test("buildQueryParams omits group filter for all notes", () => {
  assert.deepEqual(buildQueryParams("", "", "all"), {});
});

test("buildQueryParams maps group none filter to group=none", () => {
  assert.deepEqual(buildQueryParams(" k3s ", " AWS ", "none"), {
    search: "k3s",
    tag: "aws",
    group: "none",
  });
});

test("buildQueryParams maps real group id to groupId", () => {
  assert.deepEqual(buildQueryParams("", "", "group_1770000000000_abcd1234"), {
    groupId: "group_1770000000000_abcd1234",
  });
});
