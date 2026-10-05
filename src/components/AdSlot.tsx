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

const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'

/*
 * THE THREE SIZES SAFE TO SHOW TOGETHER, AND WHY ONLY THESE THREE.
 *
 * Of the five banner sizes handed over, "leaderboard" (728 wide) and
 * "skyscraper" (160x600) are left out of every cluster: a fixed-size
 * iframe does not reflow for a phone-width viewport, so 728 clips rather
 * than shrinks, and 600 tall reads as a wall of ad rather than "small and
 * unobtrusive" however wide it is. The three kept are each narrow enough
 * to never clip down to a phone's width and short enough that three of
 * them together still reads as a strip, not a takeover.
 */
export const AD_CLUSTER_DEFAULT: AdsterraUnit[] = ['mobileBanner', 'rectangle', 'skyscraperSmall']

function AdFrame({ unit }: { unit: AdsterraUnit }) {
  const spec = ADSTERRA_UNITS[unit]
  if (spec.kind !== 'banner') return null
  return (
    <iframe
      title="Advertisement"
      srcDoc={bannerHtml(spec.key, spec.width, spec.height)}
      sandbox={SANDBOX}
      scrolling="no"
      width={spec.width}
      height={spec.height}
      style={{ border: 0, display: 'inline-block', maxWidth: '100%', overflow: 'hidden' }}
    />
  )
}

/** True only once mounted client-side and only while ADSTERRA_ON. */
function useShowAds(): boolean {
  const [mounted, setMounted] = useState(false)
  // Client-only: an iframe with no src rendered on the server would just be
  // dead markup, and the whole point is that nothing about this is in the
  // page's own HTML for a crawler or a reader's view-source to see before
  // it decides whether to trust the rest of the page.
  useEffect(() => setMounted(true), [])
  return ADSTERRA_ON && mounted
}

/**
 * One Adsterra placement. Renders nothing server-side and nothing at all
 * once ADSTERRA_ON is false — see lib/site.ts for the one-switch coupling
 * this keeps in step with the privacy page.
 */
export function AdSlot({ unit, className }: { unit: AdsterraUnit; className?: string }) {
  const show = useShowAds()
  if (!show) return null
  return (
    <div className={`text-center ${className ?? ''}`}>
      <p className="mb-1 text-[11px] uppercase tracking-widest text-[var(--text-dim)]">Advertisement</p>
      <AdFrame unit={unit} />
    </div>
  )
}

/**
 * Several placements at once, under one "Advertisement" label rather than
 * one each — a row of ads with a label apiece reads like the page is
 * mostly ads; one label over a short strip of them reads like what it is,
 * a sponsored strip. Wraps under its own width rather than overflowing,
 * so three side by side on a wide screen become a short stack on a phone.
 */
export function AdCluster({ units = AD_CLUSTER_DEFAULT, className }: { units?: AdsterraUnit[]; className?: string }) {
  const show = useShowAds()
  if (!show) return null
  return (
    <div className={`text-center ${className ?? ''}`}>
      <p className="mb-2 text-[11px] uppercase tracking-widest text-[var(--text-dim)]">Advertisement</p>
      <div className="flex flex-wrap items-start justify-center gap-4">
        {units.map((unit) => (
          <AdFrame key={unit} unit={unit} />
        ))}
      </div>
    </div>
  )
}
