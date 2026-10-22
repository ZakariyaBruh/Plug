import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { OPEN_CONSENT_EVENT, setConsent, storedConsent } from '#/lib/consent-client'

/*
 * The cookie notice for the marketing pages; the app has its own copy of the same
 * words in public/decide/js/consent.js and the two share one answer. Two buttons
 * of equal weight: refusing is as easy as accepting. Essential cookies are the
 * ones the site needs to remember your settings and progress. The advertising
 * network and the analytics tags are the choice, and they are never described as
 * essential (scripts/shell-test.mjs checks the wording in both places).
 */
export function ConsentBar() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!storedConsent()) setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_CONSENT_EVENT, reopen)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen)
  }, [])
  if (!open) return null
  const pick = (v: 'all' | 'essential') => {
    setConsent(v)
    setOpen(false)
  }
  return (
    <div
      role="region"
      aria-label="Cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto grid max-w-3xl gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card,#1b1b1d)] p-4 text-sm leading-relaxed text-[var(--text-dim)] shadow-2xl"
    >
      <p>
        <b className="text-[var(--text)]">Cookies.</b> Essential ones remember your settings and progress in this browser;
        the site needs them. Advertising (Adsterra) and analytics (Google Analytics, Microsoft Clarity) set their own cookies
        too, and that part is your choice. Ads pay for the free app, and Premium has none.{' '}
        <Link to="/privacy" className="text-[var(--amber)] underline underline-offset-2">
          Details
        </Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => pick('all')}
          className="min-h-11 flex-1 rounded-full bg-[var(--text)] px-4 font-semibold text-black hover:opacity-90"
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={() => pick('essential')}
          className="min-h-11 flex-1 rounded-full border border-[var(--border)] px-4 font-semibold text-[var(--text)] hover:border-[var(--amber)]"
        >
          Essential only
        </button>
      </div>
    </div>
  )
}
