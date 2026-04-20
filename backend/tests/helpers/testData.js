const dbModule = require("../../src/db");

// in-memory SQLite DB를 생성해 테스트 격리를 보장한다.
function createTestDb() {
  process.env.STUDY_NOTE_DB_FILE = ":memory:";
  const db = dbModule.initialize();
  return db;
}

function closeTestDb() {
  dbModule.close();
  delete process.env.STUDY_NOTE_DB_FILE;
  clearBackendRequireCache();
}

function clearBackendRequireCache() {
  const nodePath = require("node:path");
  const sourceRoot = nodePath.resolve(__dirname, "../../src");
  // db 싱글턴 모듈은 캐시를 유지해야 re-require 시 동일 인스턴스를 사용한다
  const dbDir = nodePath.resolve(__dirname, "../../src/db");

  for (const modulePath of Object.keys(require.cache)) {
    if (modulePath.startsWith(sourceRoot) && !modulePath.startsWith(dbDir)) {
      delete require.cache[modulePath];
    }
  }
}

function assertEnvelope(assert, body, expectedSuccess) {
  assert.equal(typeof body, "object");
  assert.equal(typeof body.success, "boolean");
  assert.equal(body.success, expectedSuccess);
  assert.ok(Object.hasOwn(body, "data"));
  assert.ok(Object.hasOwn(body, "error"));
  assert.ok(body.error === null || typeof body.error === "string");
}

module.exports = {
  assertEnvelope,
  createTestDb,
  closeTestDb,
  clearBackendRequireCache,
};
