/*
 * ads.js — the ads in the app, in two layers that add up.
 *
 *   THE DOCK. One fixed strip along the bottom of the screen that sits OVER the page and
 *   never pushes it, so there is an ad on screen everywhere the app is: the decide
 *   questions, every game, the Ask box. Its height is reserved once (--anchor-h), so
 *   nothing jumps when it loads and it never lies across a control.
 *   THE SLOTS. The ones that sit IN the page and take their own room: under every section,
 *   in the middle of the Dishes list, at the end of Profile, twice on the front page.
 *
 * Both are here because the owner asked for the two together, for more ads. They are
 * different on purpose and one never replaces the other: the dock is what makes a game or a
 * question screen carry an ad at all, and the slots are what a scrolling page carries.
 *
 * The decision, the numbers and what stays out are in the long note over ADS_ON in
 * src/lib/site.ts, and the units live in config.js. This file is only the rules, applied:
 *   - nothing unless a unit is configured, and nothing at all for a Premium member;
 *   - THERE IS NO OTHER OFF SWITCH, and nothing here may become one: not Save-Data, not the
 *     cookie choice, not a setting (scripts/shell-test.mjs fails if one appears);
 *   - a fixed ad laid across the controls would sit on top of what people are tapping, and
 *     an accidental tap is invalid traffic: the one thing an ad network closes an account
 *     for. That is why the dock is a strip with reserved room and not a cover;
 *   - what is shown fits the width: two banners side by side on a wide screen, one on a phone.
 *
 * WHAT THE COOKIE CHOICE DOES: it changes how the ad loads, not whether. Cookie law is about
 * what is stored on a device and who is tracked, not about whether an advert may be shown, and
 * YouTube and Spotify do the same: say no to cookies and you still get ads, just not
 * personalised ones. With consent, a normal frame. Without it, or where the visitor has to be
 * asked first and has not been, or where we cannot tell: the same ad in a frame that asks the
 * browser for no cookies and a throwaway storage partition (`credentialless`, which Chromium
 * browsers honour and others ignore). The network still sees an IP address and a browser either
 * way, and the privacy page says so.
 *
 * THE FRAME. Every ad is an iframe pointing at /ad-frame?u=<size> (src/routes/ad-frame.ts), a
 * real page on this site, not a srcdoc. A network decides whether to fill from who is asking and
 * which site it says it is on; a frame with no address and no referrer asked as a stranger and
 * was answered with an empty script. The frame is sent only this site's address as its referrer
 * (`origin`: never a path), cookie choice or not. It reports back whether anything was drawn;
 * when nothing was (the network has nothing to show, the unit is not approved yet, a blocker ate
 * it) the box shows the app's own card for Premium instead of an empty rectangle. An advertiser's
 * ad always wins the box when there is one.
 *
 * SANDBOX. allow-scripts (the network's loader has to run) and allow-popups /
 * allow-popups-to-escape-sandbox (a real click still opens a normal tab), and nothing else.
 * No allow-same-origin: the ad gets an opaque origin and cannot read this page's cookies,
 * storage or DOM. No allow-top-navigation: a script inside that tries to set window.top.location
 * is refused by the browser. scripts/shell-test.mjs fails if either flag ever appears in this
 * file or in components/AdSlot.tsx.
 */
var Ads = (function () {
  var SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';
  var cfg = (window.FoodConfig && window.FoodConfig.ads) || {};
  var ROTATE_MS = 60000;
  var LABEL_H = 20, PAD = 8;
  var outcome = {}; // size -> 'filled' | 'empty' | 'error', the last word from a frame

  function live(unit) { return !!(unit && unit.src && unit.key); }
  function anyLive() { return Object.keys(cfg).some(function (k) { return live(cfg[k]); }); }

  // Which banners fit a dock this wide, in order of preference (names, as config.js has them).
  function strip(width) {
    var order = width >= 1260 ? ['leaderboard', 'wide']
      : width >= 900 ? ['leaderboard']
      : width >= 520 ? ['wide']
      : ['mobile'];
    return order.filter(function (n) { return live(cfg[n]); });
  }

  // Which banners a slot shows together, for a slot this wide.
  function cluster(placement, width) {
    var wide = width >= 600;
    var order = placement === 'end'
      ? (wide ? ['rectangle', 'tower', 'wide'] : ['rectangle', 'mobile', 'tower'])
      : width >= 760 ? ['leaderboard', 'wide', 'mobile']
        : wide ? ['wide', 'mobile', 'rectangle'] : ['mobile', 'rectangle', 'tower'];
    var count = placement === 'inline' || !wide ? 2 : 3;
    return order.filter(function (n) { return live(cfg[n]) && cfg[n].width <= Math.max(width, 320); }).slice(0, count);
  }

  // Which way to load it. Consent known and given: normally. Anything else: without cookies.
  function restricted() { return typeof Consent === 'undefined' || Consent.allowed() !== true; }
  function known(cb) { if (typeof Consent === 'undefined') return cb(false); Consent.ready(cb); }

  function frame(name, lazy) {
    var unit = cfg[name];
    var f = document.createElement('iframe');
    f.title = 'Advertisement';
    f.width = unit.width;
    f.height = unit.height;
    f.setAttribute('scrolling', 'no');
    f.setAttribute('sandbox', SANDBOX);
    f.setAttribute('referrerpolicy', 'origin');
    f.setAttribute('data-ad', name);
    if (lazy) f.setAttribute('loading', 'lazy');
    if (restricted()) { f.setAttribute('credentialless', ''); f.setAttribute('data-mode', 'cookieless'); }
    f.src = '/ad-frame?u=' + encodeURIComponent(name);
    return f;
  }

  // The app's own card, in the exact size of the ad that did not come.
  function house(f) {
    if (f._house) return;
    var unit = cfg[f.getAttribute('data-ad')];
    var a = document.createElement('a');
    a.className = 'house-ad';
    a.href = '/premium';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.width = unit.width + 'px';
    a.style.height = unit.height + 'px';
    a.setAttribute('data-house', f.getAttribute('data-ad'));
    var big = unit.height >= 90;
    var b = document.createElement('b');
    b.textContent = big ? 'morsels45 Premium' : 'Premium';
    var s = document.createElement('span');
    s.textContent = unit.height >= 250 ? 'No ads, and the smarter assistant: recipes, swaps, a plan for the week.'
      : unit.height >= 90 ? 'No ads. A smarter assistant. See what Premium adds.'
      : unit.width >= 400 ? 'No ads, and a smarter assistant. See Premium.'
      : 'No ads. See Premium';
    a.appendChild(b); a.appendChild(s);
    // The frame stays, hidden, and is given back if the network turns out to have been slow rather than empty:
    // an auction that takes eight seconds is still an ad.
    f._house = a; f.hidden = true; f.parentNode.insertBefore(a, f);
  }
  function unhouse(f) { if (f._house) { f._house.remove(); f._house = null; f.hidden = false; } }

  window.addEventListener('message', function (e) {
    var d = e.data && e.data.m45ad;
    if (!d || typeof d.s !== 'string') return;
    var frames = document.querySelectorAll('iframe[data-ad]');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow !== e.source) continue;
      var name = frames[i].getAttribute('data-ad');
      outcome[name] = d.s;
      frames[i].setAttribute('data-state', d.s);
      if (d.s === 'filled') unhouse(frames[i]);
      if (d.s === 'empty' || d.s === 'error') {
        try { console.info('[ads] nothing came back for the ' + name + ' unit (' + d.s + '). Network unit not approved or not filling, or a blocker.'); } catch (err) { /* fine */ }
        house(frames[i]);
      }
      return;
    }
  });

  var premium = null, known_ = false, started = false;

  /* ------------------------------------------------------------------ dock */
  var dockEl = null, rowEl = null, timer = 0, lastW = 0;

  function buildDock() {
    if (dockEl) return dockEl;
    dockEl = document.createElement('div');
    dockEl.id = 'ad-dock';
    dockEl.className = 'dock';
    dockEl.setAttribute('role', 'complementary');
    dockEl.setAttribute('aria-label', 'Advertisement');
    dockEl.appendChild(label());
    rowEl = document.createElement('div');
    rowEl.className = 'dock-row';
    dockEl.appendChild(rowEl);
    document.body.appendChild(dockEl);
    return dockEl;
  }

  function label() {
    var p = document.createElement('p');
    p.className = 'ad-label';
    p.appendChild(document.createTextNode('Advertisement · '));
    var link = document.createElement('a');
    link.href = '/premium'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'Remove ads with Premium';
    p.appendChild(link);
    return p;
  }

  function reserve(h) {
    document.documentElement.style.setProperty('--anchor-h', h + 'px');
    document.body.classList.toggle('has-dock', h > 0);
    // Dot (the companion) stands above whatever the bottom of the screen has taken.
    try { window.dispatchEvent(new Event('m45:dock')); } catch (err) { /* old browser */ }
  }

  function drawDock() {
    if (!started || !known_ || premium) return;
    var names = strip(window.innerWidth);
    if (!names.length) return;
    buildDock();
    lastW = window.innerWidth;
    rowEl.textContent = '';
    var tallest = 0;
    names.forEach(function (n) {
      rowEl.appendChild(frame(n, false));
      if (cfg[n].height > tallest) tallest = cfg[n].height;
    });
    dockEl.style.height = (LABEL_H + tallest + PAD) + 'px';
    reserve(LABEL_H + tallest + PAD);
  }

  function removeDock() {
    if (dockEl) { dockEl.remove(); dockEl = null; rowEl = null; }
    reserve(0);
  }

  function schedule() {
    clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) drawDock(); }, ROTATE_MS);
  }

  /* ----------------------------------------------------------------- slots */
  function drawSlot(container, placement) {
    var names = cluster(placement, container.clientWidth || window.innerWidth);
    if (!names.length) return;
    // One label over the whole cluster: a label on each reads like the screen is mostly ads.
    var row = document.createElement('div');
    row.className = 'ad-row';
    names.forEach(function (n) { row.appendChild(frame(n, true)); });
    container.appendChild(label());
    container.appendChild(row);
    container.setAttribute('role', 'complementary');
    container.setAttribute('aria-label', 'Advertisement');
    container.classList.add('is-filled');
  }

  function arm(container) {
    if (typeof IntersectionObserver === 'undefined') { drawSlot(container, container._adPlacement); return; }
    var seen = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          seen.disconnect();
          container._adSeen = null;
          drawSlot(container, container._adPlacement);
          return;
        }
      }
    }, { rootMargin: '400px 0px' });
    container._adSeen = seen;
    seen.observe(container);
  }

  /*
   * Arm a slot. `ctx` is what the game knows and this file does not: { premium: bool }. Calling
   * it again on the same element does nothing, so a re-render does not reload (and so re-count)
   * the ads; refresh() asks for a fresh cluster on purpose, which app.js does when the screen
   * changes. Consent is waited for, not assumed: it is known whether to ask first after one small
   * request, and what the answer changes is how the ad loads.
   */
  function mount(container, placement, ctx) {
    if (!container || container.dataset.adArmed) return;
    if (!anyLive() || !ctx || ctx.premium) return;
    container.dataset.adArmed = '1';
    container._adPlacement = placement;
    known(function () { if (container.dataset.adArmed) arm(container); });
  }
  function clear(container) {
    if (container._adSeen) { container._adSeen.disconnect(); container._adSeen = null; }
    container.textContent = '';
    container.classList.remove('is-filled');
    container.removeAttribute('role');
    container.removeAttribute('aria-label');
  }
  function refresh(container, placement, ctx) {
    if (!container) return;
    clear(container);
    delete container.dataset.adArmed;
    mount(container, placement, ctx);
  }


  /* ------------------------------------------------------------- the social bar */
  /*
   * ADSTERRA'S SOCIAL BAR, WITH ITS CONDITIONS. It is the one ad here that is not in a sandboxed
   * frame: it is a script that draws a small notification-style bar over the page, so it has to run
   * in the page, with a page's powers. That is why it is held to more than the banners are:
   *   - never for a Premium member, and not before it is known whether somebody is one;
   *   - only where the visitor has accepted cookies (or is somewhere that does not ask), because it
   *     cannot be loaded cookie-free the way a frame can: so Essential only, and a visitor who has to be
   *     asked and has not said yes, get the banners and not this;
   *   - not at once: ten seconds in, so nobody has it land on them while they are still reading;
   *   - never over a game or a decision being played. It is the network's own element and we cannot
   *     style it, but it is found (it is fixed and sits above everything the app has) and hidden for
   *     as long as one is on screen: a bar under a thumb in the middle of a game is how accidental
   *     taps happen, which is invalid traffic;
   *   - if a visitor takes the cookie choice back, or signs in to Premium, the page is reloaded so the
   *     script is gone, because a script cannot be unloaded.
   */
  var socialEl = null, socialT = 0;
  function socialSrc() { return (window.FoodConfig && window.FoodConfig.social) || ''; }
  function socialDelay() { return typeof (window.FoodConfig && window.FoodConfig.socialDelay) === 'number' ? window.FoodConfig.socialDelay : 10000; }
  function tagSocial(n) {
    if (!n || n.nodeType !== 1 || n.hasAttribute('data-social-bar')) return;
    var check = function () {
      try { var cs = getComputedStyle(n); if (cs.position === 'fixed' && parseInt(cs.zIndex, 10) >= 1000) n.setAttribute('data-social-bar', ''); } catch (err) { /* gone already */ }
    };
    requestAnimationFrame(check); setTimeout(check, 700); setTimeout(check, 2500);
  }
  function watchSocial() {
    if (typeof MutationObserver === 'undefined') return;
    var o = new MutationObserver(function (muts) { for (var i = 0; i < muts.length; i++) Array.prototype.forEach.call(muts[i].addedNodes, tagSocial); });
    o.observe(document.body, { childList: true }); o.observe(document.documentElement, { childList: true });
  }
  function loadSocial() {
    if (socialEl || !started || !socialSrc() || premium !== false) return;
    if (typeof Consent === 'undefined' || Consent.allowed() !== true) return;
    watchSocial();
    socialEl = document.createElement('script');
    socialEl.async = true; socialEl.setAttribute('data-cfasync', 'false'); socialEl.src = socialSrc();
    document.body.appendChild(socialEl);
  }
  // Consent taken back, or Premium begun, with the script already on the page: the bar is hidden at once and the page
  // reloaded to lose the script (a script cannot be unloaded), but not under somebody in the middle of a game or a question.
  function dropSocial() {
    document.body.classList.add('social-withdrawn');
    (function again() {
      var b = document.body;
      if (b.classList.contains('is-playing') || b.classList.contains('is-games') || document.querySelector('#panel-question.is-current')) { setTimeout(again, 2000); return; }
      location.reload();
    })();
  }
  function scheduleSocial(ms) {
    if (socialEl || !socialSrc()) return;
    clearTimeout(socialT);
    socialT = setTimeout(loadSocial, ms === undefined ? socialDelay() : ms);
  }

  /* ----------------------------------------------------------------- the rest */
  // Called once the first answer to "is this a Premium member?" is in (and again whenever it
  // changes). A member is never shown the dock, not even for the moment before it is known.
  function premiumKnown(isPremium) {
    known_ = true;
    premium = !!isPremium;
    if (premium) { clearInterval(timer); removeDock(); clearTimeout(socialT); if (socialEl) dropSocial(); return; }
    // Once it is known whether to ask first (one small request), so the first load is the right one.
    known(function () { if (!premium) { drawDock(); schedule(); scheduleSocial(); } });
  }

  function start() {
    if (started || !anyLive()) return;
    started = true;
    // If the answer never comes (offline, the request failed) the dock is shown after a few
    // seconds rather than not at all: not knowing is not a reason to hide an ad.
    setTimeout(function () { if (!known_) premiumKnown(false); }, 3500);
    var resizeT = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        // Only when the width crossed into a different set of banners.
        if (known_ && !premium && strip(window.innerWidth).join() !== strip(lastW).join()) drawDock();
      }, 250);
    });
  }

  // A changed mind changes how the ads are loaded: the ones on screen are redrawn the other way.
  if (typeof Consent !== 'undefined') {
    Consent.onChange(function (allowed) {
      // Said yes: the social bar may come, soon. Said no, with it already on the page: the page goes, and with it the script.
      if (allowed) { if (known_ && premium === false) scheduleSocial(3000); } else if (socialEl) { dropSocial(); return; } else clearTimeout(socialT);
      drawDock();
      var slots = document.querySelectorAll('.ad-wrap[data-ad-armed]');
      for (var i = 0; i < slots.length; i++) { var c = slots[i]; clear(c); arm(c); }
    });
  }

  return {
    start: start, premiumKnown: premiumKnown, mount: mount, refresh: refresh, enabled: anyLive,
    strip: strip, cluster: cluster, social: function () { return !!socialEl; },
    // What the frames have said, by size: for a look in the console (`Ads.status()`).
    status: function () { return JSON.parse(JSON.stringify(outcome)); }
  };
})();
