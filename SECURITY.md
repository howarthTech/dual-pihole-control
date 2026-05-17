# Security Policy

## Intended use

dual-pihole-control is designed for **private LAN use only**. It is **not**
hardened for, and must **not** be exposed to, the public internet.

- Do not port-forward the backend or place it on a public IP.
- The control token is a shared secret, not a full authentication system.
- Run it only on a trusted local network.

## Handling secrets

- Pi-hole passwords live only in the backend `.env` file, which is git-ignored.
- The browser extension stores only the backend URL and control token.
- Never commit a `.env` file. Only `.env.example` (with placeholder values)
  belongs in the repository.
- If real credentials are ever committed, rotate them immediately — git
  history preserves them even after a later deletion.

## Reporting a vulnerability

If you find a security issue, please open a private report (GitHub Security
Advisory) or contact the maintainer directly rather than filing a public
issue. Include steps to reproduce and the affected version.

Because this is a LAN-only tool, issues that require public internet exposure
to exploit are considered out of scope.
