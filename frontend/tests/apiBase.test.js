import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApiUrl, normalizeApiBase } from "../src/services/apiBase.js";

test("normalizeApiBase supports same-origin deployment", () => {
  assert.equal(normalizeApiBase("/"), "");
});

test("normalizeApiBase trims trailing slashes", () => {
  assert.equal(normalizeApiBase(" https://example.com/api/// "), "https://example.com/api");
});

test("buildApiUrl normalizes leading slash with default backend", () => {
  assert.equal(buildApiUrl("api/notes"), "http://localhost:3001/api/notes");
  assert.equal(buildApiUrl("/api/notes"), "http://localhost:3001/api/notes");
});
