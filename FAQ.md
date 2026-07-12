# Frequently Asked Questions

### What's the difference between Direct mode and Backend mode?

**Direct mode** (the default): the extension talks to your Pi-hole's v6 API
itself. Nothing to install beyond the extension — add your Pi-hole URL and
password in Settings and you're done.

**Backend mode**: a small self-hosted service (Docker) sits between the
extension and your Pi-holes and holds the passwords. The extension stores only
the backend's URL and an access token. Choose this if you don't want any
Pi-hole credential stored in the browser, or if you run Pi-hole v5.

### Does the extension store my Pi-hole passwords?

In **direct mode**, yes — in the browser's local extension storage, on your
machine only. Use a Pi-hole **app password** (Settings → Web Interface / API
in the Pi-hole admin UI) instead of your admin password; it can be revoked
anytime. In **backend mode**, no — passwords live only in the backend's
`.env` file on your server.

### What is an app password and why should I use one?

Pi-hole v6 lets you create a secondary password intended for scripts and
integrations. It works for API logins but can be revoked independently of
your admin password. If your browser profile were ever compromised, you'd
revoke the app password and your real admin password was never exposed.

### Can I control more than one Pi-hole? More than two?

Yes, as many as you like. Direct mode: click **+ Add Pi-hole** in Settings
for each one. Backend mode: add `PIHOLE_2_*`, `PIHOLE_3_*`, ... blocks to
`.env`. One click controls all of them at once.

### Does it work with Pi-hole v5?

Direct mode is **v6 only**. Backend mode has a v5 compatibility path (set
`PIHOLE_<n>_API_VERSION=5` and use the v5 API token as the password), but it
is **untested**. Upgrade to v6 if you can.

### How do I know if my Pi-hole is v6?

Open `http://<pihole-ip>/api/docs` in a browser. If the API documentation
loads, it's v6. (Also, v6's admin UI login is at `/admin/login`, and the
version is shown in the admin footer.)

### Does it work in Chrome?

Not yet. The extension is Firefox Manifest V3. The code is structured for
Chrome via a `browserApi.js` wrapper, so Chrome support is planned.

### Is this safe to expose to the internet?

No. It is designed for **private LAN use only**. Do not port-forward your
Pi-holes or the backend, and don't put them on a public IP. See
[SECURITY.md](SECURITY.md).

### What does the timer do?

When you disable blocking with a timer (e.g. 5 minutes), each Pi-hole
automatically re-enables blocking after that time. The popup shows a live
countdown and flips back to "Blocking" when it expires. "Enable Now" turns
blocking back on immediately.

### Why does one Pi-hole show "Error" while the others work?

Each Pi-hole is contacted independently — an error on one (wrong password,
offline, wrong URL) never stops the others. The reason is shown right under
the failed server's row.

### My Pi-hole has no admin password. Will it still work?

Yes, in both modes — leave the password field blank (direct mode) or empty in
`.env` (backend mode). For better security, consider setting one.

### The extension disappeared after restarting Firefox.

Temporary add-ons loaded via `about:debugging` are removed on restart. Re-load
it the same way — your saved settings are preserved. (Once the extension is
on addons.mozilla.org, installs are permanent and update automatically.)

### Backend mode: how do I see the backend logs?

```
docker logs dual-pihole-control
```

Logs contain request method, path, and status only — never passwords or
tokens.

### Backend mode: how do I update after changing `.env`?

`docker compose up -d --force-recreate` — a plain restart does not reload
`.env`. To pull a newer backend image: `docker compose pull && docker compose up -d`.
