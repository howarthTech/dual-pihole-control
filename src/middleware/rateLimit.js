'use strict';

// ---------------------------------------------------------------------------
// Rate limiting to guard against accidental rapid-fire disable/enable clicks.
// This is a LAN convenience, not a security boundary.
// ---------------------------------------------------------------------------

const rateLimit = require('express-rate-limit');

// Applied to control endpoints (disable/enable/toggle).
const controlLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 second window
  max: 8, // up to 8 control requests per window per client
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, slow down a moment.' },
});

// A looser limiter for read-only status polling.
const statusLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many status requests, slow down a moment.' },
});

module.exports = { controlLimiter, statusLimiter };
