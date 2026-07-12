// ---------------------------------------------------------------------------
// Popup logic for Dual Pi-hole Control.
//
// The extension stores ONLY the backend URL and control token (in
// browser.storage.local). It never sees or stores Pi-hole passwords - the
// backend handles all Pi-hole authentication.
// ---------------------------------------------------------------------------

'use strict';

const SETTINGS_KEYS = ['backendUrl', 'controlToken'];
const REQUEST_TIMEOUT_MS = 8000;

// Cached DOM references.
const els = {
  statusList: document.getElementById('statusList'),
  lastUpdated: document.getElementById('lastUpdated'),
  message: document.getElementById('message'),
  enableBtn: document.getElementById('enableBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  settingsToggle: document.getElementById('settingsToggle'),
  settingsBody: document.getElementById('settingsBody'),
  backendUrl: document.getElementById('backendUrl'),
  controlToken: document.getElementById('controlToken'),
  tokenVisibilityBtn: document.getElementById('tokenVisibilityBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
};

let settings = { backendUrl: '', controlToken: '' };

// Last status snapshot, used for the live countdown on disable timers.
let lastResults = null;
let lastFetchedAt = 0;
let countdownTimer = null;

// --- settings --------------------------------------------------------------

async function loadSettings() {
  const stored = await browserApi.storage.get(SETTINGS_KEYS);
  settings.backendUrl = stored.backendUrl || '';
  settings.controlToken = stored.controlToken || '';
  els.backendUrl.value = settings.backendUrl;
  els.controlToken.value = settings.controlToken;
}

// Normalize and validate the backend URL. Returns the cleaned URL, or null
// (after showing a message) when it cannot be salvaged.
function normalizeBackendUrl(raw) {
  let url = raw.trim().replace(/\/+$/, '');
  if (!url) {
    showMessage('fail', 'Enter the backend URL (e.g. http://192.168.1.50:8088).');
    return null;
  }
  // Forgive a missing scheme: "192.168.1.50:8088" -> "http://192.168.1.50:8088".
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  try {
    new URL(url);
  } catch (e) {
    showMessage('fail', 'That backend URL does not look valid. Example: http://192.168.1.50:8088');
    return null;
  }
  return url;
}

async function saveSettings() {
  const url = normalizeBackendUrl(els.backendUrl.value);
  if (!url) return;

  const token = els.controlToken.value.trim();
  if (!token) {
    showMessage('fail', 'Enter the control token (CONTROL_TOKEN from the backend .env).');
    return;
  }

  settings.backendUrl = url;
  settings.controlToken = token;
  await browserApi.storage.set({ backendUrl: url, controlToken: token });
  els.backendUrl.value = url;
  showMessage('ok', 'Settings saved.');
  refreshStatus();
}

function settingsReady() {
  if (!settings.backendUrl || !settings.controlToken) {
    showMessage('fail', 'Welcome! Set the backend URL and control token below to get started.');
    els.settingsBody.classList.remove('hidden');
    els.backendUrl.focus();
    return false;
  }
  return true;
}

// --- backend calls ---------------------------------------------------------

// Generic call to the backend with a timeout. Returns parsed JSON or throws
// a clean Error suitable for direct display.
async function callBackend(path, method, body) {
  const url = `${settings.backendUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.controlToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('Backend timed out. Check that it is running and reachable.');
    }
    // Network-level failure (backend down, wrong URL, CORS rejection).
    throw new Error('Cannot reach backend. Check the URL and that it is running.');
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) {
    throw new Error('Unauthorized. Check the control token in Settings.');
  }
  if (res.status === 429) {
    throw new Error('Too many requests — wait a few seconds and try again.');
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`Backend returned an unexpected response (HTTP ${res.status}).`);
  }

  if (!res.ok && !data.results) {
    throw new Error(data.error || `Backend error (HTTP ${res.status}).`);
  }
  return data;
}

// --- rendering -------------------------------------------------------------

// Seconds remaining on a server's disable timer, adjusted for time elapsed
// since the snapshot was fetched. Null when no timer is running.
function remainingSeconds(r) {
  if (!r.ok || r.blocking || r.timer == null) return null;
  const elapsed = Math.floor((Date.now() - lastFetchedAt) / 1000);
  return Math.max(0, Math.round(r.timer) - elapsed);
}

function renderStatus(results, isCountdownTick) {
  if (!isCountdownTick) {
    lastResults = results;
    lastFetchedAt = Date.now();
    els.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    startCountdown();
  }

  els.statusList.innerHTML = '';
  if (!results || !results.length) {
    els.statusList.innerHTML = '<div class="status-row muted">No servers reported.</div>';
    return;
  }

  results.forEach((r) => {
    // Each server gets its own block: a status row plus stats or error detail.
    const block = document.createElement('div');
    block.className = 'server';

    const row = document.createElement('div');
    row.className = 'status-row';

    const name = document.createElement('span');
    name.className = 'status-name';
    name.textContent = r.name;

    const badge = document.createElement('span');
    badge.className = 'badge';
    if (!r.ok) {
      badge.classList.add('error');
      badge.textContent = 'Error';
    } else if (r.blocking) {
      badge.classList.add('on');
      badge.textContent = 'Blocking';
    } else {
      badge.classList.add('off');
      const rem = remainingSeconds(r);
      badge.textContent = rem != null ? `Disabled · ${formatSeconds(rem)}` : 'Disabled';
    }

    row.appendChild(name);
    row.appendChild(badge);
    block.appendChild(row);

    if (!r.ok) {
      // Show the failure reason inline - a hover-only tooltip is easy to miss.
      const detail = document.createElement('div');
      detail.className = 'status-stats error-text';
      detail.textContent = r.error || 'Unknown error';
      block.appendChild(detail);
    } else if (r.stats) {
      const s = r.stats;
      const stats = document.createElement('div');
      stats.className = 'status-stats';
      const pct = s.percentBlocked != null ? `${Number(s.percentBlocked).toFixed(1)}%` : '—';
      stats.textContent =
        `${pct} blocked · ${fmtNum(s.queriesBlocked)} / ${fmtNum(s.queriesTotal)} queries`;
      if (s.domainsOnBlocklist != null) {
        stats.title = `Blocklist: ${fmtNum(s.domainsOnBlocklist)} domains`;
      }
      block.appendChild(stats);
    }

    els.statusList.appendChild(block);
  });
}

// Live countdown: tick every second while any disable timer is running, and
// re-query the backend once a timer expires so the badge flips back to
// "Blocking" without a manual refresh.
function startCountdown() {
  stopCountdown();
  if (!lastResults || !lastResults.some((r) => remainingSeconds(r) != null)) return;

  countdownTimer = setInterval(() => {
    const expired = lastResults.some((r) => {
      const rem = remainingSeconds(r);
      return rem != null && rem <= 0;
    });
    if (expired) {
      stopCountdown();
      refreshStatus();
    } else {
      renderStatus(lastResults, true);
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

// Format a number with thousands separators; null/undefined -> em dash.
function fmtNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString();
}

// Compact duration: 45s, 4m 32s, 1h 05m.
function formatSeconds(s) {
  s = Math.max(0, Math.round(s));
  if (s < 60) return `${s}s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return ss ? `${m}m ${ss}s` : `${m}m`;
  }
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function showMessage(kind, text) {
  els.message.className = `message ${kind}`;
  els.message.textContent = text;
  els.message.classList.remove('hidden');
}

// Build a clear summary, including partial failures.
function summarize(data) {
  const ok = data.results.filter((r) => r.ok).map((r) => r.name);
  const fail = data.results.filter((r) => !r.ok);

  const actionWord = data.action === 'enable' ? 'enabled'
    : data.action === 'disable' ? 'disabled'
    : 'updated';

  if (fail.length === 0) {
    showMessage('ok', `All Pi-holes ${actionWord}.`);
  } else if (ok.length === 0) {
    showMessage('fail', `Failed: ${fail.map((f) => `${f.name} (${f.error})`).join('; ')}`);
  } else {
    showMessage(
      'partial',
      `${ok.join(', ')} ${actionWord}; ` +
      `${fail.map((f) => `${f.name} failed (${f.error})`).join('; ')}.`
    );
  }
}

// --- actions ---------------------------------------------------------------

function setBusy(busy, activeBtn, busyLabel) {
  document.querySelectorAll('.btn').forEach((b) => { b.disabled = busy; });
  if (activeBtn) {
    if (busy) {
      activeBtn.dataset.label = activeBtn.textContent;
      activeBtn.textContent = busyLabel;
    } else if (activeBtn.dataset.label) {
      activeBtn.textContent = activeBtn.dataset.label;
      delete activeBtn.dataset.label;
    }
  }
}

async function refreshStatus() {
  if (!settingsReady()) return;
  setBusy(true, els.refreshBtn, 'Refreshing…');
  try {
    const data = await callBackend('/api/status', 'GET');
    renderStatus(data.results);
    els.message.classList.add('hidden');
  } catch (e) {
    stopCountdown();
    els.statusList.innerHTML = '<div class="status-row muted">Status unavailable.</div>';
    showMessage('fail', e.message);
  } finally {
    setBusy(false, els.refreshBtn);
  }
}

async function doDisable(seconds, btn) {
  if (!settingsReady()) return;
  setBusy(true, btn, 'Working…');
  try {
    const data = await callBackend('/api/disable', 'POST', { seconds });
    renderStatus(data.results);
    summarize(data);
  } catch (e) {
    showMessage('fail', e.message);
  } finally {
    setBusy(false, btn);
  }
}

async function doEnable() {
  if (!settingsReady()) return;
  setBusy(true, els.enableBtn, 'Working…');
  try {
    const data = await callBackend('/api/enable', 'POST');
    renderStatus(data.results);
    summarize(data);
  } catch (e) {
    showMessage('fail', e.message);
  } finally {
    setBusy(false, els.enableBtn);
  }
}

// --- wiring ----------------------------------------------------------------

function init() {
  document.querySelectorAll('.btn.disable').forEach((btn) => {
    btn.addEventListener('click', () => {
      doDisable(parseInt(btn.dataset.seconds, 10), btn);
    });
  });

  els.enableBtn.addEventListener('click', doEnable);
  els.refreshBtn.addEventListener('click', refreshStatus);
  els.saveSettingsBtn.addEventListener('click', saveSettings);

  els.settingsToggle.addEventListener('click', () => {
    els.settingsBody.classList.toggle('hidden');
  });

  // Enter in either settings field saves.
  [els.backendUrl, els.controlToken].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveSettings();
    });
  });

  // Toggle token visibility so typos are easy to spot.
  els.tokenVisibilityBtn.addEventListener('click', () => {
    const hidden = els.controlToken.type === 'password';
    els.controlToken.type = hidden ? 'text' : 'password';
    els.tokenVisibilityBtn.textContent = hidden ? 'Hide' : 'Show';
  });

  loadSettings().then(refreshStatus);
}

document.addEventListener('DOMContentLoaded', init);
