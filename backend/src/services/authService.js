const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createUser,
  toPublicUser,
  validateRequiredProfileField,
  validateUserInput,
} = require("../models/user");
const {
  findUserByEmail,
  findUserById,
  saveUser,
  updateUser,
} = require("../repositories/dbUserRepository");

// JWT_SECRET 미설정 시 개발용 fallback (프로덕션에서는 환경변수 필수)
const JWT_SECRET = process.env.JWT_SECRET || "study-note-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function register(input) {
  const {
    email,
    password,
    name,
    displayName,
  } = validateUserInput(input);

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("이미 사용 중인 이메일입니다.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = createUser({
    email,
    passwordHash,
    name,
    displayName,
  });
  await saveUser(user);

  const token = createToken(user);

  return {
    token,
    user: toPublicUser(user),
  };
}

async function login(input) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  const user = await findUserByEmail(email);

  // 계정 존재 여부를 노출하지 않기 위해 통합 오류 메시지 사용
  if (!user) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const token = createToken(user);

  return {
    token,
    user: toPublicUser(user),
  };
}

async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return toPublicUser(user);
}

async function updateCurrentUser(userId, input) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  const nextUser = {
    ...user,
    name: validateRequiredProfileField(input.name, "이름"),
    displayName: validateRequiredProfileField(input.displayName, "표시 이름"),
  };

  await updateUser(nextUser);

  return toPublicUser(nextUser);
}

async function updateCurrentUserPassword(userId, input) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";

  if (!currentPassword) {
    throw new Error("현재 비밀번호를 입력해주세요.");
  }

  if (newPassword.length < 6) {
    throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new Error("현재 비밀번호가 올바르지 않습니다.");
  }

  const nextUser = {
    ...user,
    passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS),
  };

  await updateUser(nextUser);

  return { updated: true };
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserPassword,
  verifyToken,
};
