import { useEffect, useState } from 'react'

import { ADSTERRA_ON, ADSTERRA_UNITS, type AdsterraUnit } from '#/lib/site'

/*
 * ONE AD UNIT, RENDERED INSIDE A SANDBOXED IFRAME WITH NO WAY BACK OUT.
 *
 * `sandbox` carries allow-scripts (the ad network's own loader needs to
 * run) and allow-popups / allow-popups-to-escape-sandbox (a real click
 * still has to be able to open a normal tab) — and deliberately nothing
 * else. No allow-same-origin: verified against a real sandboxed srcdoc
 * iframe that this gives the ad an opaque origin neither side can reach
 * into, so it cannot read this page's cookies or DOM. No allow-top-
 * navigation: verified the same way that a script inside tries and is
 * refused by the browser itself when it tries to set window.top.location
 * — a sandboxed frame without that flag cannot drag the whole tab
 * somewhere else, which is the one thing an ad-exchange creative doing
 * something hostile could otherwise do that nothing else here catches.
 *
 * srcdoc RATHER THAN contentDocument.write(): the two are not
 * interchangeable here. Writing into the iframe's document from this
 * page requires same-origin scripting access to it, which an iframe
 * sandboxed without allow-same-origin refuses outright (confirmed: it
 * throws). srcdoc hands the browser the HTML to load as a normal
 * navigation instead, so it never needs that access in the first place
 * — which is exactly why it is the one that can be isolated at all.
 */
function bannerHtml(key: string, width: number, height: number): string {
  const options = JSON.stringify({ key, format: 'iframe', height, width, params: {} })
  return (
    '<!doctype html><html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;overflow:hidden">' +
    `<script>atOptions=${options};</script>` +
    `<script src="https://bauval.org/22/${key}"></script>` +
    '</body></html>'
  )
}

function nativeHtml(src: string, containerId: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">' +
    `<div id="${containerId}"></div>` +
    `<script async data-cfasync="false" src="${src}"></script>` +
    '</body></html>'
  )
}

const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'

// Only for the native unit, which carries no width/height of its own. A
// real measurement is not available here on purpose: finding out how tall
// the ad actually rendered would mean reading into the iframe's document,
// which is exactly the access removing allow-same-origin was for. So this
// is a fixed guess rather than a fit — generous enough for the usual one-
// or two-item native card, clipped rather than left to push the rest of
// the page around if a given auction's creative runs long.
const NATIVE_HEIGHT = 300

/**
 * One Adsterra placement. Renders nothing server-side and nothing at all
 * once ADSTERRA_ON is false — see lib/site.ts for the one-switch coupling
 * this keeps in step with the privacy page.
 */
export function AdSlot({ unit, className }: { unit: AdsterraUnit; className?: string }) {
  const [mounted, setMounted] = useState(false)
  const spec = ADSTERRA_UNITS[unit]

  // Client-only: an iframe with no src rendered on the server would just
  // be dead markup, and the whole point is that nothing about this is in
  // the page's own HTML for a crawler or a reader's view-source to see
  // before it decides whether to trust the rest of the page.
  useEffect(() => setMounted(true), [])

  if (!ADSTERRA_ON || !mounted) return null

  const srcDoc = spec.kind === 'native' ? nativeHtml(spec.src, spec.containerId) : bannerHtml(spec.key, spec.width, spec.height)
  const width = spec.kind === 'banner' ? spec.width : undefined
  const height = spec.kind === 'banner' ? spec.height : NATIVE_HEIGHT

  return (
    <div className={`text-center ${className ?? ''}`}>
      <p className="mb-1 text-[11px] uppercase tracking-widest text-[var(--text-dim)]">Advertisement</p>
      <iframe
        title="Advertisement"
        srcDoc={srcDoc}
        sandbox={SANDBOX}
        scrolling="no"
        width={width}
        height={height}
        style={{ border: 0, display: 'inline-block', maxWidth: '100%', overflow: 'hidden' }}
      />
    </div>
  )
}
