/*
 * consent.js — the cookie choice, asked once, changeable any time.
 *
 * Two kinds of thing here. ESSENTIAL: the app remembering your settings and
 * your progress in this browser; it cannot do what you asked without that, so
 * it is always on and not a choice. NOT ESSENTIAL: the advertising network's
 * cookies and the analytics tags. Those are the choice. Ads are never listed
 * as essential, here or on the privacy page (scripts/shell-test.mjs checks).
 *
 * Where the law says to ask first (the EU, the EEA, the UK, Switzerland, or a
 * country that cannot be told — see src/lib/consent.ts), ads and analytics wait
 * for "Accept all". Everywhere else they run from the first visit and the
 * banner is there to turn them off. The answer is kept in this browser under
 * the same key the marketing pages use, so it is asked once for the whole site.
 *
 * Consent.ready(cb)    cb(allowed) once it is known whether ads may run.
 * Consent.onChange(cb) cb(allowed) whenever the visitor changes their mind.
 * Consent.show()       open the banner again (the privacy page and the footer do).
 */
var Consent = (function () {
  var KEY = 'm45-consent'; // 'all' | 'essential'
  var askFirst = null;     // null until /api/region has answered
  var ready = [];
  var changed = [];
  var bar = null;

  function stored() {
    try { var v = localStorage.getItem(KEY); return v === 'all' || v === 'essential' ? v : null; } catch (err) { return null; }
  }
  function allowed() {
    var s = stored();
    if (s) return s === 'all';
    if (askFirst === null) return null;
    return !askFirst;
  }
  function flush() {
    var a = allowed();
    if (a === null) return;
    ready.splice(0).forEach(function (cb) { cb(a); });
  }
  function choose(value) {
    try { localStorage.setItem(KEY, value); } catch (err) { /* the choice lasts until the page closes */ }
    var a = value === 'all';
    if (bar) { bar.hidden = true; }
    flush();
    changed.forEach(function (cb) { cb(a); });
    // The marketing pages listen for the same word.
    try { window.dispatchEvent(new CustomEvent('m45:consent', { detail: { allowed: a } })); } catch (err) { /* old browser */ }
  }

  function build() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookies');
    bar.innerHTML =
      '<p class="consent-text"><b>Cookies.</b> Essential ones remember your settings and progress in this browser; ' +
      'the app needs them. Advertising (Adsterra) and analytics (Google Analytics, Microsoft Clarity) set their own ' +
      'cookies too, and that part is your choice. Ads pay for the free app, and Premium has none. ' +
      '<a href="/privacy" target="_blank" rel="noopener">Details</a></p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="consent-btn is-main" data-c="all">Accept all</button>' +
      '<button type="button" class="consent-btn" data-c="essential">Essential only</button>' +
      '</div>';
    bar.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-c]');
      if (b) choose(b.getAttribute('data-c'));
    });
    document.body.appendChild(bar);
    return bar;
  }
  function show() { build().hidden = false; var b = bar.querySelector('.consent-btn'); if (b) b.focus({ preventScroll: true }); }

  // Where is this visitor? Failing to find out means asking.
  function region() {
    var done = false;
    function settle(v) { if (done) return; done = true; askFirst = v; flush(); }
    try {
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var t = setTimeout(function () { if (ctl) ctl.abort(); settle(true); }, 4000);
      fetch('/api/region', { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.json(); })
        .then(function (j) { clearTimeout(t); settle(!!(j && j.askFirst)); })
        .catch(function () { clearTimeout(t); settle(true); });
    } catch (err) { settle(true); }
  }

  function start() {
    if (!stored()) { build(); }
    region();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  return {
    ready: function (cb) { var a = allowed(); if (a === null) ready.push(cb); else cb(a); },
    onChange: function (cb) { changed.push(cb); },
    allowed: allowed,
    show: show
  };
})();
