const {
  createErrorResponse,
  createSuccessResponse,
} = require("../utils/responseEnvelope");
const {
  getNotes,
  createNoteRecord,
  updateNoteRecord,
  deleteNoteRecord,
} = require("../services/notesService");

function getStatusCode(error) {
  if (error.message === "Note not found.") {
    return 404;
  }

  if (error.message === "Title is required." || error.message === "Invalid notes data file.") {
    return 400;
  }

  return 500;
}

async function listNotesHandler(request, response) {
  try {
    const notes = await getNotes(request.query);
    response.status(200).json(createSuccessResponse(notes));
  } catch (error) {
    response.status(getStatusCode(error)).json(createErrorResponse(error.message));
  }
}

async function createNoteHandler(request, response) {
  try {
    const note = await createNoteRecord(request.body);
    response.status(201).json(createSuccessResponse(note));
  } catch (error) {
    response.status(getStatusCode(error)).json(createErrorResponse(error.message));
  }
}

async function updateNoteHandler(request, response) {
  try {
    const note = await updateNoteRecord(request.params.noteId, request.body);
    response.status(200).json(createSuccessResponse(note));
  } catch (error) {
    response.status(getStatusCode(error)).json(createErrorResponse(error.message));
  }
}

async function deleteNoteHandler(request, response) {
  try {
    const result = await deleteNoteRecord(request.params.noteId);
    response.status(200).json(createSuccessResponse(result));
  } catch (error) {
    response.status(getStatusCode(error)).json(createErrorResponse(error.message));
  }
}

module.exports = {
  listNotesHandler,
  createNoteHandler,
  updateNoteHandler,
  deleteNoteHandler,
};
