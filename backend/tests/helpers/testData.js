const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

async function createTestStorage() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "study-note-backend-"));
  const dataFile = path.join(directory, "data.json");
  const usersFile = path.join(directory, "users.json");

  await fs.writeFile(dataFile, JSON.stringify({ notes: [] }, null, 2));
  await fs.writeFile(usersFile, JSON.stringify({ users: [] }, null, 2));

  return {
    directory,
    dataFile,
    usersFile,
  };
}

async function removeTestStorage(storage) {
  if (!storage?.directory) {
    return;
  }

  await fs.rm(storage.directory, { recursive: true, force: true });
}

function clearBackendRequireCache() {
  const sourceRoot = path.resolve(__dirname, "../../src");

  for (const modulePath of Object.keys(require.cache)) {
    if (modulePath.startsWith(sourceRoot)) {
      delete require.cache[modulePath];
    }
  }
}

function applyTestStorage(storage) {
  process.env.STUDY_NOTE_DATA_FILE = storage.dataFile;
  process.env.STUDY_NOTE_USERS_FILE = storage.usersFile;
  clearBackendRequireCache();
}

function resetTestStorageEnv() {
  delete process.env.STUDY_NOTE_DATA_FILE;
  delete process.env.STUDY_NOTE_USERS_FILE;
  clearBackendRequireCache();
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
  applyTestStorage,
  createTestStorage,
  removeTestStorage,
  resetTestStorageEnv,
};
