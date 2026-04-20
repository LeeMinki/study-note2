'use strict';

const crypto = require('crypto');
const { createSSOUser } = require('../models/user');
const {
  findUserByProviderId,
  findUserByEmail,
  saveUser,
  updateUser,
} = require('../repositories/dbUserRepository');

// ── State store (CSRF 방지) ──────────────────────────────────────────────────
// 단일 프로세스 in-memory Map. TTL 10분.
const STATE_TTL_MS = 10 * 60 * 1000;
const ssoStateStore = new Map();

// TTL 만료 state 자동 정리 (1분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, { createdAt }] of ssoStateStore.entries()) {
    if (now - createdAt > STATE_TTL_MS) {
      ssoStateStore.delete(key);
    }
  }
}, 60_000).unref();

function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

// userId: null이면 로그인 flow, string이면 계정 연결 flow
function storeState(state, userId = null) {
  ssoStateStore.set(state, { createdAt: Date.now(), userId });
}

// 반환: null(무효) | { userId: string|null }
function validateAndConsumeState(state) {
  const entry = ssoStateStore.get(state);
  if (!entry) return null;
  ssoStateStore.delete(state);
  if (Date.now() - entry.createdAt > STATE_TTL_MS) return null;
  return { userId: entry.userId };
}

// ── Google OAuth2 URL 생성 ───────────────────────────────────────────────────
function buildGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ── Token 교환 ───────────────────────────────────────────────────────────────
async function exchangeCodeForToken(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || 'Google token exchange 실패');
  }

  return data.access_token;
}

// ── 사용자 정보 조회 ─────────────────────────────────────────────────────────
async function getGoogleUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Google userinfo 조회 실패');
  }

  return {
    sub: data.sub,
    email: data.email,
    emailVerified: data.email_verified,
    name: data.name,
  };
}

// ── 계정 조회 / 생성 / 연결 ──────────────────────────────────────────────────
async function findOrCreateUser(googleProfile) {
  const { sub, email, emailVerified, name } = googleProfile;

  // 1. Google sub 기준 기존 SSO 계정 조회
  const existingSSO = findUserByProviderId('google', sub);
  if (existingSSO) return existingSSO;

  // 2. 이메일 기준 local 계정 조회
  const existingLocal = findUserByEmail(email);

  if (existingLocal) {
    // 이메일 미인증이면 계정 연결 거부
    if (!emailVerified) {
      const err = new Error('Google 이메일이 인증되지 않아 계정을 연결할 수 없습니다.');
      err.code = 'email_not_verified';
      throw err;
    }
    // 기존 local 계정에 provider/provider_id 연결 (password_hash 유지)
    const linked = { ...existingLocal, provider: 'google', providerId: sub };
    updateUser(linked);
    return linked;
  }

  // 3. 신규 SSO 계정 생성
  const displayName = name || email.split('@')[0];
  const newUser = createSSOUser({
    email,
    name: displayName,
    displayName,
    provider: 'google',
    providerId: sub,
  });
  saveUser(newUser);
  return newUser;
}

module.exports = {
  generateState,
  storeState,
  validateAndConsumeState,
  buildGoogleAuthUrl,
  exchangeCodeForToken,
  getGoogleUserInfo,
  findOrCreateUser,
};
