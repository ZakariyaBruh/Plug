/*
 * ads.js — one ad at a time, where it cannot hurt anything, and only once it
 * has been earned.
 *
 * The decision, the sizes, what stays out and the numbers behind "gentle" are
 * in the long note over ADS_ON in src/lib/site.ts, and the units live in
 * config.js. This file is only the rules, applied. In short it draws nothing
 * unless a unit is configured, nothing for a Premium member, nothing until
 * somebody has finished a couple of decisions, and nothing until the slot is
 * about to scroll into view — so a visitor who never reaches it never loads it.
 *
 * It is NEVER mounted in the decide flow, a game, the answer or the reward
 * (those are the two moments the persuasion notes say get the care), and
 * app.js only ever calls it from the Dishes list and the Profile screen.
 *
 * `placement` is where the slot sits, not which size it is:
 *   inline — in the middle of something: 728x90 with room for it, else 320x50
 *   end    — after something has been read: 300x250
 * A placement whose preferred unit is not configured uses the other that fits
 * rather than show nothing; with none configured, nothing is drawn at all.
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
  var AFTER = (window.FoodConfig && window.FoodConfig.adsAfterDecisions) || 2;

  function live(unit) { return !!(unit && unit.src && unit.key); }

  function anyLive() {
    return live(cfg.leaderboard) || live(cfg.banner) || live(cfg.rectangle);
  }

  function pick(placement, width) {
    var order = placement === 'end'
      ? ['rectangle', 'banner', 'leaderboard']
      : width >= 760 ? ['leaderboard', 'banner', 'rectangle'] : ['banner', 'rectangle', 'leaderboard'];
    for (var i = 0; i < order.length; i++) {
      var unit = cfg[order[i]];
      if (live(unit) && unit.width <= Math.max(width, 320)) return unit;
    }
    return null;
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
    var unit = pick(placement, container.clientWidth || window.innerWidth);
    if (!unit) return;

    var label = document.createElement('p');
    label.className = 'ad-label';
    label.appendChild(document.createTextNode('Advertisement · '));
    var link = document.createElement('a');
    link.href = '/premium';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Remove ads with Premium';
    label.appendChild(link);

    var frame = document.createElement('iframe');
    frame.title = 'Advertisement';
    frame.width = unit.width;
    frame.height = unit.height;
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('sandbox', SANDBOX);
    frame.setAttribute('loading', 'lazy');
    frame.srcdoc = html(unit);

    container.appendChild(label);
    container.appendChild(frame);
    container.setAttribute('role', 'complementary');
    container.setAttribute('aria-label', 'Advertisement');
    container.classList.add('is-filled');
  }

  /*
   * Arm a slot. `ctx` is what the game knows and this file does not:
   * { premium: bool, decisions: number }. Calling it again on the same element
   * — which happens whenever the view holding it re-renders — does nothing, so
   * switching tabs and back does not reload (and so re-count) the ad.
   */
  function mount(container, placement, ctx) {
    if (!container || container.dataset.adArmed) return;
    if (!anyLive() || !ctx || ctx.premium || (ctx.decisions || 0) < AFTER) return;
    // Somebody who has asked their browser to save data has not asked for this.
    var conn = navigator.connection;
    if (conn && conn.saveData) return;
    if (typeof IntersectionObserver === 'undefined') return;

    container.dataset.adArmed = '1';
    var seen = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          seen.disconnect();
          draw(container, placement);
          return;
        }
      }
    }, { rootMargin: '400px 0px' });
    seen.observe(container);
  }

  return { mount: mount, enabled: anyLive };
})();
