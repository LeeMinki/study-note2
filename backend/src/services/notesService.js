const { createNote, updateNote } = require("../models/note");
const { listNotes, saveNotes } = require("../repositories/fileNoteRepository");
const { compareCreatedAtDescending } = require("../utils/dateFormat");
const { normalizeSingleTag } = require("../utils/normalizeTags");

function filterNotes(notes, query = {}) {
  const normalizedTag = normalizeSingleTag(query.tag);
  const normalizedSearch = typeof query.search === "string"
    ? query.search.trim().toLowerCase()
    : "";

  return notes.filter((note) => {
    const matchesTag = normalizedTag ? note.tags.includes(normalizedTag) : true;
    const matchesSearch = normalizedSearch
      ? note.title.toLowerCase().includes(normalizedSearch) ||
        note.content.toLowerCase().includes(normalizedSearch)
      : true;

    return matchesTag && matchesSearch;
  });
}

async function getNotes(query = {}) {
  const notes = await listNotes();

  return filterNotes(notes, query).sort(compareCreatedAtDescending);
}

async function createNoteRecord(input) {
  const notes = await listNotes();
  const nextNote = createNote(input);

  await saveNotes([nextNote, ...notes].sort(compareCreatedAtDescending));

  return nextNote;
}

async function updateNoteRecord(noteId, input) {
  const notes = await listNotes();
  const targetIndex = notes.findIndex((note) => note.id === noteId);

  if (targetIndex === -1) {
    throw new Error("Note not found.");
  }

  const nextNote = updateNote(notes[targetIndex], input);
  const nextNotes = [...notes];
  nextNotes[targetIndex] = nextNote;

  await saveNotes(nextNotes.sort(compareCreatedAtDescending));

  return nextNote;
}

async function deleteNoteRecord(noteId) {
  const notes = await listNotes();
  const remainingNotes = notes.filter((note) => note.id !== noteId);

  if (remainingNotes.length === notes.length) {
    throw new Error("Note not found.");
  }

  await saveNotes(remainingNotes.sort(compareCreatedAtDescending));

  return { id: noteId };
}

module.exports = {
  getNotes,
  createNoteRecord,
  updateNoteRecord,
  deleteNoteRecord,
};
