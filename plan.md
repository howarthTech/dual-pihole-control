# dual-pihole-control — Project Plan

**Current version:** v0.4.0

One-click disable/enable blocking on any number of Pi-hole servers from a
Firefox extension — directly, or via an optional self-hosted backend.

## Architecture

**Direct mode (default):**

```
Browser extension  ──HTTP──▶  Pi-hole #1, #2, ... (v6 REST API)
   (popup UI)
```

**Backend mode (optional):**

```
Browser extension  ──HTTP──▶  Backend (Docker)  ──HTTP──▶  Pi-hole #1, #2, ...
   (popup UI)                 Node.js + Express
```

- Direct mode: Pi-holes configured in the popup; recommend Pi-hole app
  passwords. v6 only.
- Backend mode: passwords in the backend `.env`; extension stores only URL +
  control token. Prebuilt image on ghcr.io.
- LAN / private use only — not designed to be internet-facing.

## Status — Done

- [x] Backend: Express server, config loader, Pi-hole v6 client, routes
- [x] Endpoints: `/health`, `/api/status`, `/api/disable`, `/api/enable`, `/api/toggle`
- [x] Bearer-token auth, restricted CORS, rate limiting, secret-free logging
- [x] Docker + docker-compose, `.env.example` (one Pi-hole default, unlimited more)
- [x] Firefox MV3 extension: popup UI, settings, partial-failure messages
- [x] Cross-browser `browserApi.js` wrapper (Chrome-ready)
- [x] CSP override so the popup can call plain-HTTP LAN servers
- [x] Handles Pi-holes with no web password (auth returns valid:true, sid:null)
- [x] Custom app icon (`icon.svg`)
- [x] Blocking statistics in the popup (percent blocked, query counts)
- [x] Popup polish: live disable countdown, dark mode, inline errors,
      request timeouts, URL validation, first-run flow
- [x] `web-ext` lint/build tooling + AMO publishing guide and listing copy
- [x] **Direct mode** — extension talks to Pi-hole v6 API with no backend
      (`piholeDirect.js`); per-Pi-hole editor in Settings; app-password guidance
- [x] Prebuilt backend image published to ghcr.io via GitHub Actions
- [x] Docs rewritten for both modes (README, QUICKSTART, INSTALL, USAGE, FAQ,
      SECURITY, AMO listing)

## Status — Backlog

- [ ] Submit the extension to addons.mozilla.org (tooling + guide ready;
      see `docs/PUBLISH-EXTENSION.md`)
- [ ] After first GHCR publish: set the package visibility to Public on GitHub
- [ ] Refresh `docs/images/popup.png` (popup has changed since the screenshot)
- [ ] Decide on rebrand (name no longer matches N-Pi-hole support; candidate:
      "Pause for Pi-hole") — must happen before AMO submission if ever
- [ ] Chrome support: copy `extension/firefox` → `extension/chrome`, drop
      `browser_specific_settings`, add PNG icons, add `chrome-extension://*` to CORS
- [ ] Pi-hole v5 path (backend mode) is implemented but **untested**
- [ ] Optional: auto-refresh stats on a timer; show blocklist size inline

## Deploying changes

- Extension: reload via `about:debugging` → Reload (or ship via AMO)
- Backend image: pushed to ghcr.io automatically on push to master
  (`.github/workflows/docker-publish.yml`)
- Backend users update with `docker compose pull && docker compose up -d`
- After `.env` changes: `docker compose up -d --force-recreate`
