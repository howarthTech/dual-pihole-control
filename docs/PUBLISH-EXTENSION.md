# Publishing the extension to addons.mozilla.org (AMO)

This guide covers packaging the Firefox extension and submitting it as a
**listed** add-on on [addons.mozilla.org](https://addons.mozilla.org). Once
listed, users install it like any other Firefox add-on — no temporary
`about:debugging` loading, and Firefox handles updates automatically.

## Prerequisites

- A free Firefox account (used as the AMO developer account).
- Node.js 18+ installed (for the `web-ext` tooling).
- The project dependencies installed:
  ```
  npm install
  ```

## 1. Lint the extension

`web-ext lint` checks the extension against AMO's validation rules. Fix any
errors before submitting.

```
npm run ext:lint
```

Notes:
- Warnings are usually acceptable; **errors** must be resolved.
- The broad `host_permissions` (`http://*/`, `https://*/`) may produce a
  warning. They are required because the user configures an arbitrary backend
  URL — see the "Reviewer notes" section below.

## 2. Build the package

```
npm run ext:build
```

This produces a `.zip` in the `dist/` folder, e.g.
`dist/dual_pihole_control-0.1.0.zip`. That zip is what you upload to AMO.

## 3. Submit on the AMO Developer Hub

1. Go to <https://addons.mozilla.org/developers/> and sign in.
2. Click **Submit a New Add-on**.
3. Choose **On this site** (listed distribution).
4. Upload the `.zip` from `dist/`. AMO validates it automatically.
5. Fill in the listing metadata (see next section).
6. Submit for review. Listed add-ons go through a review queue; you will be
   emailed when it is approved.

## 4. Listing metadata to prepare

Have these ready before you start the submission form:

| Field | Suggested content |
|-------|-------------------|
| Name | Dual Pi-hole Control |
| Summary | One-click disable/enable of blocking on two Pi-hole servers via a local backend. |
| Description | Explain the backend requirement clearly (see note below). |
| Category | Privacy & Security |
| Screenshots | Use `docs/images/popup.png` and any others you capture. |
| Homepage / Support | The GitHub repository URL. |
| License | MIT (matches `LICENSE`). |

**Important for the description:** make it obvious the extension is **not
standalone** — it requires the companion backend service from this repository
running on the user's LAN. Reviewers and users should not expect it to work on
its own.

## 5. Data collection disclosure

AMO asks what data the add-on collects. For this extension:

- It stores the **backend URL** and **control token** in the browser's local
  extension storage (`storage.local`).
- It sends those only to the user's own backend, on the user's own network.
- It does **not** use analytics, telemetry, or any third-party service.

Disclose it as: stores user-provided configuration locally; no data sent to
the developer or third parties.

## 6. Reviewer notes (optional, but speeds review)

When the form offers a "Notes for reviewers" field, explain the broad
permissions so a human reviewer understands them:

> This extension is the client half of a self-hosted tool. The backend service
> (open source, in the same repository) runs on the user's LAN. The user types
> their own backend URL into the extension settings, so the extension cannot
> know the host in advance — hence the broad `host_permissions`. The CSP omits
> `upgrade-insecure-requests` because LAN backends are typically plain HTTP.
> All credentials stay on the user's machine; nothing is sent to the developer.

## 7. Releasing updates

For each new version:

1. Bump `version` in `extension/firefox/manifest.json` (must be higher than
   the published version).
2. Update `CHANGELOG.md`.
3. `npm run ext:lint && npm run ext:build`
4. On the AMO Developer Hub, open the add-on → **Upload New Version** → upload
   the new `.zip`.

Firefox delivers the update to installed users automatically.

## Alternative: unlisted signing

If you would rather distribute the `.xpi` file yourself (e.g. via GitHub
Releases) instead of the public store, AMO also supports **unlisted** signing:
`web-ext sign --channel=unlisted` with AMO API credentials returns a signed
`.xpi` that installs on standard Firefox without being listed publicly. This
guide uses the listed (store) route as chosen for this project.
