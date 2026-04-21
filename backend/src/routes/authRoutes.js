const express = require("express");
const {
  registerHandler,
  loginHandler,
  currentUserHandler,
  updateCurrentUserHandler,
  updateCurrentUserPasswordHandler,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { rateLimit } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post("/register", rateLimit, registerHandler);
router.post("/login", rateLimit, loginHandler);
router.get("/me", requireAuth, currentUserHandler);
router.patch("/me", requireAuth, updateCurrentUserHandler);
router.patch("/me/password", requireAuth, updateCurrentUserPasswordHandler);

module.exports = router;
