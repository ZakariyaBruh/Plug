/*
 * ads.js — the ad dock: one fixed strip along the bottom of the app that sits OVER
 * the page and never pushes it, so there is an ad on screen everywhere the app is,
 * the decide questions, every game and the Ask box included, and nothing jumps when
 * it loads.
 *
 * The decision, the numbers and what stays out are in the long note over ADS_ON in
 * src/lib/site.ts, and the units live in config.js. This file is only the rules,
 * applied:
 *   - nothing unless a unit is configured, and nothing at all for a Premium member;
 *   - THERE IS NO OTHER OFF SWITCH, and nothing here may become one: not Save-Data,
 *     not the cookie choice, not a setting (scripts/shell-test.mjs fails if one appears);
 *   - it is a strip, not a cover. A fixed ad laid across the controls would sit on top of
 *     what people are tapping (the Ask button, the game's own buttons), and an accidental
 *     tap is invalid traffic: the one thing an ad network closes an account for. So the
 *     strip has a fixed height that the page reserves once (the --anchor-h variable), which
 *     is why it never causes a jump and never covers a control;
 *   - what is shown fits the width: two banners side by side on a wide screen, one on a
 *     phone, and the one on a phone is swapped for a fresh one about once a minute while the
 *     page is visible.
 *
 * WHAT THE COOKIE CHOICE DOES: it changes how the ad loads, not whether. Cookie law is
 * about what is stored on a device and who is tracked, not about whether an advert may be
 * shown, and YouTube and Spotify do the same: say no to cookies and you still get ads,
 * just not personalised ones. With consent, a normal frame. Without it, or where the visitor
 * has to be asked first and has not been, or where we cannot tell: the same ad in a frame that
 * asks the browser for no cookies and a throwaway storage partition (`credentialless`, which
 * Chromium browsers honour and others ignore), and no referrer. The network still sees an IP
 * address and a browser either way, and the privacy page says so.
 *
 * SANDBOX. allow-scripts (the network's loader has to run) and allow-popups /
 * allow-popups-to-escape-sandbox (a real click still opens a normal tab), and nothing else.
 * No allow-same-origin: the ad gets an opaque origin and cannot read this page's cookies,
 * storage or DOM. No allow-top-navigation: a script inside that tries to set
 * window.top.location is refused by the browser. It is srcdoc, not a write into the frame,
 * because writing needs the same-origin access the sandbox removes. scripts/shell-test.mjs
 * fails if either flag ever appears in this file or in components/AdSlot.tsx.
 */
var Ads = (function () {
  var SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';
  var cfg = (window.FoodConfig && window.FoodConfig.ads) || {};
  var ROTATE_MS = 60000;
  var LABEL_H = 20, PAD = 8;

  function live(unit) { return !!(unit && unit.src && unit.key); }
  function anyLive() { return Object.keys(cfg).some(function (k) { return live(cfg[k]); }); }

  // Which banners fit a strip this wide, in order of preference.
  function strip(width) {
    var order = width >= 1260 ? ['leaderboard', 'wide']
      : width >= 900 ? ['leaderboard']
      : width >= 520 ? ['wide']
      : ['mobile'];
    return order.map(function (size) { return cfg[size]; }).filter(live);
  }

  function html(unit) {
    var options = JSON.stringify({ key: unit.key, format: 'iframe', height: unit.height, width: unit.width, params: {} });
    return '<!doctype html><html><head><meta charset="utf-8"></head>' +
      '<body style="margin:0;padding:0;overflow:hidden">' +
      '<script>atOptions=' + options + ';</script>' +
      '<script src="' + unit.src + '"></script>' +
      '</body></html>';
  }

  // Which way to load it. Consent known and given: normally. Anything else: without cookies.
  function restricted() { return typeof Consent === 'undefined' || Consent.allowed() !== true; }

  var dockEl = null, rowEl = null, premium = null, known = false, timer = 0, lastW = 0, started = false;

  function build() {
    if (dockEl) return dockEl;
    dockEl = document.createElement('div');
    dockEl.id = 'ad-dock';
    dockEl.className = 'dock';
    dockEl.setAttribute('role', 'complementary');
    dockEl.setAttribute('aria-label', 'Advertisement');
    var label = document.createElement('p');
    label.className = 'ad-label';
    label.appendChild(document.createTextNode('Advertisement · '));
    var link = document.createElement('a');
    link.href = '/premium'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'Remove ads with Premium';
    label.appendChild(link);
    rowEl = document.createElement('div');
    rowEl.className = 'dock-row';
    dockEl.appendChild(label); dockEl.appendChild(rowEl);
    document.body.appendChild(dockEl);
    return dockEl;
  }

  function reserve(h) {
    document.documentElement.style.setProperty('--anchor-h', h + 'px');
    document.body.classList.toggle('has-dock', h > 0);
  }

  function draw() {
    if (!started || !known || premium) return;
    var units = strip(window.innerWidth);
    if (!units.length) return;
    build();
    lastW = window.innerWidth;
    rowEl.textContent = '';
    var tallest = 0;
    units.forEach(function (unit) {
      var frame = document.createElement('iframe');
      frame.title = 'Advertisement';
      frame.width = unit.width;
      frame.height = unit.height;
      frame.setAttribute('scrolling', 'no');
      frame.setAttribute('sandbox', SANDBOX);
      if (restricted()) { frame.setAttribute('credentialless', ''); frame.setAttribute('referrerpolicy', 'no-referrer'); frame.setAttribute('data-mode', 'cookieless'); }
      frame.srcdoc = html(unit);
      rowEl.appendChild(frame);
      if (unit.height > tallest) tallest = unit.height;
    });
    dockEl.style.height = (LABEL_H + tallest + PAD) + 'px';
    reserve(LABEL_H + tallest + PAD);
  }

  function remove() {
    if (dockEl) { dockEl.remove(); dockEl = null; rowEl = null; }
    reserve(0);
  }

  function schedule() {
    clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) draw(); }, ROTATE_MS);
  }

  // Called once the first answer to "is this a Premium member?" is in (and again whenever
  // it changes). A member is never shown the dock, not even for the moment before it is known.
  function premiumKnown(isPremium) {
    known = true;
    premium = !!isPremium;
    if (premium) { clearInterval(timer); remove(); return; }
    // Once it is known whether to ask first (one small request), so the first load is the right one.
    if (typeof Consent !== 'undefined') Consent.ready(function () { if (!premium) { draw(); schedule(); } });
    else { draw(); schedule(); }
  }

  function start() {
    if (started || !anyLive()) return;
    started = true;
    // If the answer never comes (offline, the request failed) the dock is shown after a few
    // seconds rather than not at all: not knowing is not a reason to hide an ad.
    setTimeout(function () { if (!known) premiumKnown(false); }, 3500);
    var resizeT = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        // Only when the width crossed into a different set of banners.
        if (known && !premium && strip(window.innerWidth).map(function (u) { return u.key; }).join() !== strip(lastW).map(function (u) { return u.key; }).join()) draw();
      }, 250);
    });
    // A changed mind changes how the ads are loaded: the ones on screen are redrawn the other way.
    if (typeof Consent !== 'undefined') Consent.onChange(function () { draw(); });
  }

  return { start: start, premiumKnown: premiumKnown, enabled: anyLive, strip: strip };
})();
