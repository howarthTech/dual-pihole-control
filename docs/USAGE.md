# Using the extension

This guide covers day-to-day use of the Dual Pi-hole Control popup. For
installation see [../QUICKSTART.md](../QUICKSTART.md) or
[INSTALL.md](INSTALL.md).

## Opening the popup

Click the Dual Pi-hole Control icon in the Firefox toolbar. The popup shows
the status of each configured Pi-hole and a set of control buttons.

## Reading the status

Each Pi-hole has a status row with a colored badge:

| Badge | Meaning |
|-------|---------|
| **Blocking** (green) | Ad/tracker blocking is active. |
| **Disabled · 4m 32s** (orange) | Blocking is off; the live countdown shows time remaining. When it reaches zero the badge flips back to **Blocking** automatically. |
| **Error** (red) | That Pi-hole could not be reached or authenticated. The reason is shown under the row. |

Below each row is a **statistics line**, for example:

```
19.4% blocked · 2,341 / 12,067 queries
```

That is the percentage of DNS queries blocked and the blocked / total query
counts. Hover it to see the blocklist size.

## Buttons

- **Disable 30s / 5m / 10m / 30m** — turns off blocking on *all* configured
  Pi-holes for that duration. Blocking re-enables automatically when the
  timer expires.
- **Enable Now** — turns blocking back on immediately and permanently on all.
- **Refresh Status** — re-queries every Pi-hole and updates the display.

## Understanding result messages

After an action, a banner reports what happened:

- **Green** — all Pi-holes succeeded.
- **Orange (partial)** — some succeeded, some failed, e.g.
  *"Primary disabled; Secondary failed (Connection refused)."*
- **Red** — the action failed, or the backend could not be reached.

A partial failure means the working Pi-hole was still changed — the action is
not all-or-nothing.

## Settings

Click **Settings** in the popup. First choose a **connection mode**:

**Direct** (default) — the extension talks to your Pi-holes itself:
- Each Pi-hole is a block with a **Name**, **URL**, and **Password**.
- **+ Add Pi-hole** adds another block; **Remove** deletes one.
- Use a Pi-hole **app password** (Pi-hole admin → Settings → Web Interface /
  API) rather than your admin password. Leave the password blank if the
  Pi-hole has none.
- Direct mode requires Pi-hole v6.

**Backend service** — the extension talks to your self-hosted backend:
- **Backend URL** — e.g. `http://192.168.1.50:8088`.
- **Control Token** — must match `CONTROL_TOKEN` in the backend's `.env`;
  the **Show** button reveals it to check for typos.

Click **Save Settings** to store either mode. Settings are kept in the
browser's local extension storage. Pressing Enter in the backend fields also
saves.

## After restarting Firefox

If you loaded the extension as a *temporary* add-on (`about:debugging`), it is
removed when Firefox restarts. Re-load it the same way:
`about:debugging` → **This Firefox** → **Load Temporary Add-on…** →
`extension/firefox/manifest.json`. Your saved settings are remembered.

## Common situations

- **One server shows Error** — that Pi-hole's address or password is wrong,
  or it is offline. The reason is shown under the row.
- **Backend mode: everything fails at once** — the backend is unreachable.
  Check the Backend URL and that the container is running.
- **Backend mode: "Unauthorized"** — the Control Token does not match the
  backend's `CONTROL_TOKEN`.
- **Direct mode: "Authentication failed"** — re-enter the password; if using
  an app password, confirm it wasn't revoked in the Pi-hole admin UI.

See the **Troubleshooting** section of [../README.md](../README.md) for fixes.
