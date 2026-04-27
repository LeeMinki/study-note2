const express = require("express");
const {
  createGroupHandler,
  deleteGroupHandler,
  listGroupsHandler,
  renameGroupHandler,
} = require("../controllers/groupsController");

const router = express.Router();

router.get("/", listGroupsHandler);
router.post("/", createGroupHandler);
router.patch("/:groupId", renameGroupHandler);
router.delete("/:groupId", deleteGroupHandler);

module.exports = router;
