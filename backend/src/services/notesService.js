const { createNote, updateNote } = require("../models/note");
const {
  findNotesByUserId,
  findNoteById,
  insertNote,
  updateNote: dbUpdateNote,
  deleteNote,
} = require("../repositories/dbNoteRepository");
const { normalizeGroupId } = require("../models/group");
const { findGroupByUserIdAndId } = require("../repositories/dbGroupRepository");

function ensureGroupIsAvailable(userId, groupId) {
  const normalizedGroupId = normalizeGroupId(groupId);
  if (!normalizedGroupId) {
    return null;
  }

  const group = findGroupByUserIdAndId(userId, normalizedGroupId);
  if (!group) {
    throw new Error("Group not found.");
  }

  return normalizedGroupId;
}

function normalizeNoteQuery(query = {}, userId = null) {
  if (query.groupId && query.group === "none") {
    throw new Error("Group filter conflict.");
  }

  const normalizedQuery = {
    search: query.search,
    tag: query.tag,
  };

  if (query.group === "none") {
    normalizedQuery.group = "none";
    return normalizedQuery;
  }

  if (query.groupId) {
    normalizedQuery.groupId = ensureGroupIsAvailable(userId, query.groupId);
  }

  return normalizedQuery;
}

async function getNotes(query = {}, userId = null) {
  return findNotesByUserId(userId, normalizeNoteQuery(query, userId));
}

async function createNoteRecord(input, userId = null) {
  const nextNote = createNote(input, userId);
  nextNote.groupId = ensureGroupIsAvailable(userId, nextNote.groupId);
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
  nextNote.groupId = ensureGroupIsAvailable(userId, nextNote.groupId);
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
  ensureGroupIsAvailable,
  updateNoteRecord,
  deleteNoteRecord,
};
