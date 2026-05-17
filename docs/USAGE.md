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
| **Disabled (5m)** (orange) | Blocking is off; the timer shows time remaining. |
| **Error** (red) | The backend could not reach or authenticate to that Pi-hole. Hover the badge to see why. |

Below each row is a **statistics line**, for example:

```
19.4% blocked · 2,341 / 12,067 queries
```

That is the percentage of DNS queries blocked and the blocked / total query
counts. Hover it to see the blocklist size.

## Buttons

- **Disable 30s / 5m / 10m / 30m** — turns off blocking on *both* Pi-holes for
  that duration. Blocking re-enables automatically when the timer expires.
- **Enable Now** — turns blocking back on immediately and permanently on both.
- **Refresh Status** — re-queries both Pi-holes and updates the display.

## Understanding result messages

After an action, a banner reports what happened:

- **Green** — all Pi-holes succeeded.
- **Orange (partial)** — some succeeded, some failed, e.g.
  *"Primary disabled; Secondary failed (Connection refused)."*
- **Red** — the action failed, or the backend could not be reached.

A partial failure means the working Pi-hole was still changed — the action is
not all-or-nothing.

## Changing settings

Click **Settings** in the popup to update the **Backend URL** or
**Control Token**. Click **Save Settings** to store them. Settings are kept in
the browser's local extension storage.

## After restarting Firefox

If you loaded the extension as a *temporary* add-on (`about:debugging`), it is
removed when Firefox restarts. Re-load it the same way:
`about:debugging` → **This Firefox** → **Load Temporary Add-on…** →
`extension/firefox/manifest.json`. Your saved settings are remembered.

## Common situations

- **All servers show Error** — the backend is unreachable. Check the Backend
  URL and that the backend container is running.
- **"Unauthorized"** — the Control Token does not match the backend's
  `CONTROL_TOKEN`.
- **One server shows Error** — that Pi-hole's address or password is wrong, or
  it is offline. Hover the badge for the exact reason.

See the **Troubleshooting** section of [../README.md](../README.md) for fixes.
