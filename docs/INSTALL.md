# Installation

Detailed installation for Windows, Linux, and macOS. For a condensed version
see [../QUICKSTART.md](../QUICKSTART.md).

## Requirements

- **Docker** — Docker Desktop (Windows/macOS) or Docker Engine + Compose plugin
  (Linux).
- **Two Pi-hole servers** reachable on your LAN. Pi-hole **v6** is recommended;
  v5 has an untested compatibility path.
- **Firefox** for the browser extension.

## 1. Download the project

```
git clone https://github.com/howarthTech/dual-pihole-control.git
cd dual-pihole-control
```

Or download the ZIP from the project page and extract it.

## 2. Create your configuration

Copy the example environment file:

- **Windows (PowerShell):** `Copy-Item .env.example .env`
- **Linux / macOS:** `cp .env.example .env`

Edit `.env`:

| Variable | Set to |
|----------|--------|
| `PORT` | Backend port (default `8088`). |
| `CONTROL_TOKEN` | A long random string you invent. |
| `PIHOLE_1_BASE_URL` | First Pi-hole's LAN URL, e.g. `http://192.168.1.10`. |
| `PIHOLE_1_PASSWORD` | First Pi-hole's admin/web password. |
| `PIHOLE_2_BASE_URL` | Second Pi-hole's LAN URL. |
| `PIHOLE_2_PASSWORD` | Second Pi-hole's admin/web password. |

Generate a random `CONTROL_TOKEN`:

- **Windows:** `[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}))`
- **Linux / macOS:** `openssl rand -base64 32`

> Always use real **LAN IP addresses** for `PIHOLE_*_BASE_URL`. Never
> `127.0.0.1` — the backend runs inside a container, where `127.0.0.1` is the
> container itself.

To control more than two Pi-holes, add `PIHOLE_3_*`, `PIHOLE_4_*`, etc.

## 3. Start the backend

```
docker compose up -d
```

This builds the image and starts the container. Check it:

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

## 4. Install the Firefox extension

1. Open Firefox → `about:debugging`.
2. Click **This Firefox**.
3. Click **Load Temporary Add-on…**.
4. Select `extension/firefox/manifest.json`.

Temporary add-ons are removed when Firefox restarts; re-load the same way.

## 5. Configure the extension

Open the popup → **Settings**:

- **Backend URL** — `http://<server-lan-ip>:8088` (use `localhost` only if the
  browser is on the same machine as the backend).
- **Control Token** — the same `CONTROL_TOKEN` you put in `.env`.
- Click **Save Settings**.

## 6. Verify

Click **Disable 5m** in the popup, then check both Pi-hole admin dashboards —
they should show blocking disabled with a countdown. Click **Enable Now** to
restore blocking.

## Updating

After changing `.env`:

```
docker compose up -d --force-recreate
```

After updating the code:

```
docker compose up -d --build
```

## Uninstalling

```
docker compose down
```

Remove the temporary add-on from `about:debugging`, and delete the project
folder.

## Troubleshooting

See the **Troubleshooting** section in [../README.md](../README.md).
