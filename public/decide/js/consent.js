/*
 * consent.js — the cookie choice, asked once, changeable any time.
 *
 * Two kinds of thing here. ESSENTIAL: the app remembering your settings and
 * your progress in this browser; it cannot do what you asked without that, so
 * it is always on and not a choice. NOT ESSENTIAL: the advertising network's
 * cookies and the analytics tags. Those are the choice. Ads are never listed
 * as essential, here or on the privacy page (scripts/shell-test.mjs checks).
 *
 * THE CHOICE IS ABOUT COOKIES, NOT ABOUT WHETHER THERE ARE ADS. There always are
 * (see js/ads.js). Where the law says to ask first (the EU, the EEA, the UK,
 * Switzerland, or a country that cannot be told — see src/lib/consent.ts), the
 * analytics tags wait for "Accept all" and the ads load without cookies until it.
 * Everywhere else both run from the first visit and the banner is there to
 * restrict them. The answer is kept in this browser under
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
  /*
   * WHETHER THE AD NETWORK'S OWN CODE RUNS IN THE PAGE. The network cannot draw an ad without its own
   * cookies (shown on a real device: framed and cookie-free it drew blank boxes), so this is not the same
   * question as allowed(), which gates analytics. Yes when "Accept all" was pressed, and yes where the law
   * does not make us ask first (see lib/consent.ts), whatever else was pressed. No where asking is required
   * and the answer is not yes, and until it is known which of those this is: null.
   */
  function adsInPage() {
    if (stored() === 'all') return true;
    if (askFirst === null) return null;
    return !askFirst;
  }
  var adsWaiting = [];
  function flush() {
    var a = allowed();
    if (a !== null) ready.splice(0).forEach(function (cb) { cb(a); });
    var b = adsInPage();
    if (b !== null) adsWaiting.splice(0).forEach(function (cb) { cb(b); });
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

  // The master switch for ads (config.js adsOn): the notice says what is true.
  function adsOn() { return !!(window.FoodConfig && window.FoodConfig.adsOn); }

  function build() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookies');
    bar.innerHTML =
      '<p class="consent-text"><b>Cookies.</b> Essential ones remember your settings and progress in this browser; ' +
      'the app needs them. ' + (adsOn()
        ? 'Ads pay for the free app; Premium has none. The ad network (Adsterra) cannot draw an ad ' +
          'without its own cookies, and analytics (Google Analytics, Microsoft Clarity) use them too. Where the law lets us show ads ' +
          'without asking first, they run whatever you pick here and \u201cEssential only\u201d turns analytics off. Where we have to ask ' +
          '(the EU, the UK, Switzerland, or a place we cannot tell), no cookies means no ad network, and the box shows a Premium card instead. '
        : 'There are no ads. Analytics (Google Analytics, Microsoft Clarity) use cookies too, and only run if you press Accept all. ') +
      'Whop, which hosts this app, counts page views on every page ' +
      'itself, and this choice cannot switch that off. ' +
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
    adsInPage: adsInPage,
    adsReady: function (cb) { var b = adsInPage(); if (b === null) adsWaiting.push(cb); else cb(b); },
    show: show,
    // For ?adsdebug: what is stored, and whether this place has to be asked.
    peek: function () { return { stored: stored(), askFirst: askFirst }; }
  };
})();
