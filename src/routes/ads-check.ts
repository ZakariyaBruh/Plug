import { createFileRoute } from '@tanstack/react-router'

import { AD_UNITS, adLive } from '#/lib/site'

/*
 * /ads-check — WHY AN AD DOES NOT SHOW, TESTED ON THE DEVICE THAT IS NOT SHOWING IT.
 *
 * From the build server every unit's script comes back empty, from any key, so what the ad
 * network does for a real visitor cannot be settled from there. This page settles it on the
 * visitor's own phone or laptop, in about eight seconds.
 *
 * It runs two tests by itself, both safe (the ad is in a sandbox, as everywhere else):
 *   1. REACHABLE?  The network's script loaded as a bare script tag. An error means something
 *                  between the device and the network stops it: an ad or content blocker, a
 *                  private DNS, a VPN, a firewall.
 *   3. IN THE APP'S FRAME.  How the app and the site really show an ad: a page of this site in a
 *                  sandboxed iframe, and what came back.
 * and a third only when asked for, with a button and a warning, because it takes the sandbox off:
 *   2/4/5. WITHOUT THE SANDBOX.  The network's own snippet in an unsandboxed frame, and the same
 *                  frame page unsandboxed. If these fill and 3 does not, the sandbox is the cause.
 * Unsandboxed, whatever the network sends is allowed to do anything a page can, including
 * sending this tab somewhere else, which is why it is a button and not a default.
 *
 * Read together: 1 fails: blocked on the way. 1 passes and 3 is empty: the network is choosing to
 * show nothing (a new unit or site, this country, a VPN or data-centre address, no demand yet), or
 * the sandbox is, and the button tells those apart. Nothing here changes anything; it only looks.
 */
const UNIT = 'mobile'
const UNIT2 = 'rectangle'

const snippetDoc = (name: 'mobile' | 'rectangle') => {
  const u = AD_UNITS[name]
  const options = JSON.stringify({ key: u.key, format: 'iframe', height: u.height, width: u.width, params: {} })
  return `<!doctype html><body style="margin:0"><script>atOptions=${options};</script><script src="${u.src}"></script></body>`
}
const attr = (html: string) => html.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

export const adsCheckPage = (): string => {
  const u = AD_UNITS[UNIT], u2 = AD_UNITS[UNIT2]
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Ads check</title>
<style>
:root{color-scheme:dark}
body{margin:0;background:#131316;color:#f3efe8;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:20px 16px 60px;max-width:46rem;margin-inline:auto}
h1{font-size:1.5rem;margin:.2rem 0}h2{font-size:1rem;margin:1.6rem 0 .4rem;color:#e0a340}
p{margin:.3rem 0;color:#c8c3ba}.k{color:#9d988f;font-size:.85rem}
.box{border:1px solid #3d3d44;border-radius:12px;padding:12px 14px;background:#1e1e22;margin:.6rem 0}
.row{display:flex;gap:.6rem;align-items:flex-start;justify-content:space-between;border-top:1px solid #2c2c31;padding:.55rem 0}.row:first-child{border-top:0}
.row b{font-weight:600}.v{font-weight:700;text-align:right}.ok{color:#6fbf5e}.bad{color:#e4572e}.wait{color:#9d988f}
#verdict{border-color:#e0a340;font-size:1.05rem;color:#f3efe8}
.slot{min-height:24px;margin:.4rem 0;border:1px dashed #3d3d44;border-radius:8px;overflow:auto;padding:4px}
button{font:inherit;padding:.6rem 1.1rem;border-radius:999px;border:1px solid #e0a340;background:#e0a340;color:#17120a;font-weight:700}
button.quiet{background:transparent;color:#e0a340}
</style></head><body>
<h1>Ads check</h1>
<p>Takes about eight seconds. It looks, and changes nothing. Take a screenshot of the whole page and send it back.</p>
<div class="box" id="verdict">Running…</div>

<h2>The tests, on this device</h2>
<div class="box" id="results">
  <div class="row"><span><b>1. Reachable.</b><br><span class="k">The network's script, loaded on its own</span></span><span class="v wait" id="r1">…</span></div>
  <div class="row"><span><b>3. In the app's frame, sandboxed.</b><br><span class="k">How the app and the site really show it</span></span><span class="v wait" id="r3">…</span></div>
  <div class="row" id="x2"><span><b>2. The network's own snippet, no sandbox.</b><br><span class="k">Only after the button below</span></span><span class="v wait" id="r2">not run</span></div>
  <div class="row" id="x4"><span><b>4. The app's frame, no sandbox.</b><br><span class="k">Only after the button below</span></span><span class="v wait" id="r4">not run</span></div>
  <div class="row" id="x5"><span><b>5. A second size, no sandbox.</b><br><span class="k">${u2.width}x${u2.height}</span></span><span class="v wait" id="r5">not run</span></div>
</div>

<h2>Compare without the sandbox</h2>
<p class="k">Runs the network's own code with nothing holding it back, to see whether the sandbox is what stops it. Whatever the network sends is then allowed to do anything a page can, including sending this tab somewhere else. Only press it if the result above leaves the question open.</p>
<p style="margin-top:.6rem"><button class="quiet" id="cmp">Also test without the sandbox</button></p>

<h2>Find which sandbox setting the network needs</h2>
<p class="k">If the unsandboxed test draws an ad and the sandboxed one does not, this tries the app's frame under five different sandbox settings, to find the smallest change that makes it draw. Some of them let the frame reach this page, which is safe on this check page and would not be in the app. Press it only after the unsandboxed test has drawn something.</p>
<p style="margin-top:.6rem"><button class="quiet" id="var">Try the five settings</button></p>
<div class="box" id="varbox" hidden></div>

<h2>This device</h2>
<div class="box k" id="env"></div>

<h2>What was drawn</h2>
<p class="k">3: a frame of this site, sandboxed:</p>
<div class="slot"><iframe id="f3" title="Advertisement" width="${u.width}" height="${u.height}" scrolling="no" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerpolicy="origin" src="/ad-frame?u=${UNIT}"></iframe></div>
<div class="slot" id="cmpbox" hidden>
  <iframe id="f2" title="Advertisement" width="${u.width}" height="${u.height}" scrolling="no" srcdoc="${attr(snippetDoc(UNIT))}"></iframe>
  <iframe id="f5" title="Advertisement" width="${u2.width}" height="${u2.height}" scrolling="no" srcdoc="${attr(snippetDoc(UNIT2))}"></iframe>
</div>
<div class="slot" id="varslots" hidden></div>
<p style="margin-top:1.4rem"><button onclick="location.reload()">Run it again</button></p>

<script>
(function () {
  var res = { r1: null, r2: null, r3: null, r4: null, r5: null };
  var $ = function (id) { return document.getElementById(id); };
  var UA = navigator.userAgent;
  $('env').innerHTML = [
    'Address bar: ' + location.origin,
    'Browser: ' + UA,
    'Language: ' + navigator.language + ' · Online: ' + navigator.onLine + ' · Cookies on: ' + navigator.cookieEnabled,
    'Data saver: ' + String(navigator.connection && navigator.connection.saveData),
    'Time: ' + new Date().toString()
  ].map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');

  function show(id, ok, text) { var el = $(id); el.textContent = text; el.className = 'v ' + (ok ? 'ok' : ok === false ? 'bad' : 'wait'); res[id] = ok; }

  // 1. reachable: the script as a bare tag, onload (it came back, even if empty) or onerror (it did not)
  var t0 = Date.now(), s = document.createElement('script');
  s.src = ${JSON.stringify(u.src)} + '?c=' + t0;
  s.onload = function () { show('r1', true, 'Loads (' + (Date.now() - t0) + ' ms)'); };
  s.onerror = function () { show('r1', false, 'Blocked or unreachable'); };
  document.head.appendChild(s);

  // 3 and 4: the frames of this site report in by message
  var f3 = $('f3'), f4 = null;
  window.addEventListener('message', function (e) {
    var d = e.data && e.data.m45ad; if (!d) return;
    var id = e.source === f3.contentWindow ? 'r3' : f4 && e.source === f4.contentWindow ? 'r4' : null; if (!id) return;
    if (d.s === 'filled') show(id, true, 'Drew an ad');
    else if (d.s === 'empty') show(id, false, 'Nothing came back');
    else show(id, false, 'Script failed');
  });

  function verdict() {
    var v;
    var compared = res.r2 !== null || res.r4 !== null || res.r5 !== null;
    var plain = res.r2 || res.r4 || res.r5;
    if (res.r1 === false) v = 'The ad network is being stopped on the way to this device: its script cannot load. That is an ad or content blocker, a private-DNS or VPN filter, or a firewall, on this device or this network. Nothing in the app can fix that. Try with the blocker and the VPN off, or on mobile data.';
    else if (res.r3) v = 'Ads work on this device, in the app’s frame. If you see none in the app, reload it and wait a few seconds (the first one can take a moment), and tell me which screen.';
    else if (!compared) v = 'The network’s script loads, and in the app’s frame it answers with nothing. Either the network is choosing to show no ad to this device right now (a unit or site it only just approved can take a day or two to fill, there may be no advertiser for this country or device, or a VPN, private-relay or data-centre address is being turned away), or the frame’s sandbox is stopping it. The button above tells those apart.';
    else if (plain) v = 'The network shows an ad on this device when nothing holds it back, but not in the app’s sandboxed frame. So the sandbox is what is stopping it.';
    else v = 'Not even without the sandbox does the network draw anything on this device. So nothing in the app is the cause: the network is choosing to show no ad to this device right now (a unit or site it only just approved, no advertiser for this country or device at the moment, or a VPN, private-relay or data-centre address: turn them off and run this again). The Adsterra dashboard’s Statistics will show requests with no impressions.';
    $('verdict').textContent = v;
  }

  setTimeout(function () {
    if (res.r1 === null) show('r1', false, 'No answer in 8 s');
    if (res.r3 === null) show('r3', false, 'No report');
    verdict();
  }, 8000);

  // Which sandbox setting? The same frame page, five ways.
  var VARIANTS = [
    ['A. As the app has it', 'allow-scripts allow-popups allow-popups-to-escape-sandbox'],
    ['B. A + allow-same-origin', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin'],
    ['C. A + top navigation on a tap', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'],
    ['D. A + forms, dialogs, presentation', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation'],
    ['E. All of them together', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-top-navigation-by-user-activation allow-forms allow-modals allow-presentation']
  ];
  $('var').onclick = function () {
    $('var').disabled = true; $('var').textContent = 'Running…';
    var box = $('varbox'), slots = $('varslots'); box.hidden = false; slots.hidden = false; box.textContent = '';
    var frames = [];
    VARIANTS.forEach(function (v, i) {
      var row = document.createElement('div'); row.className = 'row';
      var label = document.createElement('span'); label.innerHTML = '<b></b><br><span class="k"></span>'; label.firstChild.textContent = v[0]; label.lastChild.textContent = v[1];
      var out = document.createElement('span'); out.className = 'v wait'; out.textContent = '…'; out.id = 'v' + i;
      row.appendChild(label); row.appendChild(out); box.appendChild(row);
      var f = document.createElement('iframe'); f.title = 'Advertisement'; f.width = ${u.width}; f.height = ${u.height}; f.setAttribute('scrolling', 'no'); f.setAttribute('sandbox', v[1]); f.setAttribute('referrerpolicy', 'origin'); f.src = '/ad-frame?u=${UNIT}&v=' + i;
      slots.appendChild(f); frames.push(f);
    });
    window.addEventListener('message', function (e) {
      var d = e.data && e.data.m45ad; if (!d) return;
      for (var i = 0; i < frames.length; i++) if (e.source === frames[i].contentWindow) { var o = $('v' + i); o.textContent = d.s === 'filled' ? 'Drew an ad' : d.s === 'empty' ? 'Nothing came back' : 'Script failed'; o.className = 'v ' + (d.s === 'filled' ? 'ok' : 'bad'); }
    });
    setTimeout(function () {
      var drew = VARIANTS.map(function (v, i) { return $('v' + i).textContent === 'Drew an ad'; });
      var msg;
      if (!drew.some(Boolean)) msg = 'None of the five drew an ad here. Run the unsandboxed test first: if that drew one, tell me, because then it is something else about the frame.';
      else if (drew[0]) msg = 'The app’s current settings (A) already draw here. Reload the app and look again.';
      else if (drew[2] && !drew[1]) msg = 'Allowing a top-level navigation on a tap (C) is what the network needs, and it does not need the frame to reach this page. That can be granted safely.';
      else if (drew[3] && !drew[1]) msg = 'Forms, dialogs or presentation (D) is what the network needs. That can be granted safely.';
      else if (drew[1]) msg = 'The network needs allow-same-origin (B): to read and write its own storage. In a frame of this same site that also lets it reach the whole app, which is not safe. The ad has to come from a different site than the app for that to be granted.';
      else msg = 'Only the settings together (E) draw. Tell me which rows drew.';
      var m = document.createElement('div'); m.className = 'row'; m.innerHTML = '<span><b>Reading</b></span>'; var t = document.createElement('span'); t.style.textAlign = 'left'; t.style.fontWeight = '600'; t.textContent = msg; m.appendChild(t); box.appendChild(m);
      $('var').textContent = 'Done';
    }, 8500);
  };

  $('cmp').onclick = function () {
    $('cmp').disabled = true; $('cmp').textContent = 'Running…';
    $('cmpbox').hidden = false;
    f4 = document.createElement('iframe'); f4.title = 'Advertisement'; f4.width = ${u.width}; f4.height = ${u.height}; f4.setAttribute('scrolling', 'no'); f4.setAttribute('referrerpolicy', 'origin'); f4.src = '/ad-frame?u=${UNIT}';
    $('cmpbox').appendChild(f4);
    $('verdict').textContent = 'Running the comparison…';
    setTimeout(function () {
      function count(frame) { try { var b = frame.contentDocument.body, n = 0, all = b.querySelectorAll('*'); for (var i = 0; i < all.length; i++) { var t = all[i].tagName; if (t !== 'SCRIPT' && t !== 'STYLE') n++; } return n; } catch (err) { return -1; } }
      var a = count($('f2')), b2 = count($('f5'));
      show('r2', a > 0, a > 0 ? 'Drew an ad' : a < 0 ? 'Could not look' : 'Nothing came back');
      show('r5', b2 > 0, b2 > 0 ? 'Drew an ad' : b2 < 0 ? 'Could not look' : 'Nothing came back');
      if (res.r4 === null) show('r4', false, 'No report');
      $('cmp').textContent = 'Done'; verdict();
    }, 8000);
  };
})();
</script>
</body></html>`
}

export const Route = createFileRoute('/ads-check')({
  server: {
    handlers: {
      GET: () => {
        if (!adLive(AD_UNITS[UNIT])) return new Response('not found', { status: 404 })
        return new Response(adsCheckPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
      },
    },
  },
})
