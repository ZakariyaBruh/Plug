import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { useConsentAllowed } from '#/lib/consent-client'
import { ADS_ON, AD_UNITS, adCluster, type AdSize, type AdUnit } from '#/lib/site'

/*
 * A SMALL CLUSTER OF ADS, FROM THE FIRST VISIT, NEVER FOR A PREMIUM MEMBER, AND NO
 * OTHER OFF SWITCH. Not Save-Data, not the cookie choice, not a setting. (The cookie
 * choice changes how an ad is loaded, not whether: see `restricted` below.)
 *
 * See ADS_ON in lib/site.ts for the decision, what stays out and the rules this
 * follows. In short it shows nothing at all until a unit is configured, nothing
 * to a Premium member, and nothing until it is nearly on screen — so a visitor who
 * never scrolls to it never loads it. It used to wait for a couple of finished
 * decisions, to step aside for Save-Data and to wait for the cookie choice; the
 * owner chose none of those. Where the visitor has to be asked first and has not
 * said yes (lib/consent.ts), the ad loads without cookies instead of not at all.
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
 * is refused by the browser itself. The frame is a real page on this site, /ad-frame, not
 * srcdoc: see src/routes/ad-frame.ts for why, and for how it says whether anything arrived.
 * Both were checked against a real browser when this was first written, and
 * ads.test (scripts/shell-test.mjs) fails if either flag ever appears here.
 */
export const AD_SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'

/** The name a unit goes by in /ad-frame?u=…, found from its key. */
const nameOf = (unit: AdUnit): AdSize => (Object.keys(AD_UNITS) as AdSize[]).find((n) => AD_UNITS[n].key === unit.key) as AdSize

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
  // Sizes whose frame said nothing arrived: the box shows the site's own card instead of an empty rectangle.
  const [empty, setEmpty] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data?.m45ad
      if (!d || typeof d.s !== 'string') return
      const frames = box.current?.querySelectorAll('iframe') ?? []
      // Empty puts the site's own card in the box; a late fill (a slow auction) takes it out again.
      for (const f of Array.from(frames)) if (f.contentWindow === e.source) setEmpty((m) => ({ ...m, [f.getAttribute('data-ad') ?? '']: d.s === 'empty' || d.s === 'error' }))
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
  }, [])

  useEffect(() => {
    // Waits only until it is known whether to ask first (one small request). The
    // answer changes HOW the ad loads, never WHETHER: see the note over `restricted`.
    if (!ADS_ON || premium || allowed === null) { setUnits([]); return }
    const el = box.current
    if (!el) return
    setUnits([])
    const choose = () => setUnits(adCluster(placement, el.clientWidth))
    // Not until it is about to be seen. No observer (very old browsers): at once.
    if (typeof IntersectionObserver === 'undefined') { choose(); return }
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
  // With consent, a normal frame. Without it, where we have to ask first and have not
  // been told yes, or where we cannot tell: the same ad in a frame that asks the browser
  // for no cookies and a throwaway storage partition. (It is still sent this site's address as its
  // referrer, and only that: a network cannot tell what site it is on without it, and answers with nothing.) `credentialless`
  // is honoured by Chromium browsers and ignored by the rest; the network still sees an
  // IP address and a browser either way, and the privacy page says so.
  const restricted = allowed !== true
  const extra = restricted ? ({ credentialless: '', 'data-mode': 'cookieless' } as Record<string, string>) : {}

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
            {units.map((unit) => {
              const name = nameOf(unit)
              // The frame stays mounted while the site's own card stands in for it, so a slow auction can still take the box back.
              return (
                <span key={unit.key + (restricted ? ':c' : '')} className="contents">
                  {empty[name] ? (
                    <Link to="/premium" target="_blank" className="grid max-w-full content-center gap-0.5 overflow-hidden rounded border border-[var(--line-2)] bg-[var(--wash)] px-3 text-left no-underline" style={{ width: unit.width, height: unit.height }}>
                      <b className="text-sm text-[var(--amber)]">{unit.height >= 90 ? 'morsels45 Premium' : 'Premium'}</b>
                      <span className="text-xs text-[var(--text-dim)]">{unit.height >= 90 ? 'No ads. A smarter assistant. See what Premium adds.' : 'No ads. See Premium'}</span>
                    </Link>
                  ) : null}
                  <iframe
                    {...extra}
                    data-ad={name}
                    title="Advertisement"
                    width={unit.width}
                    height={unit.height}
                    scrolling="no"
                    sandbox={AD_SANDBOX}
                    referrerPolicy="origin"
                    src={`/ad-frame?u=${name}`}
                    loading="lazy"
                    hidden={!!empty[name]}
                    className="max-w-full border-0"
                  />
                </span>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
