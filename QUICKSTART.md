# Quick Start

Two ways to run this — pick one:

| | Direct mode (recommended) | Backend mode |
|---|---|---|
| Setup time | ~2 minutes | ~15 minutes |
| Needs Docker / a server | No | Yes |
| Credentials stored | In browser extension storage (use an app password) | On the backend server only |
| Pi-hole version | v6 only | v6 (v5 compatibility path) |

## Direct mode (recommended)

1. **Create an app password** on each Pi-hole (recommended): Pi-hole admin →
   **Settings → Web Interface / API → App password**. Copy it. (You can use
   your admin password instead, but an app password can be revoked anytime.)
2. **Load the extension** in Firefox: `about:debugging` → **This Firefox** →
   **Load Temporary Add-on…** → select `extension/firefox/manifest.json`.
3. Open the popup → **Settings**. Mode **Direct** is the default.
4. Enter your Pi-hole's **URL** (e.g. `http://192.168.1.10`) and **password**.
   Click **+ Add Pi-hole** for each additional one.
5. **Save Settings** — status appears. Click **Disable 5m** to test.

That's it. No Docker, no server, no tokens.

> Direct mode requires **Pi-hole v6**. Check by opening
> `http://<pihole-ip>/api/docs` — if it loads, you're on v6.

## Backend mode

Use this if you want Pi-hole credentials kept out of the browser, or you run
Pi-hole v5.

1. Get `docker-compose.yml` and `.env.example` (clone the repo or download
   just those two files):
   ```
   git clone https://github.com/howarthTech/dual-pihole-control.git
   cd dual-pihole-control
   ```
2. Configure:
   ```
   # Windows PowerShell:        # Linux/macOS:
   Copy-Item .env.example .env  # cp .env.example .env
   ```
   Edit `.env`: set `CONTROL_TOKEN` (any long random string) and
   `PIHOLE_1_BASE_URL` / `PIHOLE_1_PASSWORD`. More Pi-holes? Uncomment the
   `PIHOLE_2_*` block. Use real **LAN IPs**, not `127.0.0.1`.
3. Start it (pulls the prebuilt image from GitHub Container Registry):
   ```
   docker compose up -d
   ```
   Verify: `http://localhost:8088/health` returns JSON.
4. Load the extension (step 2 above), open **Settings**, choose mode
   **Backend service**, enter the backend URL (e.g. `http://192.168.1.50:8088`)
   and your `CONTROL_TOKEN`, then **Save Settings**.

Something not working? See **Troubleshooting** in [README.md](README.md).
