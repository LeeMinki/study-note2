const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = process.env.STUDY_NOTE_DATA_DIR
  ? path.resolve(process.env.STUDY_NOTE_DATA_DIR)
  : path.resolve(__dirname, "../../");

const USERS_FILE = path.join(DATA_DIR, "users.json");
const NOTES_FILE = path.join(DATA_DIR, "data.json");

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function migrateUsers(db) {
  const parsed = readJsonSafe(USERS_FILE);
  if (!parsed || !Array.isArray(parsed.users)) return 0;

  const insert = db.prepare(
    `INSERT OR IGNORE INTO users (id, email, name, display_name, password_hash, provider, provider_id, created_at)
     VALUES (@id, @email, @name, @displayName, @passwordHash, @provider, @providerId, @createdAt)`
  );

  let count = 0;
  const run = db.transaction(() => {
    for (const u of parsed.users) {
      insert.run({
        id: u.id,
        email: u.email,
        name: u.name,
        displayName: u.displayName ?? u.display_name ?? u.name,
        passwordHash: u.passwordHash ?? u.password_hash ?? null,
        provider: u.provider ?? "local",
        providerId: u.providerId ?? u.provider_id ?? null,
        createdAt: u.createdAt ?? u.created_at ?? new Date().toISOString(),
      });
      count++;
    }
  });
  run();
  return count;
}

function migrateNotes(db) {
  const parsed = readJsonSafe(NOTES_FILE);
  if (!parsed || !Array.isArray(parsed.notes)) return 0;

  const insert = db.prepare(
    `INSERT OR IGNORE INTO notes (id, user_id, title, content, tags, created_at, updated_at)
     VALUES (@id, @userId, @title, @content, @tags, @createdAt, @updatedAt)`
  );

  let count = 0;
  const run = db.transaction(() => {
    for (const n of parsed.notes) {
      insert.run({
        id: n.id,
        userId: n.userId ?? n.user_id,
        title: n.title,
        content: n.content ?? "",
        tags: Array.isArray(n.tags) ? JSON.stringify(n.tags) : "[]",
        createdAt: n.createdAt ?? n.created_at ?? new Date().toISOString(),
        updatedAt: n.updatedAt ?? n.updated_at ?? new Date().toISOString(),
      });
      count++;
    }
  });
  run();
  return count;
}

function migrate(db) {
  const usersExist = fs.existsSync(USERS_FILE);
  const notesExist = fs.existsSync(NOTES_FILE);

  if (!usersExist && !notesExist) {
    console.log("[마이그레이션] JSON 파일 없음 — 건너뜀");
    return;
  }

  const userCount = migrateUsers(db);
  const noteCount = migrateNotes(db);
  console.log(`[마이그레이션] 완료: 사용자 ${userCount}명, 노트 ${noteCount}개`);
}

module.exports = { migrate };
