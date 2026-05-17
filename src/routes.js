'use strict';

// ---------------------------------------------------------------------------
// API routes. Control endpoints fan out to every configured Pi-hole using
// Promise.allSettled so one failing server never blocks the others.
// ---------------------------------------------------------------------------

const express = require('express');
const config = require('./config');
const PiHoleClient = require('./piholeClient');
const requireAuth = require('./middleware/auth');
const { controlLimiter, statusLimiter } = require('./middleware/rateLimit');

const router = express.Router();

// Run an async operation against one Pi-hole, always logging out afterwards.
// Returns a normalized per-server result object (never throws).
async function runForPihole(cfg, op) {
  const client = new PiHoleClient(cfg);
  try {
    await client.login();
    const data = await op(client);
    return { name: cfg.name, ok: true, ...data };
  } catch (err) {
    return { name: cfg.name, ok: false, error: cleanError(err) };
  } finally {
    // Always attempt logout to release the Pi-hole session slot.
    await client.logout();
  }
}

// Turn an error into a short, secret-free message.
function cleanError(err) {
  if (err && err.code === 'ECONNREFUSED') return 'Connection refused.';
  if (err && err.code === 'ETIMEDOUT') return 'Connection timed out.';
  if (err && err.code === 'ENOTFOUND') return 'Host not found.';
  if (err && err.code === 'ECONNABORTED') return 'Request timed out.';
  return (err && err.message) ? err.message : 'Unknown error.';
}

// Fan out an operation to all Pi-holes and collect results.
async function fanOut(op) {
  const settled = await Promise.allSettled(
    config.piholes.map((cfg) => runForPihole(cfg, op))
  );
  // runForPihole never rejects, but guard anyway.
  return settled.map((s) =>
    s.status === 'fulfilled'
      ? s.value
      : { name: 'unknown', ok: false, error: 'Internal error.' }
  );
}

// --- GET /health (no auth, no secrets) -------------------------------------
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'dual-pihole-control',
    piholes: config.piholes.map((p) => ({ name: p.name, apiVersion: p.apiVersion })),
  });
});

// --- GET /api/status -------------------------------------------------------
// Returns blocking state plus basic statistics for each Pi-hole.
router.get('/api/status', requireAuth, statusLimiter, async (req, res) => {
  const results = await fanOut(async (client) => {
    const blocking = await client.getStatus();
    let stats = null;
    try {
      stats = await client.getStats();
    } catch (_) {
      // Stats are best-effort; a stats failure must not fail the status call.
    }
    return { ...blocking, stats };
  });
  res.json({ ok: results.every((r) => r.ok), action: 'status', results });
});

// --- POST /api/disable -----------------------------------------------------
router.post('/api/disable', requireAuth, controlLimiter, async (req, res) => {
  let seconds = parseInt(req.body && req.body.seconds, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    seconds = config.defaultDisableSeconds;
  }
  // Cap to a sane maximum (24h) to avoid silly values.
  seconds = Math.min(seconds, 86400);

  const results = await fanOut((client) => client.setBlocking(false, seconds));
  res.json({
    ok: results.every((r) => r.ok),
    action: 'disable',
    seconds,
    results,
  });
});

// --- POST /api/enable ------------------------------------------------------
router.post('/api/enable', requireAuth, controlLimiter, async (req, res) => {
  const results = await fanOut((client) => client.setBlocking(true, null));
  res.json({
    ok: results.every((r) => r.ok),
    action: 'enable',
    results,
  });
});

// --- POST /api/toggle ------------------------------------------------------
// Reads current status of each Pi-hole, then flips each one individually.
router.post('/api/toggle', requireAuth, controlLimiter, async (req, res) => {
  let seconds = parseInt(req.body && req.body.seconds, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    seconds = config.defaultDisableSeconds;
  }
  seconds = Math.min(seconds, 86400);

  const results = await fanOut(async (client) => {
    const status = await client.getStatus();
    // If currently blocking -> disable for `seconds`; else -> enable.
    if (status.blocking) {
      return client.setBlocking(false, seconds);
    }
    return client.setBlocking(true, null);
  });

  res.json({
    ok: results.every((r) => r.ok),
    action: 'toggle',
    seconds,
    results,
  });
});

module.exports = router;
