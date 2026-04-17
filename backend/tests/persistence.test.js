const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { afterEach, test } = require("node:test");
const {
  applyTestStorage,
  createTestStorage,
  removeTestStorage,
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

test("empty local JSON files are handled without changing committed storage", async () => {
  activeStorage = await createTestStorage();
  await fs.writeFile(activeStorage.dataFile, "");
  await fs.writeFile(activeStorage.usersFile, "");
  applyTestStorage(activeStorage);

  const { login } = require("../src/services/authService");
  const { listNotes } = require("../src/repositories/fileNoteRepository");

  await assert.rejects(
    () => login({ email: "missing@example.com", password: "password123" }),
    /이메일 또는 비밀번호/
  );

  assert.deepEqual(await listNotes(), []);
});

test("note repository falls back to direct write when rename replacement is blocked", async () => {
  activeStorage = await createTestStorage();
  applyTestStorage(activeStorage);

  const originalRename = fs.rename;
  fs.rename = async () => {
    const error = new Error("blocked replacement");
    error.code = "EXDEV";
    throw error;
  };

  try {
    const { saveNotes, listNotes } = require("../src/repositories/fileNoteRepository");
    const notes = [{ id: "note-1", title: "Fallback", content: "Works" }];

    await saveNotes(notes);

    assert.deepEqual(await listNotes(), notes);
    assert.deepEqual(JSON.parse(await fs.readFile(activeStorage.dataFile, "utf8")), { notes });
  } finally {
    fs.rename = originalRename;
  }
});
