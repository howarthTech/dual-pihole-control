'use strict';

// ---------------------------------------------------------------------------
// PiHoleClient - talks to a single Pi-hole server.
//
// Primary target: Pi-hole v6 REST API.
//   POST   /api/auth           -> { session: { sid } }      (login)
//   POST   /api/dns/blocking   -> set blocking on/off
//   GET    /api/dns/blocking   -> read blocking status
//   DELETE /api/auth           -> logout
//
// A thin compatibility layer keeps room for Pi-hole v5 (legacy admin API).
// v5 is only attempted when apiVersion === '5'.
// ---------------------------------------------------------------------------

const axios = require('axios');

const REQUEST_TIMEOUT_MS = 8000;

class PiHoleClient {
  /**
   * @param {{name:string, baseUrl:string, password:string, apiVersion:string}} cfg
   */
  constructor(cfg) {
    this.name = cfg.name;
    this.baseUrl = cfg.baseUrl;
    this.password = cfg.password;
    this.apiVersion = cfg.apiVersion || '6';
    this.sid = null;

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: REQUEST_TIMEOUT_MS,
      // Pi-hole often uses self-signed certs over https; reject only obvious
      // failures. For http (typical LAN) this has no effect.
      validateStatus: () => true,
    });
  }

  // --- v6 implementation ----------------------------------------------------

  async _v6Login() {
    const res = await this.http.post('/api/auth', { password: this.password });
    if (res.status === 401 || res.status === 403) {
      throw new Error('Authentication failed (wrong Pi-hole password).');
    }
    if (res.status >= 400) {
      throw new Error(`Auth request failed with HTTP ${res.status}.`);
    }
    // v6 returns { session: { valid: true, sid: "..." } }
    const session = (res.data && res.data.session) || {};
    if (!session.sid) {
      // A Pi-hole with NO web password returns valid:true and sid:null.
      // In that mode the API is unauthenticated and needs no session header.
      if (session.valid === true) {
        this.sid = null;
        return;
      }
      throw new Error('Authentication failed (wrong Pi-hole password).');
    }
    this.sid = session.sid;
  }

  // Session header, only sent when a sid exists (no-password Pi-holes omit it).
  _headers() {
    return this.sid ? { sid: this.sid } : {};
  }

  async _v6GetStatus() {
    const res = await this.http.get('/api/dns/blocking', {
      headers: this._headers(),
    });
    if (res.status >= 400) {
      throw new Error(`Status request failed with HTTP ${res.status}.`);
    }
    // v6 returns { blocking: "enabled"|"disabled", timer: <seconds|null> }
    const raw = res.data || {};
    const blocking = raw.blocking === true || raw.blocking === 'enabled';
    return { blocking, timer: raw.timer != null ? raw.timer : null };
  }

  async _v6SetBlocking(blocking, timer) {
    const body = { blocking: !!blocking, timer: timer != null ? timer : null };
    const res = await this.http.post('/api/dns/blocking', body, {
      headers: this._headers(),
    });
    if (res.status >= 400) {
      throw new Error(`Set-blocking request failed with HTTP ${res.status}.`);
    }
    const raw = res.data || {};
    const result = raw.blocking === true || raw.blocking === 'enabled';
    return { blocking: result, timer: raw.timer != null ? raw.timer : null };
  }

  async _v6Logout() {
    if (!this.sid) return;
    await this.http.delete('/api/auth', { headers: { sid: this.sid } });
    this.sid = null;
  }

  async _v6GetStats() {
    const res = await this.http.get('/api/stats/summary', {
      headers: this._headers(),
    });
    if (res.status >= 400) {
      throw new Error(`Stats request failed with HTTP ${res.status}.`);
    }
    // v6 returns { queries: { total, blocked, percent_blocked, ... },
    //              gravity: { domains_being_blocked, ... } }
    const data = res.data || {};
    const q = data.queries || {};
    const g = data.gravity || {};
    return {
      queriesTotal: q.total != null ? q.total : null,
      queriesBlocked: q.blocked != null ? q.blocked : null,
      percentBlocked: q.percent_blocked != null ? q.percent_blocked : null,
      domainsOnBlocklist: g.domains_being_blocked != null ? g.domains_being_blocked : null,
    };
  }

  // --- v5 compatibility (legacy admin API) ----------------------------------
  // Pi-hole v5 has no session login; it uses an API token in the query string.
  // Here PIHOLE_<n>_PASSWORD is treated as the v5 API token.

  async _v5GetStatus() {
    const res = await this.http.get('/admin/api.php', {
      params: { status: '', auth: this.password },
    });
    if (res.status >= 400) throw new Error(`v5 status failed HTTP ${res.status}.`);
    const blocking = res.data && res.data.status === 'enabled';
    return { blocking, timer: null };
  }

  async _v5SetBlocking(blocking, timer) {
    const params = blocking
      ? { enable: '', auth: this.password }
      : { disable: timer != null ? timer : '', auth: this.password };
    const res = await this.http.get('/admin/api.php', { params });
    if (res.status >= 400) throw new Error(`v5 set-blocking failed HTTP ${res.status}.`);
    const status = res.data && res.data.status;
    return { blocking: status === 'enabled', timer: blocking ? null : timer };
  }

  async _v5GetStats() {
    const res = await this.http.get('/admin/api.php', {
      params: { summaryRaw: '', auth: this.password },
    });
    if (res.status >= 400) throw new Error(`v5 stats failed HTTP ${res.status}.`);
    const d = res.data || {};
    const num = (v) => (v != null ? Number(v) : null);
    return {
      queriesTotal: num(d.dns_queries_today),
      queriesBlocked: num(d.ads_blocked_today),
      percentBlocked: num(d.ads_percentage_today),
      domainsOnBlocklist: num(d.domains_being_blocked),
    };
  }

  // --- public API -----------------------------------------------------------

  async login() {
    if (this.apiVersion === '5') return; // v5 is stateless, no login needed.
    return this._v6Login();
  }

  async logout() {
    if (this.apiVersion === '5') return;
    try {
      await this._v6Logout();
    } catch (_) {
      // Logout failures are non-fatal; never let them mask the real result.
    }
  }

  async getStatus() {
    return this.apiVersion === '5' ? this._v5GetStatus() : this._v6GetStatus();
  }

  /**
   * @param {boolean} blocking  true = enable blocking, false = disable.
   * @param {number|null} timer seconds to auto-revert (null = permanent).
   */
  async setBlocking(blocking, timer) {
    return this.apiVersion === '5'
      ? this._v5SetBlocking(blocking, timer)
      : this._v6SetBlocking(blocking, timer);
  }

  // Basic blocking statistics (queries today, blocked, percent, blocklist size).
  async getStats() {
    return this.apiVersion === '5' ? this._v5GetStats() : this._v6GetStats();
  }
}

module.exports = PiHoleClient;
