/*
 * sync.js — the same profile on both your phones.
 *
 * Everything this app knows about somebody has always lived in one browser:
 * what they have eaten, what they saved, what they rated, and what they do
 * not eat. Open it on a laptop and the app has never met you, and the dietary
 * rules you set once are gone. For a halal or a coeliac profile that is not an
 * inconvenience, it is the product failing silently.
 *
 * So: an optional free account. No card, nothing to cancel, and it is not
 * Premium — it is a place to keep your own profile so another device can pick
 * it up. See src/lib/profile.ts for where "a place" actually is.
 *
 * THE CONFLICT RULE IS ONE SENTENCE: the copy that was changed last is the one
 * that is kept. Every save stamps state.savedAt, so "last" means last edited
 * rather than last uploaded — a phone that has been used on a train and not
 * yet synced still wins over a laptop that was only read from. The app says
 * this where it offers the feature, because a sync rule nobody can predict is
 * one people stop trusting the moment it surprises them.
 *
 * IT NEVER DELETES. A remote profile is adopted only after it has arrived
 * whole and parsed; a failed read leaves the local copy exactly as it was. The
 * safe direction, when the alternative is replacing somebody's dietary rules
 * with nothing, is always to do nothing.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodSync = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ENDPOINT = '/api/profile';

  /*
   * Long enough that a game's worth of saves is one request, short enough that
   * closing the tab a moment later has probably already been covered. The
   * pagehide handler below is what covers the rest.
   */
  var SETTLE = 4000;

  function Sync(progress) {
    this.progress = progress;
    this.state = { signedIn: false, account: false, at: 0, busy: false, failed: false };
    this.timer = null;
    this.onChange = null;   // told when the status changes, for painting
    this.onAdopt = null;    // told when a profile arrived from elsewhere
  }

  Sync.prototype.tell = function () {
    if (typeof this.onChange === 'function') {
      try { this.onChange(this.state); } catch (err) { /* painting must not break syncing */ }
    }
  };

  Sync.prototype.on = function () { return this.state.signedIn && this.state.account; };

  function ask(method, body) {
    return fetch(ENDPOINT, {
      method: method,
      headers: body
        ? { 'Content-Type': 'application/json', Accept: 'application/json' }
        : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      if (!res.ok && res.status !== 409) throw new Error('sync ' + res.status);
      return res.json();
    });
  }

  /*
   * Ask what is up there, and reconcile once.
   *
   * Called on boot and whenever the window is focused, which is also when the
   * Premium check runs — the two questions have the same answer window and a
   * profile that changed on another device usually changed while this tab was
   * in the background.
   */
  Sync.prototype.settle = function () {
    var self = this;
    return ask('GET').then(function (answer) {
      self.state.signedIn = !!answer.signedIn;
      self.state.account = !!answer.account;
      self.state.failed = !!answer.error;

      if (!self.on()) { self.tell(); return { did: 'nothing' }; }

      var mine = Number(self.progress.state.savedAt) || 0;
      var theirs = answer.profile ? Number(answer.profile.at) || 0 : 0;
      self.state.at = theirs;

      // Nothing up there yet, or this device has the newer copy.
      if (!answer.profile || mine > theirs) {
        self.tell();
        return self.push(true).then(function () { return { did: 'pushed' }; });
      }

      // Same copy on both. Common, and the point of the timestamp.
      if (theirs === mine) { self.tell(); return { did: 'same' }; }

      var incoming = null;
      try { incoming = JSON.parse(answer.profile.json); } catch (err) { incoming = null; }
      if (!incoming) { self.tell(); return { did: 'unreadable' }; }

      self.progress.adopt(incoming);
      self.state.at = Number(self.progress.state.savedAt) || theirs;
      self.tell();
      if (typeof self.onAdopt === 'function') self.onAdopt(self.progress.state);
      return { did: 'adopted' };
    }).catch(function () {
      self.state.failed = true;
      self.tell();
      return { did: 'failed' };
    });
  };

  /** Send this device's copy up. `now` skips the settle delay. */
  Sync.prototype.push = function (now) {
    var self = this;
    if (!this.on()) return Promise.resolve({ ok: false });
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }

    var send = function () {
      self.state.busy = true;
      self.tell();
      var at = Number(self.progress.state.savedAt) || Date.now();
      return ask('PUT', { at: at, profile: self.progress.state }).then(function (answer) {
        self.state.busy = false;
        self.state.failed = !answer.ok;
        if (answer.ok) self.state.at = at;
        self.tell();
        return answer;
      }).catch(function () {
        self.state.busy = false;
        self.state.failed = true;
        self.tell();
        return { ok: false };
      });
    };

    if (now) return send();
    return new Promise(function (resolve) {
      self.timer = setTimeout(function () { self.timer = null; resolve(send()); }, SETTLE);
    });
  };

  /** Hook the profile up so every save eventually reaches the server. */
  Sync.prototype.watch = function () {
    var self = this;
    this.progress.onSave = function () { self.push(false); };

    /*
     * A tab being hidden is the last reliable moment to save anything: on a
     * phone it is what happens instead of "close", and pagehide is the only
     * event a browser promises to deliver on the way out. Both send whatever
     * is pending rather than waiting out the settle timer.
     */
    var flush = function () { if (self.timer) self.push(true); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flush();
    });
  };

  /** Make the free account. Answers with where to send them, if anywhere. */
  Sync.prototype.start = function () {
    return ask('POST').catch(function () {
      return { ok: false, why: 'Could not reach the server. Try again in a minute.' };
    });
  };

  return { Sync: Sync };
});
