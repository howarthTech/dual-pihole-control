# dual-pihole-control — Project Plan

**Current version:** v0.1.0

One-click disable/enable blocking on two (or more) Pi-hole servers from a
browser extension, via a local backend running in Docker.

## Architecture

```
Browser extension  ──HTTP──▶  Backend (Docker)  ──HTTP──▶  Pi-hole #1 (Primary)
   (popup UI)                 Node.js + Express             Pi-hole #2 (Secondary)
```

- Extension stores only the backend URL + control token (never Pi-hole passwords).
- Backend holds Pi-hole passwords in `.env`, talks to the Pi-hole v6 REST API.
- LAN / private use only — not designed to be internet-facing.

## Status — Done

- [x] Backend: Express server, config loader, Pi-hole v6 client, routes
- [x] Endpoints: `/health`, `/api/status`, `/api/disable`, `/api/enable`, `/api/toggle`
- [x] Bearer-token auth, restricted CORS, rate limiting, secret-free logging
- [x] Docker + docker-compose, `.env.example`
- [x] Firefox MV3 extension: popup UI, settings, partial-failure messages
- [x] Cross-browser `browserApi.js` wrapper (Chrome-ready)
- [x] CSP override so the popup can call a plain-HTTP LAN backend
- [x] Handles Pi-holes with no web password (auth returns valid:true, sid:null)
- [x] Custom app icon (`icon.svg`)
- [x] Basic blocking statistics in the popup (percent blocked, query counts)

## Status — Backlog

- [ ] Chrome support: copy `extension/firefox` → `extension/chrome`, drop
      `browser_specific_settings`, add PNG icons, add `chrome-extension://*` to CORS
- [ ] Pi-hole v5 path is implemented but **untested** — needs verification
      against a real v5 server
- [ ] Optional: auto-refresh stats on a timer; show blocklist size inline
- [ ] Submit the extension to addons.mozilla.org (tooling + guide are in place;
      see `docs/PUBLISH-EXTENSION.md`)

## Deploying changes

The Docker build context is whatever folder holds `docker-compose.yml`.

- After `.env` changes: `docker compose up -d --force-recreate`
- After code changes: `docker compose up -d --build` (add `--no-cache` if stale)
- For extension changes: reload via `about:debugging` → Reload
