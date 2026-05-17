# Contributing

Thanks for your interest in improving dual-pihole-control! This is a small
LAN utility — contributions are welcome but kept simple.

## Project layout

- `src/` — Node.js + Express backend.
- `extension/firefox/` — Firefox Manifest V3 extension.
- See `README.md` for setup and `plan.md` for the roadmap.

## Running locally

1. Copy `.env.example` to `.env` and fill in your Pi-hole details.
2. `docker compose up -d --build`
3. `curl http://localhost:8088/health` to confirm it is running.
4. Load `extension/firefox/manifest.json` via Firefox `about:debugging`.

You can also run the backend directly without Docker:

```
npm install
npm start
```

## Guidelines

- Keep it simple — no TypeScript, no database, no cloud services, and avoid
  adding dependencies unless clearly justified.
- Match the existing style: plain CommonJS, clear comments.
- Never log or return secrets (Pi-hole passwords, control token).
- Do not commit a `.env` file. Only `.env.example` belongs in the repo.
- Test against a real Pi-hole v6 server when changing API behavior.
- The Pi-hole v5 path is currently untested — verification PRs are welcome.

## Pull requests

- Branch from `main`, keep changes focused.
- Describe what you changed and how you tested it.
- Update `CHANGELOG.md` under an `## [Unreleased]` heading.

## Reporting issues

Include your Pi-hole version, backend logs (`docker logs <container>` — they
contain no secrets), and steps to reproduce.
