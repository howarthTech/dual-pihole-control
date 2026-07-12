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
Disable or re-enable ad-blocking on all your Pi-hole servers at once, with a single click. Works out of the box with Pi-hole v6 — no server or companion software required.
```

## Description

Longer description for the listing page.

```
Dual Pi-hole Control lets you disable or enable blocking on one, two, or many
Pi-hole servers at the same time, straight from your Firefox toolbar — no
more logging into each Pi-hole admin dashboard separately.

Setup takes about two minutes: add each Pi-hole's address and password in the
popup's settings and you're done. Works with Pi-hole v6. We recommend using a
Pi-hole "app password" (created in the Pi-hole admin UI) instead of your
admin password — it can be revoked at any time.

Features:
- One click to disable blocking on all your Pi-holes for 30 seconds, 5, 10,
  or 30 minutes — with a live countdown until blocking resumes.
- One click to re-enable blocking everywhere.
- Live status and blocking statistics for each Pi-hole.
- Clear per-server results, including partial failures.
- Add as many Pi-holes as you like.

Advanced: an optional self-hosted backend mode is available for users who
prefer to keep Pi-hole credentials out of the browser entirely (and for
Pi-hole v5). See the project repository for details.

Privacy and security:
- Everything stays on your own network. Nothing is sent to the developer or
  any third party — no analytics, no telemetry.
- Credentials are stored only in local browser storage (direct mode) or on
  your own server (backend mode).

Designed for private home/LAN use. Source code and full documentation:
https://github.com/howarthTech/dual-pihole-control
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
| Contributions URL | https://buymeacoffee.com/howarthtech |

Buy Me a Coffee is one of AMO's supported contribution providers, so the
listing can show a "Contribute" button pointing at the URL above (set it in
the Developer Hub under Manage Authors & License → contributions).

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
| `popup.png` | The popup showing your Pi-holes blocking, with statistics. |
| `popup-disabled.png` (optional) | Blocking disabled with a live countdown timer. |
| `settings.png` (optional) | Adding Pi-holes in the settings panel. |

## Notes for reviewers

Paste this into the "Notes for reviewers" field to speed up review:

```
This extension controls the user's own self-hosted Pi-hole DNS servers on
their local network. In the default (direct) mode it calls each Pi-hole's
official v6 REST API; in an optional advanced mode it calls a self-hosted
open-source backend from the same repository
(https://github.com/howarthTech/dual-pihole-control). In both cases the user
types their own server addresses into the settings, so the hosts cannot be
known in advance — this is why broad host permissions are requested. The
content security policy omits 'upgrade-insecure-requests' because LAN servers
are typically plain HTTP. All credentials stay on the user's machine; nothing
is transmitted to the developer or any third party.
```
