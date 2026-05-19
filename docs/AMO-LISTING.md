# AMO Listing Metadata

Paste-ready content for the addons.mozilla.org submission form. Edit to taste
before submitting. See `PUBLISH-EXTENSION.md` for the submission process.

---

## Add-on name

```
Dual Pi-hole Control
```

## Summary

Short one-liner shown in search results (keep under ~250 characters).

```
Disable or re-enable ad-blocking on two or more Pi-hole servers at once, with a single click. Requires the free, open-source companion backend service running on your local network.
```

## Description

Longer description for the listing page.

```
Dual Pi-hole Control lets you disable or enable blocking on multiple Pi-hole
servers at the same time, straight from your Firefox toolbar — no more logging
into each Pi-hole admin dashboard separately.

IMPORTANT: This extension is the client half of a self-hosted tool. It does
NOT work on its own. You must run the companion backend service (free and
open source) on a machine on your local network. The backend handles
authentication to your Pi-holes; full setup instructions are in the project
repository.

Features:
- One click to disable blocking on all your Pi-holes for 30 seconds, 5, 10,
  or 30 minutes.
- One click to re-enable blocking everywhere.
- Live status and basic blocking statistics for each Pi-hole.
- Clear per-server results, including partial failures.

Privacy and security:
- Your Pi-hole passwords are NEVER stored in the browser. They live only in
  the backend service's configuration on your own network.
- The extension stores only your backend URL and an access token, kept in
  local browser storage.
- No analytics, no telemetry, nothing sent to the developer or any third
  party.

This is designed for private home/LAN use. Source code, backend, and setup
guide: https://github.com/howarthTech/dual-pihole-control
```

## Category

```
Privacy & Security
```

## Tags / keywords (optional)

```
pi-hole, pihole, dns, ad blocking, network, self-hosted
```

## Support information

| Field | Value |
|-------|-------|
| Homepage | https://github.com/howarthTech/dual-pihole-control |
| Support site | https://github.com/howarthTech/dual-pihole-control/issues |
| Support email | (your contact email) |

## License

```
MIT License
```

## Privacy policy

AMO may ask for a privacy policy. The extension collects no personal data;
the following short statement is sufficient:

```
Dual Pi-hole Control does not collect, transmit, or sell any personal data.
The extension stores only the user-provided backend URL and access token in
the browser's local extension storage. These are sent only to the user's own
backend service on their own network. No data is sent to the developer or any
third party. No analytics or telemetry are used.
```

## Screenshots

Upload from `docs/images/`. Suggested captions:

| Image | Caption |
|-------|---------|
| `popup.png` | The popup showing both Pi-holes blocking, with statistics. |
| `popup-disabled.png` (optional) | Blocking disabled on both Pi-holes with a countdown timer. |
| `settings.png` (optional) | Configuring the backend URL and access token. |

## Notes for reviewers

Paste this into the "Notes for reviewers" field to speed up review:

```
This extension is the client half of a self-hosted tool. The backend service
(open source, same repository: https://github.com/howarthTech/dual-pihole-control)
runs on the user's local network. The user types their own backend URL into
the extension settings, so the extension cannot know the host in advance —
this is why it requests broad host permissions. The content security policy
omits 'upgrade-insecure-requests' because LAN backend services are typically
plain HTTP. All credentials stay on the user's machine; nothing is transmitted
to the developer or any third party.
```
