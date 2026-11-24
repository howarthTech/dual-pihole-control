'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const PiHoleClient = require('../src/piholeClient');

// Replace only the HTTP boundary: no network, environment files, or real credentials.
function client(apiVersion = '6') {
  const instance = new PiHoleClient({
    name: 'Test Pi-hole',
    baseUrl: 'http://pihole.invalid',
    password: 'test-password',
    apiVersion,
  });
  instance.http = {};
  return instance;
}

test('v6 carries the login session through status, blocking changes, and logout', async () => {
  const pihole = client();
  const calls = [];
  pihole.http.post = async (...args) => {
    calls.push(args);
    return args[0] === '/api/auth'
      ? { status: 200, data: { session: { valid: true, sid: 'test-session' } } }
      : { status: 200, data: { blocking: 'disabled', timer: 60 } };
  };
  pihole.http.get = async (...args) => {
    calls.push(args);
    return { status: 200, data: { blocking: 'enabled' } };
  };
  pihole.http.delete = async (...args) => { calls.push(args); };

  await pihole.login();
  assert.deepEqual(await pihole.getStatus(), { blocking: true, timer: null });
  assert.deepEqual(await pihole.setBlocking(false, 60), { blocking: false, timer: 60 });
  await pihole.logout();

  assert.deepEqual(calls, [
    ['/api/auth', { password: 'test-password' }],
    ['/api/dns/blocking', { headers: { sid: 'test-session' } }],
    ['/api/dns/blocking', { blocking: false, timer: 60 }, { headers: { sid: 'test-session' } }],
    ['/api/auth', { headers: { sid: 'test-session' } }],
  ]);
  assert.equal(pihole.sid, null);
});

test('v6 accepts passwordless sessions without sending a session header or logout', async () => {
  const pihole = client();
  pihole.http.post = async () => ({ status: 200, data: { session: { valid: true, sid: null } } });
  pihole.http.get = async (path, options) => {
    assert.equal(path, '/api/dns/blocking');
    assert.deepEqual(options, { headers: {} });
    return { status: 200, data: { blocking: false, timer: 0 } };
  };
  let logoutCalls = 0;
  pihole.http.delete = async () => { logoutCalls++; };
  await pihole.login();
  assert.deepEqual(await pihole.getStatus(), { blocking: false, timer: 0 });
  await pihole.logout();
  assert.equal(logoutCalls, 0);
});

test('v6 rejects denied authentication and responses without a valid session', async () => {
  for (const response of [
    { status: 401 },
    { status: 403 },
    { status: 200, data: { session: { valid: false } } },
  ]) {
    const pihole = client();
    pihole.http.post = async () => response;
    await assert.rejects(pihole.login(), {
      message: 'Authentication failed (wrong Pi-hole password).',
    });
    assert.equal(pihole.sid, null);
  }
});

test('v6 normalizes statistics, preserves zero counts, and rejects HTTP failures', async () => {
  const pihole = client();
  pihole.http.get = async (path) => {
    assert.equal(path, '/api/stats/summary');
    return { status: 200, data: { queries: { total: 10, blocked: 0, percent_blocked: 0 } } };
  };
  assert.deepEqual(await pihole.getStats(), {
    queriesTotal: 10, queriesBlocked: 0, percentBlocked: 0, domainsOnBlocklist: null,
  });
  pihole.http.get = async () => ({ status: 503 });
  await assert.rejects(pihole.getStats(), { message: 'Stats request failed with HTTP 503.' });
});

test('v5 uses stateless legacy requests for status, enable, and timed disable', async () => {
  const pihole = client('5');
  const calls = [];
  pihole.http.get = async (path, options) => {
    calls.push([path, options]);
    return { status: 200, data: { status: 'disable' in options.params ? 'disabled' : 'enabled' } };
  };
  await pihole.login();
  assert.deepEqual(await pihole.getStatus(), { blocking: true, timer: null });
  assert.deepEqual(await pihole.setBlocking(false, 120), { blocking: false, timer: 120 });
  assert.deepEqual(await pihole.setBlocking(true, null), { blocking: true, timer: null });
  await pihole.logout();
  assert.deepEqual(calls, [
    ['/admin/api.php', { params: { status: '', auth: 'test-password' } }],
    ['/admin/api.php', { params: { disable: 120, auth: 'test-password' } }],
    ['/admin/api.php', { params: { enable: '', auth: 'test-password' } }],
  ]);
});
