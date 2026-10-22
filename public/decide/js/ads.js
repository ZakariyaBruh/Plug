/*
 * ads.js — a small cluster of ads at a time, on every screen that is read,
 * from the first visit, and never for a Premium member.
 *
 * The decision, what stays out and the numbers are in the long note over ADS_ON
 * in src/lib/site.ts, and the units live in config.js. This file is only the
 * rules, applied. It draws nothing unless a unit is configured, nothing for a
 * Premium member, nothing where the visitor has to opt in first and has not
 * (see consent.js), and nothing until the slot is about to scroll into view, so
 * a visitor who never reaches it never loads it. It no longer waits for a few
 * decisions to be finished, and it no longer steps aside for Save-Data: both
 * were choices, and the owner made the opposite one.
 *
 * It is NEVER mounted in a game being played, in the decide questions, the
 * answer or the reward, or on the checkout and account pages. Everywhere else
 * app.js gives each screen a slot.
 *
 * `placement` is where the slot sits; cluster() decides which two or three
 * banners that means at this width (the same table as adCluster in site.ts):
 *   inline — in the middle of something: two
 *   end    — after something has been read: three on a wide screen, two on a phone
 * Units that are not configured are skipped; with none, nothing is drawn.
 *
 * SANDBOX. allow-scripts (the network's loader has to run) and allow-popups /
 * allow-popups-to-escape-sandbox (a real click still opens a normal tab), and
 * nothing else. No allow-same-origin: the ad gets an opaque origin and cannot
 * read this page's cookies, storage or DOM. No allow-top-navigation: a script
 * inside that tries to set window.top.location is refused by the browser. It
 * is srcdoc, not a write into the frame, because writing needs the same-origin
 * access the sandbox removes. scripts/shell-test.mjs fails if either flag
 * ever appears in this file or in components/AdSlot.tsx.
 */
var Ads = (function () {
  var SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';
  var cfg = (window.FoodConfig && window.FoodConfig.ads) || {};

  function live(unit) { return !!(unit && unit.src && unit.key); }

  function anyLive() {
    return Object.keys(cfg).some(function (k) { return live(cfg[k]); });
  }

  function cluster(placement, width) {
    var wide = width >= 600;
    var order = placement === 'end'
      ? (wide ? ['rectangle', 'tower', 'wide'] : ['rectangle', 'mobile', 'tower'])
      : width >= 760 ? ['leaderboard', 'wide', 'mobile']
        : wide ? ['wide', 'mobile', 'rectangle'] : ['mobile', 'rectangle', 'tower'];
    var count = placement === 'inline' || !wide ? 2 : 3;
    return order
      .map(function (size) { return cfg[size]; })
      .filter(function (unit) { return live(unit) && unit.width <= Math.max(width, 320); })
      .slice(0, count);
  }

  function html(unit) {
    var options = JSON.stringify({ key: unit.key, format: 'iframe', height: unit.height, width: unit.width, params: {} });
    return '<!doctype html><html><head><meta charset="utf-8"></head>' +
      '<body style="margin:0;padding:0;overflow:hidden">' +
      '<script>atOptions=' + options + ';</script>' +
      '<script src="' + unit.src + '"></script>' +
      '</body></html>';
  }

  function draw(container, placement) {
    var units = cluster(placement, container.clientWidth || window.innerWidth);
    if (!units.length) return;

    // One label over the whole cluster: a label on each reads like the screen is mostly ads.
    var label = document.createElement('p');
    label.className = 'ad-label';
    label.appendChild(document.createTextNode('Advertisement · '));
    var link = document.createElement('a');
    link.href = '/premium';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Remove ads with Premium';
    label.appendChild(link);

    var row = document.createElement('div');
    row.className = 'ad-row';
    units.forEach(function (unit) {
      var frame = document.createElement('iframe');
      frame.title = 'Advertisement';
      frame.width = unit.width;
      frame.height = unit.height;
      frame.setAttribute('scrolling', 'no');
      frame.setAttribute('sandbox', SANDBOX);
      frame.setAttribute('loading', 'lazy');
      frame.srcdoc = html(unit);
      row.appendChild(frame);
    });

    container.appendChild(label);
    container.appendChild(row);
    container.setAttribute('role', 'complementary');
    container.setAttribute('aria-label', 'Advertisement');
    container.classList.add('is-filled');
  }

  /*
   * Arm a slot. `ctx` is what the game knows and this file does not:
   * { premium: bool }. Calling it again on the same element does nothing, so a
   * re-render does not reload (and so re-count) the ads; refresh() is the way to
   * ask for a fresh cluster on purpose, which app.js does when the screen changes.
   *
   * Consent is waited for, not assumed: where the visitor has to opt in, the slot
   * is kept and drawn the moment they do, and taken down again if they take it back.
   */
  var waiting = [];
  function allowedNow(cb) {
    if (typeof Consent === 'undefined') return cb(false);
    Consent.ready(cb);
  }
  function arm(container) {
    if (typeof IntersectionObserver === 'undefined') return;
    var seen = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          seen.disconnect();
          container._adSeen = null;
          draw(container, container._adPlacement);
          return;
        }
      }
    }, { rootMargin: '400px 0px' });
    container._adSeen = seen;
    seen.observe(container);
  }
  function mount(container, placement, ctx) {
    if (!container || container.dataset.adArmed) return;
    if (!anyLive() || !ctx || ctx.premium) return;
    container.dataset.adArmed = '1';
    container._adPlacement = placement;
    allowedNow(function (ok) {
      if (!container.dataset.adArmed) return;
      if (ok) arm(container); else waiting.push(container);
    });
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

  if (typeof Consent !== 'undefined') {
    Consent.onChange(function (ok) {
      if (ok) { waiting.splice(0).forEach(function (c) { if (c.dataset.adArmed) arm(c); }); return; }
      // Taken back: no ad stays on the screen, and none is drawn later.
      var slots = document.querySelectorAll('.ad-wrap[data-ad-armed]');
      for (var i = 0; i < slots.length; i++) { clear(slots[i]); waiting.push(slots[i]); }
    });
  }

  return { mount: mount, refresh: refresh, enabled: anyLive };
})();
