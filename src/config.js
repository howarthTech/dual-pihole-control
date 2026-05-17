'use strict';

// ---------------------------------------------------------------------------
// Loads and validates configuration from environment variables (.env file).
// No secrets are logged here.
// ---------------------------------------------------------------------------

require('dotenv').config();

// Discover Pi-hole entries by scanning for PIHOLE_<n>_BASE_URL variables.
// This lets you add a 3rd, 4th, ... Pi-hole later without code changes.
function loadPiholes() {
  const piholes = [];
  for (let i = 1; i <= 50; i++) {
    const baseUrl = process.env[`PIHOLE_${i}_BASE_URL`];
    if (!baseUrl) continue;

    const password = process.env[`PIHOLE_${i}_PASSWORD`] || '';
    const name = process.env[`PIHOLE_${i}_NAME`] || `Pi-hole ${i}`;
    const apiVersion = process.env[`PIHOLE_${i}_API_VERSION`] || '6';

    piholes.push({
      id: i,
      name,
      // Strip any trailing slash so URL building is predictable.
      baseUrl: baseUrl.replace(/\/+$/, ''),
      password,
      apiVersion: String(apiVersion).trim(),
    });
  }
  return piholes;
}

const piholes = loadPiholes();

const config = {
  port: parseInt(process.env.PORT, 10) || 8088,
  controlToken: process.env.CONTROL_TOKEN || '',
  defaultDisableSeconds: parseInt(process.env.DEFAULT_DISABLE_SECONDS, 10) || 300,
  // Split allowed origins into an array; empty entries are removed.
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  piholes,
};

// Fail fast on obvious misconfiguration so problems are visible at startup.
function validate() {
  const problems = [];
  if (!config.controlToken || config.controlToken === 'change-this-long-random-token') {
    problems.push('CONTROL_TOKEN is missing or still set to the placeholder value.');
  }
  if (config.piholes.length === 0) {
    problems.push('No Pi-holes configured (set PIHOLE_1_BASE_URL, etc.).');
  }
  config.piholes.forEach((p) => {
    if (!p.password) problems.push(`PIHOLE_${p.id}_PASSWORD is empty.`);
  });
  return problems;
}

config.validate = validate;

module.exports = config;
