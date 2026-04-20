const { getDb } = require("../db");
const { normalizeSingleTag } = require("../utils/normalizeTags");

// DB row(snake_case) → 애플리케이션 객체(camelCase) 변환
function rowToNote(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function findNotesByUserId(userId, query = {}) {
  const normalizedTag = normalizeSingleTag(query.tag);
  const normalizedSearch =
    typeof query.search === "string" ? query.search.trim().toLowerCase() : "";

  let sql = "SELECT * FROM notes WHERE user_id = ?";
  const params = [userId];

  if (normalizedTag) {
    // JSON 배열 컬럼에서 태그 포함 여부 확인
    sql += " AND tags LIKE ?";
    params.push(`%"${normalizedTag}"%`);
  }

  if (normalizedSearch) {
    sql += " AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)";
    params.push(`%${normalizedSearch}%`, `%${normalizedSearch}%`);
  }

  sql += " ORDER BY created_at DESC";

  return getDb()
    .prepare(sql)
    .all(...params)
    .map(rowToNote);
}

function findNoteById(noteId) {
  const row = getDb()
    .prepare("SELECT * FROM notes WHERE id = ?")
    .get(noteId);
  return row ? rowToNote(row) : null;
}

function insertNote(note) {
  getDb()
    .prepare(
      `INSERT INTO notes (id, user_id, title, content, tags, created_at, updated_at)
       VALUES (@id, @userId, @title, @content, @tags, @createdAt, @updatedAt)`
    )
    .run({
      id: note.id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      tags: JSON.stringify(note.tags ?? []),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  return note;
}

function updateNote(note) {
  const result = getDb()
    .prepare(
      `UPDATE notes
         SET title = @title,
             content = @content,
             tags = @tags,
             updated_at = @updatedAt
       WHERE id = @id`
    )
    .run({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: JSON.stringify(note.tags ?? []),
      updatedAt: note.updatedAt,
    });

  if (result.changes === 0) {
    throw new Error("Note not found.");
  }

  return note;
}

function deleteNote(noteId) {
  getDb().prepare("DELETE FROM notes WHERE id = ?").run(noteId);
  return { id: noteId };
}

module.exports = {
  findNotesByUserId,
  findNoteById,
  insertNote,
  updateNote,
  deleteNote,
};
