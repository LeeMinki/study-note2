const express = require("express");
const {
  registerHandler,
  loginHandler,
  currentUserHandler,
  updateCurrentUserHandler,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", requireAuth, currentUserHandler);
router.patch("/me", requireAuth, updateCurrentUserHandler);

module.exports = router;
