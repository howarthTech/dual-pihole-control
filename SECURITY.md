# Security Policy

## Intended use

dual-pihole-control is designed for **private LAN use only**. It is **not**
hardened for, and must **not** be exposed to, the public internet.

- Do not port-forward the backend or your Pi-holes, or place them on a
  public IP.
- Run everything only on a trusted local network.

## Trust models — pick the mode that fits yours

**Direct mode** stores each Pi-hole's URL and password in the browser's local
extension storage (`storage.local`) on your machine. Recommended practice:

- Use a Pi-hole **app password** (Pi-hole admin → Settings → Web Interface /
  API), not your admin password. App passwords can be revoked at any time
  without changing your admin login.
- Anyone with access to your browser profile could read stored extension
  data — the same trust model as every browser extension that talks to
  Pi-hole directly.

**Backend mode** keeps Pi-hole passwords out of the browser entirely:

- Passwords live only in the backend's `.env` file on your server
  (git-ignored).
- The extension stores only the backend URL and a control token.
- The control token is a shared secret for LAN convenience, not a full
  authentication system. All control endpoints require it (constant-time
  comparison), CORS is restricted, and requests are rate limited.

In **both modes**, nothing is ever sent to the developer or any third party,
and credentials are never written to logs or API responses.

## Handling secrets (contributors / self-builders)

- Never commit a `.env` file. Only `.env.example` (placeholder values)
  belongs in the repository.
- If real credentials are ever committed, rotate them immediately — git
  history preserves them even after a later deletion.

## Reporting a vulnerability

If you find a security issue, please open a private report (GitHub Security
Advisory) or contact the maintainer directly rather than filing a public
issue. Include steps to reproduce and the affected version.

Because this is a LAN-only tool, issues that require public internet exposure
to exploit are considered out of scope.
