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

function validateRequiredProfileField(value, fieldLabel) {
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  if (!normalizedValue) {
    throw new Error(`${fieldLabel}은(는) 필수입니다.`);
  }

  if (normalizedValue.length > 30) {
    throw new Error(`${fieldLabel}은(는) 30자 이하여야 합니다.`);
  }

  return normalizedValue;
}

function validateUserInput(input) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = validateRequiredProfileField(input.name, "이름");
  const displayName = validateRequiredProfileField(input.displayName, "표시 이름");

  if (!validateEmail(email)) {
    throw new Error("유효하지 않은 이메일 형식입니다.");
  }

  if (!validatePassword(input.password)) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }

  return {
    email,
    name,
    displayName,
    password: input.password,
  };
}

// SSO 확장을 위해 provider 필드 포함 ("local" | "google" | "github")
function createUser({ email, passwordHash, name, displayName }, now = createTimestamp()) {
  return {
    id: createUserId(),
    email,
    name,
    displayName,
    passwordHash,
    provider: "local",
    createdAt: now,
  };
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    displayName: user.displayName || "",
    createdAt: user.createdAt,
    provider: user.provider,
  };
}

module.exports = {
  createUser,
  toPublicUser,
  validateUserInput,
  validateEmail,
  validateRequiredProfileField,
};
