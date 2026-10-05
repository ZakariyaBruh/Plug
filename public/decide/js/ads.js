/*
 * ADSTERRA — A SMALL CLUSTER OF BANNERS, INSIDE THE GAME, SANDBOXED THE
 * SAME WAY AS THE MAIN SITE'S.
 *
 * See src/lib/site.ts's ADSTERRA_ON for the full story of why this exists
 * at all and src/components/AdSlot.tsx for the identical, empirically
 * verified sandboxing this copies, and for why only these three sizes
 * (mobileBanner, rectangle, skyscraperSmall) are ever used together: the
 * other two in the kit either clip on a phone-width viewport (leaderboard,
 * 728 wide) or read as a wall of ad rather than "small and unobtrusive"
 * (skyscraper, 600 tall). This file carries its own copy of both the ON
 * switch and the unit table rather than importing the site's, because the
 * game is a separate, unbundled app with nothing to import from the
 * TanStack site's build — flipping one off without the other, or listing
 * the units differently, is exactly the kind of drift the privacy page's
 * ADSTERRA_ON coupling exists to prevent, so if this ever stops matching
 * that constant or that list, fix it here first.
 *
 * SANDBOXING, the short version: allow-scripts (the ad network's loader
 * has to run) and allow-popups / allow-popups-to-escape-sandbox (a real
 * click still opens a normal tab) — and nothing else. No allow-same-
 * origin, so the ad gets an opaque origin neither this page nor the ad
 * can reach across; no allow-top-navigation, so nothing inside it can
 * redirect this tab. Both verified against a real sandboxed iframe before
 * this was written, not assumed from the spec.
 */
var Adsterra = (function () {
  var ON = true;
  var SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';

  var UNITS = {
    mobileBanner: { key: '5854b8b6f2fdd21988e40b9eb9be56c6', width: 320, height: 50 },
    rectangle: { key: 'df667c7b76c1f15de99aa40aed5384d6', width: 300, height: 250 },
    skyscraperSmall: { key: '31d2d6666f860531539ff1e9d29c51f6', width: 160, height: 300 },
  };

  function bannerHtml(key, width, height) {
    var options = JSON.stringify({ key: key, format: 'iframe', height: height, width: width, params: {} });
    return '<!doctype html><html><head><meta charset="utf-8"></head>' +
      '<body style="margin:0;padding:0;overflow:hidden">' +
      '<script>atOptions=' + options + ';</script>' +
      '<script src="https://bauval.org/22/' + key + '"></script>' +
      '</body></html>';
  }

  function frame(unit) {
    var spec = UNITS[unit];
    var iframe = document.createElement('iframe');
    iframe.title = 'Advertisement';
    iframe.width = spec.width;
    iframe.height = spec.height;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('sandbox', SANDBOX);
    iframe.style.border = '0';
    iframe.style.maxWidth = '100%';
    iframe.srcdoc = bannerHtml(spec.key, spec.width, spec.height);
    return iframe;
  }

  /*
   * Mounts a small cluster into `container`, once. A second call on the
   * same element — which happens every time the view holding it
   * re-renders — is a no-op, so switching tabs and back does not reload
   * the ads. One "Advertisement" label over the whole row rather than one
   * each: a label per unit reads like the screen is mostly ads, one label
   * over a short strip of them reads like what it is.
   */
  function mount(container, units) {
    if (!ON || !container || container.dataset.adMounted) return;
    container.dataset.adMounted = '1';

    var label = document.createElement('p');
    label.className = 'ad-label';
    label.textContent = 'Advertisement';
    container.appendChild(label);

    var row = document.createElement('div');
    row.className = 'ad-row';
    (units || ['mobileBanner', 'rectangle', 'skyscraperSmall']).forEach(function (unit) {
      row.appendChild(frame(unit));
    });
    container.appendChild(row);
  }

  return { mount: mount };
})();
