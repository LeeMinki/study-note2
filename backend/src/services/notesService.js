const { createNote, updateNote } = require("../models/note");
const {
  findNotesByUserId,
  findNoteById,
  insertNote,
  updateNote: dbUpdateNote,
  deleteNote,
} = require("../repositories/dbNoteRepository");

async function getNotes(query = {}, userId = null) {
  return findNotesByUserId(userId, query);
}

async function createNoteRecord(input, userId = null) {
  const nextNote = createNote(input, userId);
  return insertNote(nextNote);
}

async function updateNoteRecord(noteId, input, userId = null) {
  const existing = findNoteById(noteId);

  if (!existing) {
    throw new Error("Note not found.");
  }

  // 소유자가 아닌 노트는 찾을 수 없는 것처럼 처리 (소유자 정보 노출 방지)
  if (existing.userId !== userId) {
    throw new Error("Note not found.");
  }

  const nextNote = updateNote(existing, input);
  return dbUpdateNote(nextNote);
}

async function deleteNoteRecord(noteId, userId = null) {
  const existing = findNoteById(noteId);

  if (!existing) {
    throw new Error("Note not found.");
  }

  // 소유자가 아닌 노트는 찾을 수 없는 것처럼 처리
  if (existing.userId !== userId) {
    throw new Error("Note not found.");
  }

  return deleteNote(noteId);
}

module.exports = {
  getNotes,
  createNoteRecord,
  updateNoteRecord,
  deleteNoteRecord,
};
