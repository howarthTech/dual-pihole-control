// ---------------------------------------------------------------------------
// Direct mode: talk to the Pi-hole v6 REST API straight from the extension.
//
// Extensions with host permissions are exempt from CORS, so no backend is
// needed. Each action logs in (POST /api/auth), does its work, and logs out
// (DELETE /api/auth) so Pi-hole session slots are not exhausted.
//
// Direct mode supports Pi-hole v6 only. v5 users should use backend mode.
// Recommend a Pi-hole *app password* (Settings -> Web Interface / API) so the
// real admin password is never stored in the browser.
// ---------------------------------------------------------------------------

(function (global) {
  'use strict';

  const REQUEST_TIMEOUT_MS = 8000;

  // fetch with a timeout; throws clean, user-displayable errors.
  async function request(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Timed out.');
      throw new Error('Cannot reach Pi-hole. Check the URL.');
    } finally {
      clearTimeout(timeout);
    }
  }

  // POST /api/auth -> sid (null when the Pi-hole has no web password).
  async function login(pihole) {
    const res = await request(`${pihole.baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pihole.password || '' }),
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('Authentication failed (wrong password).');
    }
    if (!res.ok) throw new Error(`Auth failed (HTTP ${res.status}).`);

    const data = await res.json().catch(() => ({}));
    const session = data.session || {};
    if (!session.sid) {
      if (session.valid === true) return null; // no-password Pi-hole
      throw new Error('Authentication failed (wrong password).');
    }
    return session.sid;
  }

  async function logout(pihole, sid) {
    if (!sid) return;
    try {
      await request(`${pihole.baseUrl}/api/auth`, {
        method: 'DELETE',
        headers: { sid },
      });
    } catch (e) {
      // Logout failures must never mask the real result.
    }
  }

  function sidHeaders(sid, extra) {
    return sid ? { sid, ...extra } : { ...extra };
  }

  // GET /api/dns/blocking -> { blocking, timer }
  async function getBlocking(pihole, sid) {
    const res = await request(`${pihole.baseUrl}/api/dns/blocking`, {
      headers: sidHeaders(sid),
    });
    if (!res.ok) throw new Error(`Status failed (HTTP ${res.status}).`);
    const raw = await res.json().catch(() => ({}));
    return {
      blocking: raw.blocking === true || raw.blocking === 'enabled',
      timer: raw.timer != null ? raw.timer : null,
    };
  }

  // POST /api/dns/blocking -> { blocking, timer }
  async function setBlocking(pihole, sid, blocking, timer) {
    const res = await request(`${pihole.baseUrl}/api/dns/blocking`, {
      method: 'POST',
      headers: sidHeaders(sid, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ blocking: !!blocking, timer: timer != null ? timer : null }),
    });
    if (!res.ok) throw new Error(`Set-blocking failed (HTTP ${res.status}).`);
    const raw = await res.json().catch(() => ({}));
    return {
      blocking: raw.blocking === true || raw.blocking === 'enabled',
      timer: raw.timer != null ? raw.timer : null,
    };
  }

  // GET /api/stats/summary -> popup stats shape (best effort).
  async function getStats(pihole, sid) {
    const res = await request(`${pihole.baseUrl}/api/stats/summary`, {
      headers: sidHeaders(sid),
    });
    if (!res.ok) throw new Error(`Stats failed (HTTP ${res.status}).`);
    const data = await res.json().catch(() => ({}));
    const q = data.queries || {};
    const g = data.gravity || {};
    return {
      queriesTotal: q.total != null ? q.total : null,
      queriesBlocked: q.blocked != null ? q.blocked : null,
      percentBlocked: q.percent_blocked != null ? q.percent_blocked : null,
      domainsOnBlocklist: g.domains_being_blocked != null ? g.domains_being_blocked : null,
    };
  }

  // Run one action against one Pi-hole; always returns a result object
  // (never throws) in the same shape the backend produces.
  async function runOne(pihole, action, seconds) {
    let sid = null;
    try {
      sid = await login(pihole);

      if (action === 'status') {
        const state = await getBlocking(pihole, sid);
        let stats = null;
        try { stats = await getStats(pihole, sid); } catch (e) { /* best effort */ }
        return { name: pihole.name, ok: true, ...state, stats };
      }
      if (action === 'disable') {
        const state = await setBlocking(pihole, sid, false, seconds);
        return { name: pihole.name, ok: true, ...state };
      }
      if (action === 'enable') {
        const state = await setBlocking(pihole, sid, true, null);
        return { name: pihole.name, ok: true, ...state };
      }
      throw new Error(`Unknown action: ${action}`);
    } catch (e) {
      return { name: pihole.name, ok: false, error: e.message || 'Unknown error.' };
    } finally {
      await logout(pihole, sid);
    }
  }

  // Fan an action out to every configured Pi-hole concurrently. Returns the
  // same response shape as the backend API, so popup rendering is identical.
  async function fanOut(piholes, action, seconds) {
    const results = await Promise.all(
      piholes.map((p) => runOne(p, action, seconds))
    );
    return {
      ok: results.every((r) => r.ok),
      action,
      seconds,
      results,
    };
  }

  global.piholeDirect = { fanOut };
})(window);
