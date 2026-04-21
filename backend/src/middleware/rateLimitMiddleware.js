'use strict';

const { createErrorResponse } = require('../utils/responseEnvelope');

const store = new Map(); // Map<ip, { count, resetAt }>

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 20;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (entry.resetAt < now) store.delete(ip);
  }
}, 5 * 60 * 1000).unref();

function rateLimit(req, res, next) {
  const ip =
    req.ip ||
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : null) ||
    'unknown';
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json(createErrorResponse('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'));
  }
  next();
}

module.exports = { rateLimit };
