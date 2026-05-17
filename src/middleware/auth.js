'use strict';

// ---------------------------------------------------------------------------
// Bearer-token auth middleware. All /api/* control endpoints require:
//   Authorization: Bearer <CONTROL_TOKEN>
// The token is compared in constant time to limit timing side-channels.
// ---------------------------------------------------------------------------

const crypto = require('crypto');
const config = require('../config');

// Constant-time string comparison that does not leak length easily.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match || !safeEqual(match[1], config.controlToken)) {
    // Never echo the supplied token back.
    return res.status(401).json({ ok: false, error: 'Unauthorized: invalid or missing token.' });
  }
  next();
}

module.exports = requireAuth;
