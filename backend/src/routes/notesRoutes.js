const express = require("express");
const {
  listNotesHandler,
  createNoteHandler,
  updateNoteHandler,
  deleteNoteHandler,
} = require("../controllers/notesController");

const router = express.Router();

router.get("/", listNotesHandler);
router.post("/", createNoteHandler);
router.patch("/:noteId", updateNoteHandler);
router.delete("/:noteId", deleteNoteHandler);

module.exports = router;
