/*
 * ADSTERRA — ONE BANNER, INSIDE THE GAME, SANDBOXED THE SAME WAY AS THE
 * MAIN SITE'S.
 *
 * See src/lib/site.ts's ADSTERRA_ON for the full story of why this exists
 * at all and src/components/AdSlot.tsx for the identical, empirically
 * verified sandboxing this copies. This file carries its own ON switch
 * rather than importing the site's, because the game is a separate,
 * unbundled app with nothing to import from the TanStack site's build —
 * flipping one off without the other is exactly the kind of drift the
 * privacy page's ADSTERRA_ON coupling exists to prevent, so if this ever
 * stops matching that constant, fix it here first.
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

  function bannerHtml(key, width, height) {
    var options = JSON.stringify({ key: key, format: 'iframe', height: height, width: width, params: {} });
    return '<!doctype html><html><head><meta charset="utf-8"></head>' +
      '<body style="margin:0;padding:0;overflow:hidden">' +
      '<script>atOptions=' + options + ';</script>' +
      '<script src="https://bauval.org/22/' + key + '"></script>' +
      '</body></html>';
  }

  /*
   * Mounts one banner into `container`, once. A second call on the same
   * element — which happens every time the view holding it re-renders —
   * is a no-op, so switching tabs and back does not reload the ad.
   */
  function mount(container, key, width, height) {
    if (!ON || !container || container.dataset.adMounted) return;
    container.dataset.adMounted = '1';

    var label = document.createElement('p');
    label.className = 'ad-label';
    label.textContent = 'Advertisement';

    var iframe = document.createElement('iframe');
    iframe.title = 'Advertisement';
    iframe.width = width;
    iframe.height = height;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('sandbox', SANDBOX);
    iframe.style.border = '0';
    iframe.style.maxWidth = '100%';
    iframe.srcdoc = bannerHtml(key, width, height);

    container.appendChild(label);
    container.appendChild(iframe);
  }

  return { mount: mount };
})();
