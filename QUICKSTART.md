# Quick Start

The fastest path to a working setup. For detailed steps see
[docs/INSTALL.md](docs/INSTALL.md); for daily use see [docs/USAGE.md](docs/USAGE.md).

## Prerequisites

- Docker (Docker Desktop on Windows/macOS, Docker Engine on Linux).
- Two Pi-hole servers reachable on your LAN (v6 recommended).
- Firefox.

## 1. Get the project

```
git clone https://github.com/howarthTech/dual-pihole-control.git
cd dual-pihole-control
```

## 2. Configure

```
# Windows PowerShell:
Copy-Item .env.example .env
# Linux/macOS:
cp .env.example .env
```

Edit `.env` and set:
- `CONTROL_TOKEN` — any long random string.
- `PIHOLE_1_BASE_URL` / `PIHOLE_1_PASSWORD` — your first Pi-hole.
- `PIHOLE_2_BASE_URL` / `PIHOLE_2_PASSWORD` — your second Pi-hole.

Use real **LAN IP addresses**, not `127.0.0.1`.

## 3. Start the backend

```
docker compose up -d
```

Verify: open `http://localhost:8088/health` — you should see a JSON status.

## 4. Load the extension

1. Firefox → `about:debugging` → **This Firefox**.
2. **Load Temporary Add-on…** → select `extension/firefox/manifest.json`.

## 5. Configure the extension

Open the popup → **Settings**:
- **Backend URL** — e.g. `http://192.168.1.50:8088` (your server's LAN IP).
- **Control Token** — the same `CONTROL_TOKEN` from `.env`.
- **Save Settings**.

## 6. Use it

Click **Disable 5m** — both Pi-holes stop blocking for 5 minutes. Click
**Enable Now** to turn blocking back on.

Something not working? See the **Troubleshooting** section in
[README.md](README.md).
