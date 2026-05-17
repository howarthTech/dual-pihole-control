// ---------------------------------------------------------------------------
// Popup logic for Dual Pi-hole Control.
//
// The extension stores ONLY the backend URL and control token (in
// browser.storage.local). It never sees or stores Pi-hole passwords - the
// backend handles all Pi-hole authentication.
// ---------------------------------------------------------------------------

'use strict';

const SETTINGS_KEYS = ['backendUrl', 'controlToken'];

// Cached DOM references.
const els = {
  statusList: document.getElementById('statusList'),
  message: document.getElementById('message'),
  enableBtn: document.getElementById('enableBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  settingsToggle: document.getElementById('settingsToggle'),
  settingsBody: document.getElementById('settingsBody'),
  backendUrl: document.getElementById('backendUrl'),
  controlToken: document.getElementById('controlToken'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
};

let settings = { backendUrl: '', controlToken: '' };

// --- settings --------------------------------------------------------------

async function loadSettings() {
  const stored = await browserApi.storage.get(SETTINGS_KEYS);
  settings.backendUrl = stored.backendUrl || '';
  settings.controlToken = stored.controlToken || '';
  els.backendUrl.value = settings.backendUrl;
  els.controlToken.value = settings.controlToken;
}

async function saveSettings() {
  settings.backendUrl = els.backendUrl.value.trim().replace(/\/+$/, '');
  settings.controlToken = els.controlToken.value.trim();
  await browserApi.storage.set({
    backendUrl: settings.backendUrl,
    controlToken: settings.controlToken,
  });
  showMessage('ok', 'Settings saved.');
  els.backendUrl.value = settings.backendUrl;
  refreshStatus();
}

function settingsReady() {
  if (!settings.backendUrl || !settings.controlToken) {
    showMessage('fail', 'Set the backend URL and control token in Settings.');
    els.settingsBody.classList.remove('hidden');
    return false;
  }
  return true;
}

// --- backend calls ---------------------------------------------------------

// Generic call to the backend. Returns parsed JSON or throws a clean Error.
async function callBackend(path, method, body) {
  const url = `${settings.backendUrl}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.controlToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Network-level failure (backend down, wrong URL, CORS rejection).
    throw new Error('Cannot reach backend. Check the URL and that it is running.');
  }

  if (res.status === 401) {
    throw new Error('Unauthorized. Check the control token in Settings.');
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

function renderStatus(results) {
  els.statusList.innerHTML = '';
  if (!results || !results.length) {
    els.statusList.innerHTML = '<div class="status-row muted">No servers reported.</div>';
    return;
  }
  results.forEach((r) => {
    // Each server gets its own block: a status row plus an optional stats line.
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
      badge.title = r.error || 'Unknown error';
    } else if (r.blocking) {
      badge.classList.add('on');
      badge.textContent = 'Blocking';
    } else {
      badge.classList.add('off');
      const t = r.timer ? ` (${formatSeconds(r.timer)})` : '';
      badge.textContent = `Disabled${t}`;
    }

    row.appendChild(name);
    row.appendChild(badge);
    block.appendChild(row);

    // Basic statistics line (only when the server responded and sent stats).
    if (r.ok && r.stats) {
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

// Format a number with thousands separators; null/undefined -> em dash.
function fmtNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString();
}

function formatSeconds(s) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.round(s / 3600)}h`;
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

function setBusy(busy) {
  document.querySelectorAll('.btn').forEach((b) => { b.disabled = busy; });
}

async function refreshStatus() {
  if (!settingsReady()) return;
  setBusy(true);
  els.statusList.innerHTML = '<div class="status-row muted">Loading status&hellip;</div>';
  try {
    const data = await callBackend('/api/status', 'GET');
    renderStatus(data.results);
    els.message.classList.add('hidden');
  } catch (e) {
    els.statusList.innerHTML = `<div class="status-row muted">Status unavailable.</div>`;
    showMessage('fail', e.message);
  } finally {
    setBusy(false);
  }
}

async function doDisable(seconds) {
  if (!settingsReady()) return;
  setBusy(true);
  try {
    const data = await callBackend('/api/disable', 'POST', { seconds });
    renderStatus(data.results);
    summarize(data);
  } catch (e) {
    showMessage('fail', e.message);
  } finally {
    setBusy(false);
  }
}

async function doEnable() {
  if (!settingsReady()) return;
  setBusy(true);
  try {
    const data = await callBackend('/api/enable', 'POST');
    renderStatus(data.results);
    summarize(data);
  } catch (e) {
    showMessage('fail', e.message);
  } finally {
    setBusy(false);
  }
}

// --- wiring ----------------------------------------------------------------

function init() {
  document.querySelectorAll('.btn.disable').forEach((btn) => {
    btn.addEventListener('click', () => {
      doDisable(parseInt(btn.dataset.seconds, 10));
    });
  });

  els.enableBtn.addEventListener('click', doEnable);
  els.refreshBtn.addEventListener('click', refreshStatus);
  els.saveSettingsBtn.addEventListener('click', saveSettings);

  els.settingsToggle.addEventListener('click', () => {
    els.settingsBody.classList.toggle('hidden');
  });

  loadSettings().then(refreshStatus);
}

document.addEventListener('DOMContentLoaded', init);
