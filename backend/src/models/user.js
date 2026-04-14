const { createTimestamp } = require("../utils/dateFormat");

function createUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6;
}

function validateUserInput(input) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";

  if (!validateEmail(email)) {
    throw new Error("유효하지 않은 이메일 형식입니다.");
  }

  if (!validatePassword(input.password)) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }

  return { email, password: input.password };
}

// SSO 확장을 위해 provider 필드 포함 ("local" | "google" | "github")
function createUser(email, passwordHash, now = createTimestamp()) {
  return {
    id: createUserId(),
    email,
    passwordHash,
    provider: "local",
    createdAt: now,
  };
}

module.exports = {
  createUser,
  validateUserInput,
  validateEmail,
};
