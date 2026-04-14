const { createNote, updateNote } = require("../models/note");
const { listNotes, saveNotes } = require("../repositories/fileNoteRepository");
const { compareCreatedAtDescending } = require("../utils/dateFormat");
const { normalizeSingleTag } = require("../utils/normalizeTags");

function filterNotes(notes, query = {}, userId = null) {
  const normalizedTag = normalizeSingleTag(query.tag);
  const normalizedSearch = typeof query.search === "string"
    ? query.search.trim().toLowerCase()
    : "";

  return notes.filter((note) => {
    // 계정별 노트 격리: userId가 일치하는 노트만 반환
    if (note.userId !== userId) return false;

    const matchesTag = normalizedTag ? note.tags.includes(normalizedTag) : true;
    const matchesSearch = normalizedSearch
      ? note.title.toLowerCase().includes(normalizedSearch) ||
        note.content.toLowerCase().includes(normalizedSearch)
      : true;

    return matchesTag && matchesSearch;
  });
}

async function getNotes(query = {}, userId = null) {
  const notes = await listNotes();

  return filterNotes(notes, query, userId).sort(compareCreatedAtDescending);
}

async function createNoteRecord(input, userId = null) {
  const notes = await listNotes();
  const nextNote = createNote(input, userId);

  await saveNotes([nextNote, ...notes].sort(compareCreatedAtDescending));

  return nextNote;
}

async function updateNoteRecord(noteId, input, userId = null) {
  const notes = await listNotes();
  const targetIndex = notes.findIndex((note) => note.id === noteId);

  if (targetIndex === -1) {
    throw new Error("Note not found.");
  }

  // 소유자가 아닌 노트는 찾을 수 없는 것처럼 처리 (소유자 정보 노출 방지)
  if (notes[targetIndex].userId !== userId) {
    throw new Error("Note not found.");
  }

  const nextNote = updateNote(notes[targetIndex], input);
  const nextNotes = [...notes];
  nextNotes[targetIndex] = nextNote;

  await saveNotes(nextNotes.sort(compareCreatedAtDescending));

  return nextNote;
}

async function deleteNoteRecord(noteId, userId = null) {
  const notes = await listNotes();
  const target = notes.find((note) => note.id === noteId);

  if (!target) {
    throw new Error("Note not found.");
  }

  // 소유자가 아닌 노트는 찾을 수 없는 것처럼 처리
  if (target.userId !== userId) {
    throw new Error("Note not found.");
  }

  const remainingNotes = notes.filter((note) => note.id !== noteId);

  await saveNotes(remainingNotes.sort(compareCreatedAtDescending));

  return { id: noteId };
}

module.exports = {
  getNotes,
  createNoteRecord,
  updateNoteRecord,
  deleteNoteRecord,
};
