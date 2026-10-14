import { useEffect, useState } from 'react'

/*
 * THE PRICE, CONVERTED, FOR WHOEVER IS NOT PAYING IN DOLLARS.
 *
 * Every price in this app is quoted in USD, because that is the currency the
 * Whop plan is actually priced in. Most of the people reading it are not
 * billed in dollars, and "$4.99" means nothing in your head until you have
 * done the conversion yourself. This does it for you.
 *
 * TWO PUBLIC, KEYLESS SERVICES, BY IP — the same arrangement Nearby uses for
 * location, written down the same way on /privacy. freeipapi.com answers
 * which currencies your country uses; open.er-api.com answers today's rate
 * for one of them against the dollar. Neither is asked for anything but that,
 * neither sees who you are beyond the request itself, and nothing here is
 * sent to this app's own server.
 *
 * WHAT THIS IS NOT: the number Whop will actually charge. Whop's checkout is
 * tax-inclusive with its own adaptive pricing, which is a different, correct
 * conversion done at the moment of payment — see TAX_NOTE. This is an
 * estimate, said as one, so a reader has a sense of the number before
 * checkout rather than meeting it there for the first time. If either
 * service cannot answer, or answers with a currency this browser cannot
 * format, nothing is shown — a guess that might be wrong is worse than no
 * guess at all.
 */

const CACHE_KEY = 'morsels45.fxRate.v1'
const CACHE_TTL_MS = 60 * 60 * 1000 // rates do not move fast enough to ask more than once an hour

type Rate = { currency: string; perUsd: number; at: number }

function cached(): Rate | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const rate = JSON.parse(raw) as Rate
    return Date.now() - rate.at < CACHE_TTL_MS ? rate : null
  } catch {
    return null // a storage that cannot be read is a storage that is skipped, not an error
  }
}

async function detectRate(): Promise<Rate | null> {
  const hit = cached()
  if (hit) return hit

  const geo = await fetch('https://free.freeipapi.com/api/v1/json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
  const currencies: string[] = Array.isArray(geo?.currencies) ? geo.currencies : []
  if (currencies.every((c) => c === 'USD')) return null // already in dollars, nothing to convert

  const fx = await fetch('https://open.er-api.com/v6/latest/USD')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
  const rates = fx?.rates as Record<string, number> | undefined
  if (!rates) return null

  // A country can list more than one official currency (Panama: PAB and USD;
  // Cuba: CUP and CUC). Taken in the order the lookup gave them, stopping at
  // the first one the rate service actually knows.
  const currency = currencies.find((c) => c !== 'USD' && typeof rates[c] === 'number')
  if (!currency) return null

  const rate: Rate = { currency, perUsd: rates[currency], at: Date.now() }
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(rate))
  } catch {
    /* fine without the cache — it only saves a repeat request this session */
  }
  return rate
}

/** `usd` is the exact figure already on screen — the plan's own price, not a rounded one. */
export function LocalPrice({ usd }: { usd: number }) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    setText(null)
    detectRate().then((rate) => {
      if (!live || !rate) return
      try {
        const formatted = new Intl.NumberFormat(navigator.language, {
          style: 'currency',
          currency: rate.currency,
        }).format(usd * rate.perUsd)
        setText(formatted)
      } catch {
        /* a currency code this browser cannot format is one it says nothing about */
      }
    })
    return () => {
      live = false
    }
  }, [usd])

  if (!text) return null
  return (
    <span className="block text-xs text-[var(--text-dim)]">
      ≈ {text} where you are, by today’s exchange rate — before tax, which checkout adds and shows exactly.
    </span>
  )
}
