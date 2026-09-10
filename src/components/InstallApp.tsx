import { useEffect, useState } from 'react'

import { ANDROID_APK, ANDROID_SIZE, ANDROID_VERSION } from '#/lib/site'

/*
 * The install offer, shown only to the phone that can take it.
 *
 * Detected in the browser rather than from the request's User-Agent, because
 * this page is cached — by the host in front of it and by the service worker
 * behind it — and a cached page that decided who you were on the server is a
 * page that tells the next visitor they are on Android too.
 */
type Platform = 'android' | 'ios' | null

function detect(): { platform: Platform; safari: boolean } {
  if (typeof navigator === 'undefined') return { platform: null, safari: true }
  const ua = navigator.userAgent || ''

  // userAgentData first: it is the answer the browser means to give, and it
  // survives the user-agent string being frozen. The string is the fallback,
  // minus Chrome OS, which says "Android" in its user agent and cannot install
  // an APK.
  const hints = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData
  const android = hints && typeof hints.platform === 'string'
    ? hints.platform === 'Android'
    : /android/i.test(ua) && !/CrOS/.test(ua)
  if (android) return { platform: 'android', safari: true }

  // iPadOS 13 and later reports itself as a Mac. The touch points are what
  // give it away — no Mac has them.
  const ios = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!ios) return { platform: null, safari: true }

  // Add to Home Screen is in every iOS browser's share sheet now, so this is
  // no longer a gate — just worth a line, because Safari is where it behaves
  // most predictably.
  return { platform: 'ios', safari: !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) }
}

const CARD =
  'mx-auto mt-10 max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] p-5 text-left'
const BUTTON =
  'mt-4 inline-block rounded-full bg-[var(--amber)] px-6 py-3 font-semibold text-black hover:opacity-90'
const EYEBROW = 'text-sm font-semibold uppercase tracking-widest text-[var(--amber)]'
const NOTE = 'mt-3 text-xs text-[var(--text-dim)]'
const STEP =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--amber)] text-xs font-bold text-black'

// The iOS share icon, drawn inline so the instruction points at something
// somebody can actually match against their screen rather than a word.
function ShareGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block h-4 w-4 align-text-bottom text-[var(--amber)]"
      role="img"
      aria-label="Share"
    >
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

export function InstallApp() {
  // Starts null and stays null through the server render, so nothing about one
  // visitor's phone is ever baked into a page another visitor is served.
  const [{ platform, safari }, setState] = useState<{ platform: Platform; safari: boolean }>({
    platform: null,
    safari: true,
  })
  useEffect(() => setState(detect()), [])

  if (platform === 'android') {
    return (
      <div className={CARD}>
        <p className={EYEBROW}>You&rsquo;re on Android</p>
        <h2 className="mt-2 text-lg font-semibold">Install the app</h2>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          The whole thing as a real app on your phone, rather than a tab you have to find again.
        </p>
        {/* Naming the file matters: Android decides what to do with a download
            by what it is called, and an .apk it cannot name it cannot install. */}
        <a href={ANDROID_APK} className={BUTTON} download="morsels45.apk">
          Download for Android
        </a>
        <p className={NOTE}>
          Version {ANDROID_VERSION} · {ANDROID_SIZE} · Your phone will ask whether to allow
          installing from your browser. That prompt is Android doing its job, and you have to say
          yes once.
        </p>
      </div>
    )
  }

  if (platform === 'ios') {
    return (
      <div className={CARD}>
        <p className={EYEBROW}>You&rsquo;re on iPhone or iPad</p>
        <h2 className="mt-2 text-lg font-semibold">Put it on your Home Screen</h2>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          It becomes a real app: its own icon, opening full screen with no address bar. Three taps,
          nothing to download and nothing to approve.
        </p>
        <ol className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className={STEP}>1</span>
            <span>
              Tap the Share button <ShareGlyph /> at the bottom of the screen.
            </span>
          </li>
          <li className="flex gap-3">
            <span className={STEP}>2</span>
            <span>
              Scroll down the list and tap <b>Add to Home Screen</b>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className={STEP}>3</span>
            <span>
              Tap <b>Add</b>, top right. That&rsquo;s it — the icon is on your Home Screen.
            </span>
          </li>
        </ol>
        {!safari ? (
          <p className={NOTE}>
            That works here, and it is most reliable in <b>Safari</b> if anything looks different.
          </p>
        ) : null}
      </div>
    )
  }

  return null
}
