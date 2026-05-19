# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

dual-pihole-control — a Node.js + Express backend (Docker) plus a Firefox
Manifest V3 extension that disables/enables blocking on multiple Pi-hole
servers at once. LAN / private use only.

- Backend: `src/`
- Extension: `extension/firefox/`
- Docs: `README.md`, `QUICKSTART.md`, `docs/`, `plan.md`

## Conventions

- Plain CommonJS JavaScript; no TypeScript, no database, no cloud services.
- Keep dependencies minimal and code well-commented.
- Never log or return secrets (Pi-hole passwords, control token).
- Only `.env.example` belongs in the repo — never commit a real `.env`.

## Workflow preference

- After making changes, **always commit and push automatically** without
  asking for confirmation.
- Use clear, descriptive commit messages.
