const express = require("express");
const {
  registerHandler,
  loginHandler,
  currentUserHandler,
  updateCurrentUserHandler,
  updateCurrentUserPasswordHandler,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", requireAuth, currentUserHandler);
router.patch("/me", requireAuth, updateCurrentUserHandler);
router.patch("/me/password", requireAuth, updateCurrentUserPasswordHandler);

module.exports = router;
