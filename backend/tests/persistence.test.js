const assert = require("node:assert/strict");
const { afterEach, before, test } = require("node:test");
const { createTestDb, closeTestDb } = require("./helpers/testData");

afterEach(() => {
  closeTestDb();
});

test("DB 초기화 후 사용자 조회 시 null 반환", () => {
  createTestDb();
  const { findUserByEmail } = require("../src/repositories/dbUserRepository");

  const result = findUserByEmail("missing@example.com");
  assert.equal(result, null);
});

test("사용자 저장 후 이메일로 조회 성공", () => {
  createTestDb();
  const { saveUser, findUserByEmail } = require("../src/repositories/dbUserRepository");

  const user = {
    id: "user-1",
    email: "test@example.com",
    name: "테스트",
    displayName: "테스터",
    passwordHash: "hash",
    provider: "local",
    providerId: null,
    createdAt: new Date().toISOString(),
  };

  saveUser(user);
  const found = findUserByEmail("test@example.com");

  assert.equal(found.id, "user-1");
  assert.equal(found.email, "test@example.com");
});

test("노트 저장 후 사용자 ID로 조회 성공", () => {
  createTestDb();
  const { saveUser } = require("../src/repositories/dbUserRepository");
  const { insertNote, findNotesByUserId } = require("../src/repositories/dbNoteRepository");

  const user = {
    id: "user-1",
    email: "test@example.com",
    name: "테스트",
    displayName: "테스터",
    passwordHash: "hash",
    provider: "local",
    providerId: null,
    createdAt: new Date().toISOString(),
  };
  saveUser(user);

  const now = new Date().toISOString();
  const note = {
    id: "note-1",
    userId: "user-1",
    title: "첫 번째 노트",
    content: "내용",
    tags: ["tag1"],
    createdAt: now,
    updatedAt: now,
  };
  insertNote(note);

  const notes = findNotesByUserId("user-1");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].id, "note-1");
  assert.deepEqual(notes[0].tags, ["tag1"]);
});

test("다른 사용자의 노트는 격리된다", () => {
  createTestDb();
  const { saveUser } = require("../src/repositories/dbUserRepository");
  const { insertNote, findNotesByUserId } = require("../src/repositories/dbNoteRepository");

  const now = new Date().toISOString();
  for (const userId of ["user-a", "user-b"]) {
    saveUser({ id: userId, email: `${userId}@example.com`, name: userId, displayName: userId, passwordHash: "h", provider: "local", providerId: null, createdAt: now });
  }

  insertNote({ id: "note-a", userId: "user-a", title: "A 노트", content: "", tags: [], createdAt: now, updatedAt: now });
  insertNote({ id: "note-b", userId: "user-b", title: "B 노트", content: "", tags: [], createdAt: now, updatedAt: now });

  assert.equal(findNotesByUserId("user-a").length, 1);
  assert.equal(findNotesByUserId("user-b").length, 1);
  assert.equal(findNotesByUserId("user-a")[0].id, "note-a");
});

test("provider/providerId 필드가 SSO 확장을 위해 저장된다", () => {
  createTestDb();
  const { saveUser, findUserById } = require("../src/repositories/dbUserRepository");

  const user = {
    id: "sso-user-1",
    email: "sso@example.com",
    name: "SSO 사용자",
    displayName: "SSO",
    passwordHash: null,
    provider: "google",
    providerId: "google-sub-12345",
    createdAt: new Date().toISOString(),
  };
  saveUser(user);

  const found = findUserById("sso-user-1");
  assert.equal(found.provider, "google");
  assert.equal(found.providerId, "google-sub-12345");
  assert.equal(found.passwordHash, null);
});

test("동시 쓰기: 두 노트를 순차 삽입해도 데이터 손실 없음", () => {
  createTestDb();
  const { saveUser } = require("../src/repositories/dbUserRepository");
  const { insertNote, findNotesByUserId } = require("../src/repositories/dbNoteRepository");

  const now = new Date().toISOString();
  saveUser({ id: "user-c", email: "c@example.com", name: "C", displayName: "C", passwordHash: "h", provider: "local", providerId: null, createdAt: now });

  insertNote({ id: "note-c1", userId: "user-c", title: "노트1", content: "", tags: [], createdAt: now, updatedAt: now });
  insertNote({ id: "note-c2", userId: "user-c", title: "노트2", content: "", tags: [], createdAt: now, updatedAt: now });

  const notes = findNotesByUserId("user-c");
  assert.equal(notes.length, 2);
});

test("존재하지 않는 이메일로 로그인 시도 → 통합 오류 메시지", async () => {
  createTestDb();
  const { login } = require("../src/services/authService");

  await assert.rejects(
    () => login({ email: "missing@example.com", password: "password123" }),
    /이메일 또는 비밀번호/
  );
});
