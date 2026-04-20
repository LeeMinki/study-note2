const path = require("node:path");
const Database = require("better-sqlite3");

const defaultDbPath = path.resolve(__dirname, "../../study-note.db");

let db = null;

function initialize() {
  const envFile = process.env.STUDY_NOTE_DB_FILE;
  const dbPath = envFile
    ? (envFile === ":memory:" ? ":memory:" : path.resolve(envFile))
    : defaultDbPath;

  db = new Database(dbPath);

  // 동시 읽기 성능 향상을 위해 WAL 모드 활성화
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      email        TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT,
      provider     TEXT NOT NULL DEFAULT 'local',
      provider_id  TEXT,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      content    TEXT NOT NULL DEFAULT '',
      tags       TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notes_user_id
      ON notes(user_id);

    CREATE INDEX IF NOT EXISTS idx_notes_user_id_created_at
      ON notes(user_id, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
      ON users(email);

    CREATE INDEX IF NOT EXISTS idx_users_provider_provider_id
      ON users(provider, provider_id)
      WHERE provider_id IS NOT NULL;
  `);

  console.log("[DB] 데이터베이스 초기화 완료");
  return db;
}

function getDb() {
  if (!db) {
    throw new Error("DB가 초기화되지 않았습니다. initialize()를 먼저 호출하세요.");
  }
  return db;
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { initialize, getDb, close };
