import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { ADS_AFTER_DECISIONS, ADS_ON, AD_UNITS, adLive, type AdSize, type AdUnit } from '#/lib/site'

/*
 * ONE AD, WHERE IT CANNOT HURT ANYTHING, AND ONLY WHEN IT CAN BE EARNED.
 *
 * See ADS_ON in lib/site.ts for the decision, the three sizes, what stays out
 * and the rules this follows. In short it shows nothing at all until a unit
 * is configured, nothing to a Premium member, nothing to somebody who has not
 * yet finished a couple of decisions, and nothing until it is nearly on
 * screen — so a visitor who never scrolls to it never loads it.
 *
 * `placement` is where it sits, not which size it is:
 *   inline — in the middle of something. A 728x90 where there is width for it,
 *            a 320x50 where there is not.
 *   end    — after something has been read. A 300x250.
 * If the unit a placement prefers is not configured it uses the other one
 * that fits rather than showing nothing; if none is, nothing renders.
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

/** Choose the unit for a placement, given how wide the slot is. */
export function pickUnit(placement: 'inline' | 'end', width: number): AdUnit | null {
  const order: AdSize[] =
    placement === 'end' ? ['rectangle', 'banner', 'leaderboard'] : width >= 760 ? ['leaderboard', 'banner', 'rectangle'] : ['banner', 'rectangle', 'leaderboard']
  for (const size of order) {
    const unit = AD_UNITS[size]
    if (adLive(unit) && unit.width <= Math.max(width, 320)) return unit
  }
  return null
}

// The game and this site share an origin, so its own counter says how many
// decisions this browser has finished.
function decisionsDone(): number {
  try {
    const raw = window.localStorage.getItem('whatShouldIEat.v1')
    const n = raw ? Number((JSON.parse(raw) as { decisions?: number }).decisions) : 0
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
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
  const [unit, setUnit] = useState<AdUnit | null>(null)

  useEffect(() => {
    if (!ADS_ON || premium || decisionsDone() < ADS_AFTER_DECISIONS) return
    const el = box.current
    if (!el) return
    const choose = () => setUnit(pickUnit(placement, el.clientWidth))
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
  }, [placement, premium])

  if (!ADS_ON || premium) return null

  return (
    <div
      ref={box}
      className={`ad-slot text-center ${className ?? ''}`}
      {...(unit ? { role: 'complementary', 'aria-label': 'Advertisement' } : {})}
    >
      {unit ? (
        <>
          <p className="mb-1 text-xs text-[var(--text-dim)]">
            Advertisement ·{' '}
            <Link to="/premium" className="underline underline-offset-2 hover:text-[var(--amber)]">
              Remove ads with Premium
            </Link>
          </p>
          {/* It is chosen 400px before it can be seen, so whatever it does to the page's height happens off-screen. */}
          <iframe
            title="Advertisement"
            width={unit.width}
            height={unit.height}
            scrolling="no"
            sandbox={AD_SANDBOX}
            srcDoc={adHtml(unit)}
            loading="lazy"
            className="mx-auto max-w-full border-0"
          />
        </>
      ) : null}
    </div>
  )
}
