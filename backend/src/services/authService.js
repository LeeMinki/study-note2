const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, toPublicUser, validateUserInput } = require("../models/user");
const { findUserByEmail, saveUser } = require("../repositories/fileUserRepository");

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

module.exports = {
  register,
  login,
  verifyToken,
};
