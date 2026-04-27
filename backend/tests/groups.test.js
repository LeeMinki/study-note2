const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { createTestDb, closeTestDb } = require("./helpers/testData");

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

test("groups schema initializes and existing notes default to null groupId", () => {
  createTestDb();
  saveTestUser("user-1");

  const db = require("../src/db").getDb();
  const groupTable = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'groups'").get();
  assert.equal(groupTable.name, "groups");

  const { insertNote, findNotesByUserId } = require("../src/repositories/dbNoteRepository");
  const now = new Date().toISOString();
  insertNote({
    id: "note-1",
    userId: "user-1",
    title: "노트",
    content: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
  });

  const notes = findNotesByUserId("user-1");
  assert.equal(notes[0].groupId, null);
});

test("group CRUD is scoped to user and rejects duplicate names", async () => {
  createTestDb();
  saveTestUser("user-1");
  const {
    createGroupRecord,
    deleteGroupRecord,
    listGroups,
    renameGroupRecord,
  } = require("../src/services/groupsService");

  const group = await createGroupRecord({ name: " AWS " }, "user-1");
  assert.equal(group.name, "AWS");
  assert.equal(group.normalizedName, undefined);

  await assert.rejects(
    () => createGroupRecord({ name: "aws" }, "user-1"),
    /Group already exists/
  );

  const renamed = await renameGroupRecord(group.id, { name: "Backend" }, "user-1");
  assert.equal(renamed.name, "Backend");

  const groups = await listGroups("user-1");
  assert.deepEqual(groups.map((item) => item.name), ["Backend"]);

  const deleted = await deleteGroupRecord(group.id, "user-1");
  assert.equal(deleted.id, group.id);
  assert.equal((await listGroups("user-1")).length, 0);
});

test("group delete unassigns notes instead of deleting them", async () => {
  createTestDb();
  saveTestUser("user-1");
  const { createGroupRecord, deleteGroupRecord } = require("../src/services/groupsService");
  const { createNoteRecord, getNotes } = require("../src/services/notesService");

  const group = await createGroupRecord({ name: "AWS" }, "user-1");
  const note = await createNoteRecord({
    title: "K3s",
    content: "",
    tags: [],
    groupId: group.id,
  }, "user-1");

  assert.equal(note.groupId, group.id);

  const deleted = await deleteGroupRecord(group.id, "user-1");
  assert.equal(deleted.unassignedNoteCount, 1);

  const notes = await getNotes({}, "user-1");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].groupId, null);
});

test("cross-account group access is rejected", async () => {
  createTestDb();
  saveTestUser("user-a");
  saveTestUser("user-b");
  const { createGroupRecord, deleteGroupRecord, renameGroupRecord } = require("../src/services/groupsService");
  const { createNoteRecord, getNotes } = require("../src/services/notesService");

  const group = await createGroupRecord({ name: "Private" }, "user-a");

  await assert.rejects(
    () => renameGroupRecord(group.id, { name: "Leak" }, "user-b"),
    /Group not found/
  );
  await assert.rejects(
    () => deleteGroupRecord(group.id, "user-b"),
    /Group not found/
  );
  await assert.rejects(
    () => createNoteRecord({ title: "B", content: "", tags: [], groupId: group.id }, "user-b"),
    /Group not found/
  );
  await assert.rejects(
    () => getNotes({ groupId: group.id }, "user-b"),
    /Group not found/
  );
});
