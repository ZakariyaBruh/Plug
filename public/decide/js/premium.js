/*
 * premium.js — Premium, checked the way the rest of this site checks it.
 *
 * The original licence-key-and-passphrase flow lived here because a static
 * page has no account system of its own to ask. This page is not static: it
 * is served from morsels45-app.whop.site, which already knows how to sign
 * someone in with their real Whop account and already knows, from that
 * account, whether they own morsels45 Premium. Asking twice — once with a
 * pasted key, once for real — is the friction this file removes.
 *
 * THE HOSTNAME IN THAT SENTENCE MATTERS, and it used to be wrong here.
 * This app has lived at three names: morsels45decide.whop.site, then
 * morsels45-app.whop.site, which is the live one. morsels45.whop.site has
 * never been ours — it answers 502 because it belongs to something else that
 * is broken, and links to it are simply lost. Whop does not keep a previous
 * hostname alive either: morsels45decide.whop.site is a hard 404 today. So a
 * link that goes out with the wrong host is a reader who never arrives, and
 * renaming the app route again would do that to every link now in existence.
 *
 * So: one request, to this site's own /api/premium-status, which answers
 * from the visitor's Whop session. No key to paste, no device to bind, no
 * passphrase to invent and never be able to reset. Signed in and paid is the
 * whole test, and it holds on any device they sign into.
 *
 * Not signed in, or signed in without Premium: one click sends them to
 * /premium, the real checkout on this site. It opens in a new tab so a game
 * in progress here is never lost, and coming back to this tab re-asks the
 * question automatically.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodPremium = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ENDPOINT = '/api/premium-status';
  var UPGRADE_URL = '/premium';

  function readStatus(payload) {
    if (!payload || typeof payload !== 'object') {
      return { signedIn: false, hasPremium: false, username: '' };
    }
    return {
      signedIn: !!payload.signedIn,
      hasPremium: !!payload.hasPremium,
      username: typeof payload.username === 'string' ? payload.username : ''
    };
  }

  function Premium() {
    this.status = { signedIn: false, hasPremium: false, username: '' };
  }

  // Ask the site, not the browser's own memory of the last answer — a
  // cancellation or a fresh purchase on another tab has to show up here
  // without anybody reloading by hand.
  Premium.prototype.refresh = function () {
    var self = this;
    return fetch(ENDPOINT, { headers: { Accept: 'application/json' } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; })
      .then(function (payload) {
        self.status = readStatus(payload);
        return self.status;
      });
  };

  Premium.prototype.isPremium = function () { return !!this.status.hasPremium; };
  Premium.prototype.isSignedIn = function () { return !!this.status.signedIn; };

  // Opens real checkout in a new tab, so nothing on this page is lost.
  Premium.prototype.openUpgrade = function () {
    window.open(UPGRADE_URL, '_blank', 'noopener');
  };

  Premium.prototype.upgradeUrl = function () { return UPGRADE_URL; };

  return { Premium: Premium, UPGRADE_URL: UPGRADE_URL };
});
