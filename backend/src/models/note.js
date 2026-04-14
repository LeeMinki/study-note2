const { createTimestamp } = require("../utils/dateFormat");
const { normalizeTags } = require("../utils/normalizeTags");

function createNoteId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function validateNoteInput(input) {
  const title = sanitizeText(input.title);

  if (!title) {
    throw new Error("Title is required.");
  }

  return {
    title,
    content: typeof input.content === "string" ? input.content : "",
    tags: normalizeTags(input.tags),
  };
}

function createNote(input, userId, now = createTimestamp()) {
  const sanitizedInput = validateNoteInput(input);

  return {
    id: createNoteId(),
    userId: typeof userId === "string" ? userId : null,
    title: sanitizedInput.title,
    content: sanitizedInput.content,
    tags: sanitizedInput.tags,
    createdAt: now,
    updatedAt: now,
  };
}

function updateNote(currentNote, input, now = createTimestamp()) {
  const sanitizedInput = validateNoteInput(input);

  return {
    ...currentNote,
    title: sanitizedInput.title,
    content: sanitizedInput.content,
    tags: sanitizedInput.tags,
    updatedAt: now,
  };
}

module.exports = {
  createNote,
  updateNote,
  validateNoteInput,
};
