'use strict';

// ---------------------------------------------------------------------------
// dual-pihole-control backend entry point.
// LAN / private use only - do NOT expose this to the public internet.
// ---------------------------------------------------------------------------

const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();

// Behind Docker's port mapping; trust the first proxy hop so rate-limit and
// req.ip behave sensibly.
app.set('trust proxy', 1);

app.use(express.json({ limit: '16kb' }));

// --- CORS: restricted to configured origins --------------------------------
const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl, health checks) which send no Origin.
    if (!origin) return callback(null, true);

    const allowed = config.allowedOrigins.some((pattern) => {
      if (pattern === '*') return true;
      // Support a trailing "*" wildcard, e.g. moz-extension://*
      if (pattern.endsWith('*')) {
        return origin.startsWith(pattern.slice(0, -1));
      }
      return origin === pattern;
    });
    callback(null, allowed);
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// --- Request logging (no secrets) ------------------------------------------
// Logs method, path, status and duration. Authorization header and bodies are
// never logged so tokens/passwords cannot leak into container logs.
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${ms}ms`
    );
  });
  next();
});

// --- Routes ----------------------------------------------------------------
app.use('/', routes);

// 404 fallback.
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found.' });
});

// Error handler - keep messages generic, log details server-side only.
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} ERROR ${req.method} ${req.path}: ${err.message}`);
  res.status(500).json({ ok: false, error: 'Internal server error.' });
});

// --- Startup ---------------------------------------------------------------
const problems = config.validate();
if (problems.length) {
  console.warn('Configuration warnings:');
  problems.forEach((p) => console.warn(`  - ${p}`));
}

app.listen(config.port, () => {
  console.log(
    `dual-pihole-control v0.1.0 listening on port ${config.port} ` +
    `(${config.piholes.length} Pi-hole(s) configured)`
  );
});
