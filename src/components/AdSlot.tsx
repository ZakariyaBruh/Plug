import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { useConsentAllowed } from '#/lib/consent-client'
import { ADS_ON, adCluster, type AdUnit } from '#/lib/site'

/*
 * A SMALL CLUSTER OF ADS, FROM THE FIRST VISIT, NEVER FOR A PREMIUM MEMBER.
 *
 * See ADS_ON in lib/site.ts for the decision, what stays out and the rules this
 * follows. In short it shows nothing at all until a unit is configured, nothing
 * to a Premium member, nothing where the visitor has to opt in first and has not
 * (lib/consent.ts), and nothing until it is nearly on screen — so a visitor who
 * never scrolls to it never loads it. It used to wait for a couple of finished
 * decisions and to step aside for Save-Data; the owner chose neither.
 *
 * `placement` is where it sits, and adCluster() decides which two or three
 * banners that means at this width:
 *   inline — in the middle of something: two.
 *   end    — after something has been read: three on a wide screen, two on a phone.
 * Units that are not configured are skipped; with none, nothing renders.
 *
 * SANDBOX. allow-scripts (the network's loader has to run) and
 * allow-popups / allow-popups-to-escape-sandbox (a real click still opens a
 * normal tab) and nothing else. No allow-same-origin: the ad gets an opaque
 * origin and cannot read this page's cookies, storage or DOM. No
 * allow-top-navigation: a script inside that tries to set window.top.location
 * is refused by the browser itself. srcdoc rather than writing into the
 * frame, because writing needs the same-origin access the sandbox removes.
 * Both were checked against a real browser when this was first written, and
 * ads.test (scripts/shell-test.mjs) fails if either flag ever appears here.
 */
export const AD_SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'

export function adHtml(unit: AdUnit): string {
  const options = JSON.stringify({ key: unit.key, format: 'iframe', height: unit.height, width: unit.width, params: {} })
  return (
    '<!doctype html><html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;overflow:hidden">' +
    `<script>atOptions=${options};</script>` +
    `<script src="${unit.src}"></script>` +
    '</body></html>'
  )
}

export function AdSlot({
  placement,
  premium = false,
  className,
}: {
  placement: 'inline' | 'end'
  /** From the viewer on the server; a Premium member sees none. */
  premium?: boolean
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const [units, setUnits] = useState<AdUnit[]>([])
  const allowed = useConsentAllowed()

  useEffect(() => {
    // Taken back (or never given): nothing stays on the page.
    if (!ADS_ON || premium || allowed !== true) { setUnits([]); return }
    const el = box.current
    if (!el) return
    const choose = () => setUnits(adCluster(placement, el.clientWidth))
    // Not until it is about to be seen. No observer (very old browsers) means
    // not at all, which is the safe way for that to fail.
    if (typeof IntersectionObserver === 'undefined') return
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          choose()
          seen.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    seen.observe(el)
    return () => seen.disconnect()
  }, [placement, premium, allowed])

  if (!ADS_ON || premium) return null

  return (
    <div
      ref={box}
      className={`ad-slot text-center ${className ?? ''}`}
      {...(units.length ? { role: 'complementary', 'aria-label': 'Advertisement' } : {})}
    >
      {units.length ? (
        <>
          {/* One label over the whole cluster: a label on each reads like the page is mostly ads. */}
          <p className="mb-2 text-xs text-[var(--text-dim)]">
            Advertisement ·{' '}
            <Link to="/premium" className="underline underline-offset-2 hover:text-[var(--amber)]">
              Remove ads with Premium
            </Link>
          </p>
          {/* Chosen 400px before it can be seen, so whatever it does to the page's height happens off-screen. */}
          <div className="flex flex-wrap items-start justify-center gap-4">
            {units.map((unit) => (
              <iframe
                key={unit.key}
                title="Advertisement"
                width={unit.width}
                height={unit.height}
                scrolling="no"
                sandbox={AD_SANDBOX}
                srcDoc={adHtml(unit)}
                loading="lazy"
                className="max-w-full border-0"
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
