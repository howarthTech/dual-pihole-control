# Installation

There are two ways to run dual-pihole-control. **Direct mode** needs nothing
but the extension. **Backend mode** adds a small self-hosted service that
keeps Pi-hole credentials out of the browser.

For a condensed version see [../QUICKSTART.md](../QUICKSTART.md).

---

## Part 1 — Install the Firefox extension (both modes)

### From addons.mozilla.org (when listed)

Install "Dual Pi-hole Control" from the Firefox Add-ons store. Installs are
permanent and update automatically.

### From source (temporary)

1. Download or clone this repository.
2. Firefox → `about:debugging` → **This Firefox**.
3. **Load Temporary Add-on…** → select `extension/firefox/manifest.json`.

Temporary add-ons are removed when Firefox restarts; re-load the same way.
Your settings persist.

---

## Part 2A — Direct mode (recommended, no server)

Requirements: **Pi-hole v6** reachable on your LAN. (Not sure? If
`http://<pihole-ip>/api/docs` loads, it's v6.)

1. **Create an app password** on each Pi-hole (recommended): Pi-hole admin →
   **Settings → Web Interface / API → App password**. Copy the generated
   password. This keeps your real admin password out of the browser and can
   be revoked anytime.
2. Click the extension icon → **Settings**. Mode **Direct** is the default.
3. For each Pi-hole, fill in:
   - **Name** — a label like `Primary` (optional).
   - **URL** — e.g. `http://192.168.1.10` (LAN IP; the `http://` is added for
     you if omitted).
   - **Password** — the app password (leave blank if the Pi-hole has no web
     password).
4. Click **+ Add Pi-hole** to add more, in any number.
5. **Save Settings**. Status and statistics appear immediately.

Done — skip Part 2B entirely.

---

## Part 2B — Backend mode (Docker)

Choose this if you don't want Pi-hole credentials in browser storage, or you
run Pi-hole v5.

Requirements: Docker (Docker Desktop on Windows/macOS, Docker Engine +
Compose on Linux) on a machine that's on when you need the extension.

### 1. Get the config files

Only `docker-compose.yml` and `.env.example` are needed at runtime — the
backend itself ships as a prebuilt image. Clone the repo (or download those
two files):

```
git clone https://github.com/howarthTech/dual-pihole-control.git
cd dual-pihole-control
```

### 2. Create your configuration

- **Windows (PowerShell):** `Copy-Item .env.example .env`
- **Linux / macOS:** `cp .env.example .env`

Edit `.env`:

| Variable | Set to |
|----------|--------|
| `PORT` | Backend port (default `8088`). |
| `CONTROL_TOKEN` | A long random string you invent. |
| `PIHOLE_1_BASE_URL` | Your Pi-hole's LAN URL, e.g. `http://192.168.1.10`. |
| `PIHOLE_1_PASSWORD` | Your Pi-hole's admin/web password. |

Generate a random `CONTROL_TOKEN`:

- **Windows:** `[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}))`
- **Linux / macOS:** `openssl rand -base64 32`

> Always use real **LAN IP addresses** for `PIHOLE_*_BASE_URL`. Never
> `127.0.0.1` — the backend runs inside a container, where `127.0.0.1` is the
> container itself.

**More than one Pi-hole?** Uncomment the `PIHOLE_2_*` block in `.env` (and
add `PIHOLE_3_*`, `PIHOLE_4_*`, etc. the same way).

### 3. Start the backend

```
docker compose up -d
```

This pulls the prebuilt image `ghcr.io/howarthtech/dual-pihole-control:latest`
and starts it. Alternatives:

- **Plain `docker run`** (no compose file needed):
  ```
  docker run -d --name dual-pihole-control --restart unless-stopped \
    --env-file .env -p 8088:8088 ghcr.io/howarthtech/dual-pihole-control:latest
  ```
- **Build from source:** in `docker-compose.yml`, comment out the `image:`
  line and uncomment `build: .`, then `docker compose up -d --build`.

Check it:

```
curl http://localhost:8088/health
```

You should get a JSON response listing your Pi-holes (no secrets).

### Firewall (access from another computer)

If the browser runs on a *different* PC than the backend, allow the port on
the backend host:

- **Windows** (PowerShell as Administrator):
  ```
  New-NetFirewallRule -DisplayName "dual-pihole-control" -Direction Inbound -Protocol TCP -LocalPort 8088 -Action Allow
  ```
- **Linux (ufw):** `sudo ufw allow 8088/tcp`

Then test from the other PC: `curl http://<server-lan-ip>:8088/health`.

### 4. Configure the extension

Open the popup → **Settings**:

- Mode: **Backend service**.
- **Backend URL** — `http://<server-lan-ip>:8088` (use `localhost` only if
  the browser is on the same machine as the backend).
- **Control Token** — the same `CONTROL_TOKEN` you put in `.env`.
- Click **Save Settings**.

---

## Verify (both modes)

Click **Disable 5m** in the popup, then check your Pi-hole admin dashboard —
it should show blocking disabled with a countdown. The popup counts down live
and flips back to "Blocking" when the timer expires. Click **Enable Now** to
restore blocking early.

## Updating

- **Extension:** store installs update automatically; temporary loads — pull
  the repo and re-load.
- **Backend image:** `docker compose pull && docker compose up -d`
- **After `.env` changes:** `docker compose up -d --force-recreate`

## Uninstalling

- Direct mode: remove the extension (Firefox → Add-ons) — settings go with it.
- Backend mode: also `docker compose down` and delete the folder.

## Troubleshooting

See the **Troubleshooting** section in [../README.md](../README.md).
