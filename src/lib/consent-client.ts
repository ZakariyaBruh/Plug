import { useEffect, useState } from 'react'

/*
 * The browser half of the cookie choice, for the marketing pages. It is the same
 * choice as the app's (public/decide/js/consent.js): one key, one answer, asked
 * once for the whole site. See lib/consent.ts for who has to opt in and why ads
 * are never filed under "essential".
 */
export const CONSENT_KEY = 'm45-consent'
export const CONSENT_EVENT = 'm45:consent'

export type Stored = 'all' | 'essential' | null

export function storedConsent(): Stored {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    return v === 'all' || v === 'essential' ? v : null
  } catch {
    return null
  }
}

export function setConsent(value: 'all' | 'essential') {
  try {
    window.localStorage.setItem(CONSENT_KEY, value)
  } catch {
    /* the choice lasts until the page closes */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { allowed: value === 'all' } }))
}

export const OPEN_CONSENT_EVENT = 'm45:consent-open'
export const openConsent = () => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))

let region: Promise<boolean> | null = null
/** True when this visitor must opt in first. A failed or slow answer means yes. */
export function askFirstHere(): Promise<boolean> {
  if (!region) {
    region = new Promise<boolean>((resolve) => {
      const timer = window.setTimeout(() => resolve(true), 4000)
      fetch('/api/region', { cache: 'no-store' })
        .then((r) => r.json() as Promise<{ askFirst?: boolean }>)
        .then((j) => { window.clearTimeout(timer); resolve(!!j.askFirst) })
        .catch(() => { window.clearTimeout(timer); resolve(true) })
    })
  }
  return region
}

/** null while it is still being found out; then whether ads and analytics may run. */
export function useConsentAllowed(): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  useEffect(() => {
    let live = true
    const settle = async () => {
      const s = storedConsent()
      if (s) return live && setAllowed(s === 'all')
      const ask = await askFirstHere()
      if (live) setAllowed(!ask)
    }
    void settle()
    const onChange = () => void settle()
    window.addEventListener(CONSENT_EVENT, onChange)
    return () => { live = false; window.removeEventListener(CONSENT_EVENT, onChange) }
  }, [])
  return allowed
}
