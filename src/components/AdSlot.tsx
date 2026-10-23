import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { useAdsInPage } from '#/lib/consent-client'
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

/*
 * THE NETWORK'S OWN SNIPPET, IN THE PAGE (see public/decide/js/ads.js, which does the same in the app). Where the
 * visitor has said yes to cookies the ad is a box of the unit's size with `atOptions = {...}` and then the
 * network's script inside it, as the network's snippet is meant to be used; framed and sandboxed it drew blank
 * white boxes on a real device. The script reads one global as it runs, so the boxes are asked one at a time.
 */
const queue: Array<{ box: HTMLElement; unit: AdUnit; after: (bad: boolean) => void }> = []
let running = false
function pump() {
  if (running) return
  const job = queue.shift()
  if (!job) return
  running = true
  let finished = false
  const done = (bad: boolean) => {
    if (finished) return
    finished = true
    clearTimeout(guard)
    running = false
    job.after(bad)
    pump()
  }
  const guard = setTimeout(() => done(false), 6000)
  if (!job.box.isConnected) return done(false)
  ;(window as unknown as { atOptions: unknown }).atOptions = { key: job.unit.key, format: 'iframe', height: job.unit.height, width: job.unit.width, params: {} }
  const sc = document.createElement('script')
  sc.async = true
  sc.onload = () => done(false)
  sc.onerror = () => done(true)
  sc.src = job.unit.src
  job.box.appendChild(sc)
}

function DirectAd({ unit, onEmpty, onFilled }: { unit: AdUnit; onEmpty: () => void; onFilled: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const drawn = () => !!el.querySelector(':not(script):not(style)')
    let gone = false
    let observer: MutationObserver | undefined
    try {
      observer = new MutationObserver(() => { if (drawn()) onFilled() })
      observer.observe(el, { childList: true, subtree: true })
    } catch { /* very old browser */ }
    const ask = (n: number) => {
      queue.push({
        box: el,
        unit,
        after: () => {
          // Nothing drawn: ask again twice, a few seconds apart, then the site's own card; a late ad takes the box back.
          setTimeout(() => {
            if (gone || drawn()) return
            if (n < 2) setTimeout(() => { if (gone || drawn()) return; el.textContent = ''; ask(n + 1) }, n === 0 ? 3500 : 8000)
            else onEmpty()
          }, 4000)
        },
      })
      pump()
    }
    ask(0)
    return () => { gone = true; observer?.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.key])
  return <div ref={box} className="ad-direct max-w-full overflow-hidden" style={{ width: unit.width, height: unit.height }} data-ad={nameOf(unit)} />
}

/* The frames made with the page have come back blank on a real device where the same frames made inside a tap drew ads (see public/decide/js/ads.js): the first tap asks them again, once. */
let tapped = false

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
  const allowed = useAdsInPage()
  const [again, setAgain] = useState(() => (tapped ? 1 : 0))
  useEffect(() => {
    if (tapped) return
    const ev = ['pointerup', 'keydown', 'touchend', 'click']
    const on = () => {
      tapped = true
      ev.forEach((t) => document.removeEventListener(t, on, true))
      setTimeout(() => setAgain(1), 300)
    }
    ev.forEach((t) => document.addEventListener(t, on, true))
    return () => ev.forEach((t) => document.removeEventListener(t, on, true))
  }, [])
  // Sizes whose frame said nothing arrived: the box shows the site's own card instead of an empty rectangle.
  const [empty, setEmpty] = useState<Record<string, boolean>>({})
  // How many times an empty frame has asked again, by size: the first ask of a visit is sometimes answered with nothing.
  const [tries, setTries] = useState<Record<string, number>>({})
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data?.m45ad
      if (!d || typeof d.s !== 'string') return
      const frames = box.current?.querySelectorAll('iframe') ?? []
      // Empty puts the site's own card in the box; a late fill (a slow auction) takes it out again.
      for (const f of Array.from(frames)) {
        if (f.contentWindow !== e.source) continue
        const name = f.getAttribute('data-ad') ?? ''
        if (d.s === 'filled') { setEmpty((m) => ({ ...m, [name]: false })); continue }
        if (d.s !== 'empty' && d.s !== 'error') continue
        const n = Number(f.getAttribute('data-try') ?? 0)
        // Ask again (twice, a few seconds apart) before the site's own card stands in.
        if (n < 2) setTimeout(() => setTries((t) => ({ ...t, [name]: Math.max(t[name] ?? 0, n + 1) })), n === 0 ? 3500 : 8000)
        else setEmpty((m) => ({ ...m, [name]: true }))
      }
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
  // The network cannot draw without its own cookies. Where we have to ask first and the answer is not yes it is not
  // asked at all, and the box says so (`?adsframe` on the address brings the old framed way back, for comparing).
  const restricted = allowed !== true
  const forceFrame = typeof window !== 'undefined' && /[?&]adsframe\b/.test(window.location.search)
  const cookieCard = restricted && !forceFrame
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
                  {cookieCard || empty[name] ? (
                    <Link to="/premium" target="_blank" className="grid max-w-full content-center gap-0.5 overflow-hidden rounded border border-[var(--line-2)] bg-[var(--wash)] px-3 text-left no-underline" style={{ width: unit.width, height: unit.height }}>
                      <b className="text-sm text-[var(--amber)]">{unit.height >= 90 ? 'morsels45 Premium' : 'Premium'}</b>
                      <span className="text-xs text-[var(--text-dim)]">
                        {cookieCard
                          ? unit.height >= 90 ? 'Ads need cookies and pay for this site. Accept them in Cookie settings, or go Premium for none.' : 'Ads need cookies. Or go Premium.'
                          : unit.height >= 90 ? 'No ads. A smarter assistant. See what Premium adds.' : 'No ads. See Premium'}
                      </span>
                    </Link>
                  ) : null}
                  {!restricted ? (
                    <span hidden={!!empty[name]} className="contents">
                      <DirectAd unit={unit} onEmpty={() => setEmpty((m) => ({ ...m, [name]: true }))} onFilled={() => setEmpty((m) => (m[name] ? { ...m, [name]: false } : m))} />
                    </span>
                  ) : forceFrame ? (
                  <iframe
                    {...extra}
                    data-ad={name}
                    title="Advertisement"
                    width={unit.width}
                    height={unit.height}
                    scrolling="no"
                    sandbox={AD_SANDBOX}
                    referrerPolicy="origin"
                    data-try={tries[name] ?? 0}
                    src={`/ad-frame?u=${name}&r=${tries[name] ?? 0}&g=${again}`}
                    loading="lazy"
                    hidden={!!empty[name]}
                    className="max-w-full border-0"
                  />
                  ) : null}
                </span>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
