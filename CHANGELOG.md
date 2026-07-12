# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.0] - 2026-07-12

### Changed
- Any number of Pi-holes is now the documented default: `.env.example` ships
  with a single Pi-hole configured and a commented template for adding more
  (`PIHOLE_2_*`, `PIHOLE_3_*`, ...). The backend and popup always supported
  N servers; docs and defaults now match.
- "Buy me a coffee" footer link is now "🍕 Buy me a slice".
- Wording across README/QUICKSTART/INSTALL updated from "two Pi-holes" to
  "one or more Pi-holes".

## [0.2.1] - 2026-07-12

### Added
- "Buy me a coffee" support link in the popup footer
  (https://buymeacoffee.com/howarthtech).

## [0.2.0] - 2026-07-12

### Added
- Live countdown on the "Disabled" badge; status auto-refreshes when the
  disable timer expires so the badge flips back to "Blocking" on its own.
- Request timeout (8s) so the popup never hangs on an unresponsive backend.
- Backend URL validation on save; a missing `http://` prefix is added
  automatically.
- Inline error details under a failed server (previously hover-only tooltip).
- Show/Hide toggle for the control token field; Enter key saves settings.
- "Last updated" timestamp under the status list.
- Dark mode (follows the system/browser color scheme).
- Friendly first-run message that opens Settings automatically.
- `web-ext` tooling and `ext:lint` / `ext:build` npm scripts for packaging
  the Firefox extension.
- `docs/PUBLISH-EXTENSION.md` — guide for publishing the extension to
  addons.mozilla.org as a listed add-on.

### Changed
- Refreshed popup styling: theme variables, app icon in the header, button
  transitions and focus states, per-button busy labels ("Working…").
- Empty settings fields now show a clear error instead of saving silently.
- Extension `gecko.id` set to `dual-pihole-control@howarthtech`; added
  `author` and `homepage_url` to the manifest for AMO submission.

## [0.1.0] - 2026-05-17

### Added
- Node.js + Express backend that controls multiple Pi-hole servers at once.
- Endpoints: `/health`, `/api/status`, `/api/disable`, `/api/enable`,
  `/api/toggle`.
- `PiHoleClient` supporting the Pi-hole v6 REST API, with an untested
  compatibility path for the legacy v5 API.
- Bearer-token authentication, restricted CORS, rate limiting, and
  secret-free request logging.
- Docker and docker-compose setup with a documented `.env.example`.
- Firefox (Manifest V3) browser extension with a popup UI: per-server status,
  basic blocking statistics, timed disable buttons, enable, and refresh.
- Cross-browser `browserApi.js` wrapper so Chrome support can be added later.
- Custom SVG application icon.
