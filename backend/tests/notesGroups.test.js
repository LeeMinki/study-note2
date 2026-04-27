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

test("note create and update persist valid and null groupId", async () => {
  createTestDb();
  saveTestUser("user-1");
  const { createGroupRecord } = require("../src/services/groupsService");
  const { createNoteRecord, getNotes, updateNoteRecord } = require("../src/services/notesService");

  const group = await createGroupRecord({ name: "AWS" }, "user-1");
  const note = await createNoteRecord({
    title: "Grouped",
    content: "",
    tags: [],
    groupId: group.id,
  }, "user-1");

  assert.equal(note.groupId, group.id);

  const updated = await updateNoteRecord(note.id, {
    title: "Ungrouped",
    content: "",
    tags: [],
    groupId: null,
  }, "user-1");
  assert.equal(updated.groupId, null);

  const notes = await getNotes({ group: "none" }, "user-1");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].id, note.id);
});

test("note filters combine search, tag, and group with AND semantics", async () => {
  createTestDb();
  saveTestUser("user-1");
  const { createGroupRecord } = require("../src/services/groupsService");
  const { createNoteRecord, getNotes } = require("../src/services/notesService");

  const aws = await createGroupRecord({ name: "AWS" }, "user-1");
  const js = await createGroupRecord({ name: "JavaScript" }, "user-1");

  await createNoteRecord({ title: "K3s AWS", content: "cluster", tags: ["infra"], groupId: aws.id }, "user-1");
  await createNoteRecord({ title: "React AWS", content: "component", tags: ["frontend"], groupId: aws.id }, "user-1");
  await createNoteRecord({ title: "K3s JS", content: "cluster", tags: ["infra"], groupId: js.id }, "user-1");
  await createNoteRecord({ title: "K3s ungrouped", content: "cluster", tags: ["infra"], groupId: null }, "user-1");

  const filtered = await getNotes({ search: "k3s", tag: "infra", groupId: aws.id }, "user-1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, "K3s AWS");

  const ungrouped = await getNotes({ group: "none" }, "user-1");
  assert.equal(ungrouped.length, 1);
  assert.equal(ungrouped[0].title, "K3s ungrouped");
});

test("invalid group query combinations and malformed ids are rejected", async () => {
  createTestDb();
  saveTestUser("user-1");
  const { createNoteRecord, getNotes } = require("../src/services/notesService");

  await assert.rejects(
    () => getNotes({ group: "none", groupId: "group_1_abcd" }, "user-1"),
    /Group filter conflict/
  );

  await assert.rejects(
    () => createNoteRecord({ title: "Bad", content: "", tags: [], groupId: "bad" }, "user-1"),
    /Invalid group id/
  );
});
