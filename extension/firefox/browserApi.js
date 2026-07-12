// ---------------------------------------------------------------------------
// Cross-browser compatibility wrapper.
//
// Firefox exposes the promise-based `browser.*` WebExtension API.
// Chrome (MV3) exposes `chrome.*`; modern Chrome also supports promises for
// storage. Exporting a single `browserApi` object means popup.js never needs
// to know which browser it runs in - adding Chrome later is a manifest change,
// not a code rewrite.
// ---------------------------------------------------------------------------

(function (global) {
  'use strict';

  // Prefer the standard `browser` namespace; fall back to `chrome`.
  const api = (typeof browser !== 'undefined' && browser) ||
              (typeof chrome !== 'undefined' && chrome);

  // storage.local in Firefox returns promises natively. Chrome MV3 also
  // returns promises. Wrap defensively so either way we get a promise.
  const storage = {
    get(keys) {
      return Promise.resolve(api.storage.local.get(keys));
    },
    set(items) {
      return Promise.resolve(api.storage.local.set(items));
    },
  };

  // Open a URL in a new tab. Extension popups cannot rely on plain links,
  // so route through tabs.create (works in both Firefox and Chrome MV3).
  function openTab(url) {
    return Promise.resolve(api.tabs.create({ url }));
  }

  global.browserApi = { raw: api, storage, openTab };
})(window);
