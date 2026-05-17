# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
