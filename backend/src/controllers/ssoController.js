'use strict';

const jwt = require('jsonwebtoken');
const { toPublicUser } = require('../models/user');
const {
  generateState,
  storeState,
  validateAndConsumeState,
  buildGoogleAuthUrl,
  exchangeCodeForToken,
  getGoogleUserInfo,
  findOrCreateUser,
} = require('../services/ssoService');
const {
  findUserById,
  findUserByProviderId,
  updateUser,
} = require('../repositories/dbUserRepository');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseEnvelope');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const SUPPORTED_PROVIDERS = ['google'];

function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function getAppBaseUrl() {
  return (process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
}

// GET /api/auth/sso/:provider — 로그인용 리다이렉트
function ssoRedirectHandler(req, res) {
  const { provider } = req.params;

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return res.status(400).json(createErrorResponse('지원하지 않는 SSO 제공자입니다.'));
  }

  const state = generateState();
  storeState(state); // userId=null → 로그인 flow

  return res.redirect(302, buildGoogleAuthUrl(state));
}

// POST /api/auth/sso/:provider/link-start — 계정 연결 시작 (로그인 필요)
function ssoLinkStartHandler(req, res) {
  const { provider } = req.params;

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return res.status(400).json(createErrorResponse('지원하지 않는 SSO 제공자입니다.'));
  }

  const userId = req.user.userId;
  const state = generateState();
  storeState(state, userId); // userId 저장 → 연결 flow

  const authUrl = buildGoogleAuthUrl(state);
  return res.status(200).json(createSuccessResponse({ authUrl }));
}

// GET /api/auth/sso/:provider/callback — 로그인 & 계정 연결 공통 콜백
async function ssoCallbackHandler(req, res) {
  const { provider } = req.params;
  const { code, state, error: providerError } = req.query;
  const baseUrl = getAppBaseUrl();

  if (providerError) {
    return res.redirect(`${baseUrl}/?sso_error=provider_error`);
  }

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return res.redirect(`${baseUrl}/?sso_error=provider_error`);
  }

  const stateResult = state ? validateAndConsumeState(state) : null;
  if (!stateResult) {
    return res.redirect(`${baseUrl}/?sso_error=state_mismatch`);
  }

  if (!code) {
    return res.redirect(`${baseUrl}/?sso_error=provider_error`);
  }

  const { userId: linkUserId } = stateResult;
  const isLinkFlow = Boolean(linkUserId);

  try {
    const accessToken = await exchangeCodeForToken(code);
    const googleProfile = await getGoogleUserInfo(accessToken);

    // ── 계정 연결 flow ────────────────────────────────────────────────────────
    if (isLinkFlow) {
      const targetUser = findUserById(linkUserId);
      if (!targetUser) {
        return res.redirect(`${baseUrl}/profile?link_error=server_error`);
      }

      // 이미 연결된 계정인지 확인
      const existingSSO = findUserByProviderId('google', googleProfile.sub);
      if (existingSSO && existingSSO.id !== linkUserId) {
        return res.redirect(`${baseUrl}/profile?link_error=already_linked`);
      }

      updateUser({ ...targetUser, provider: 'google', providerId: googleProfile.sub });
      return res.redirect(`${baseUrl}/profile?link_success=true`);
    }

    // ── 로그인 flow ──────────────────────────────────────────────────────────
    const user = await findOrCreateUser(googleProfile);
    const token = createToken(user);
    return res.redirect(`${baseUrl}/#sso-token=${token}`);

  } catch (err) {
    const errCode = err.code === 'email_not_verified' ? 'email_not_verified' : 'server_error';
    if (isLinkFlow) {
      return res.redirect(`${baseUrl}/profile?link_error=${errCode}`);
    }
    return res.redirect(`${baseUrl}/?sso_error=${errCode}`);
  }
}

module.exports = {
  ssoRedirectHandler,
  ssoLinkStartHandler,
  ssoCallbackHandler,
};
