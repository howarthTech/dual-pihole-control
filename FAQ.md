# Frequently Asked Questions

### Does the extension store my Pi-hole passwords?

No. Pi-hole passwords live only in the backend `.env` file. The browser
extension stores only the backend URL and the control token.

### Why is there a backend at all? Why not call Pi-hole directly?

Two reasons. First, it keeps Pi-hole passwords out of the browser — the
extension never sees them. Second, browser extensions hit CORS and mixed
content restrictions when calling Pi-hole servers directly; a small local
backend avoids that and lets one click fan out to multiple Pi-holes.

### Can I control more than two Pi-holes?

Yes. Add `PIHOLE_3_NAME`, `PIHOLE_3_BASE_URL`, `PIHOLE_3_PASSWORD` (and so on)
to `.env`, keeping the numbering sequential. The backend and popup handle any
number of Pi-holes.

### Can I control just one Pi-hole?

Yes — configure only `PIHOLE_1_*`. The "dual" name is just the common use case.

### Does it work with Pi-hole v5?

The project targets Pi-hole **v6**. A v5 compatibility path exists (set
`PIHOLE_<n>_API_VERSION=5` and use the v5 API token as the password), but it is
**untested**. Use v6 if you can.

### Does it work in Chrome?

Not yet. The extension is Firefox Manifest V3. The code is structured for
Chrome via a `browserApi.js` wrapper, so Chrome support is planned but not
shipped.

### Is this safe to expose to the internet?

No. It is designed for **private LAN use only**. Do not port-forward it or put
it on a public IP. See [SECURITY.md](SECURITY.md).

### What does the timer do?

When you disable blocking with a timer (e.g. 5 minutes), each Pi-hole
automatically re-enables blocking after that time. "Enable Now" turns blocking
back on immediately.

### Why does one Pi-hole show "Error" while the other works?

Each Pi-hole is contacted independently. An error on one (wrong password,
offline, wrong URL) does not stop the other. Hover the red **Error** badge to
see the exact reason.

### My Pi-hole has no admin password. Will it still work?

Yes. The backend handles Pi-holes with no web password set. For better
security, consider setting one and putting it in `.env`.

### The extension disappeared after restarting Firefox.

Temporary add-ons loaded via `about:debugging` are removed on restart. Re-load
it the same way. Your saved settings are preserved.

### How do I see backend logs?

```
docker logs <container-name>
```

Logs contain request method, path, and status only — never passwords or
tokens.

### How do I update after changing `.env` or the code?

- After `.env` changes: `docker compose up -d --force-recreate`
- After code changes: `docker compose up -d --build`
