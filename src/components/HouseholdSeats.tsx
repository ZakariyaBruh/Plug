import { useCallback, useEffect, useState } from 'react'

/*
 * THE SECOND SEAT, on the page where somebody manages what they pay for.
 *
 * Only shown to a Household subscriber: /api/household answers `owner: false`
 * for everybody else and this renders nothing at all. That is deliberate —
 * this is an account page, not a shop, and an empty "seats" panel with an
 * upsell in it is an advert dressed as a setting.
 *
 * Every decision behind this is the server's. The button asks for an
 * invitation; what comes back is either a link or a sentence saying why not.
 * Nothing here knows or decides whether the caller is entitled to a seat,
 * because a seat is free Premium and a client is the wrong place to decide
 * who gets one.
 */

type Seat = { id: string; who: string; endsAt: string | null }
type State = { owner: boolean; covers?: number; seats: Seat[]; left: number }

export function HouseholdSeats() {
  const [state, setState] = useState<State | null>(null)
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [says, setSays] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/household', { headers: { Accept: 'application/json' } })
      if (!response.ok) return setState(null)
      setState((await response.json()) as State)
    } catch {
      setState(null)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const invite = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setSays(null)
    setCopied(false)
    try {
      const response = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = (await response.json()) as { ok: boolean; url?: string; why?: string }
      if (result.ok && result.url) setLink(result.url)
      else setSays(result.why ?? 'That did not work.')
    } catch {
      setSays('Could not reach the server. Try again in a minute.')
    } finally {
      setBusy(false)
    }
  }, [busy])

  /*
   * Copying can fail — no clipboard permission, an insecure origin, a browser
   * that has never had one. The link is on screen and selectable either way,
   * so a failed copy loses the convenience and never the invitation.
   */
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setSays('Could not reach the clipboard — copy the link above by hand.')
    }
  }, [link])

  const takeBack = useCallback(
    async (seat: string) => {
      if (busy) return
      setBusy(true)
      setSays(null)
      try {
        const response = await fetch('/api/household', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seat }),
        })
        const result = (await response.json()) as { ok: boolean; why?: string }
        setSays(result.ok ? 'Taken back. Their Premium is off.' : (result.why ?? 'That did not work.'))
        setLink('')
        await load()
      } catch {
        setSays('Could not reach the server. Try again in a minute.')
      } finally {
        setBusy(false)
      }
    },
    [busy, load],
  )

  if (!state?.owner) return null

  return (
    <div className="rounded-2xl border border-[var(--border)] p-6">
      <p className="text-sm text-[var(--text-dim)]">Household</p>
      <p className="mt-1 text-lg font-semibold">
        {state.covers ?? 2} people, one subscription
      </p>
      <p className="mt-2 text-sm text-[var(--text-dim)]">
        Give the other seat to whoever you actually eat with. They get their own tastes, their
        own rules and their own saved dishes — it is a second Premium account, not a shared
        login. It ends when your subscription does.
      </p>

      {state.seats.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {state.seats.map((seat) => (
            <li
              key={seat.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3"
            >
              <span className="text-sm font-semibold">{seat.who}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void takeBack(seat.id)}
                className="text-sm text-[var(--text-dim)] underline underline-offset-4 hover:text-[var(--text)] disabled:opacity-50"
              >
                Take the seat back
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {state.left > 0 ? (
        <div className="mt-4">
          {link ? (
            <>
              <p className="text-sm text-[var(--text-dim)]">
                Send them this. It works once, and only until the seat is taken.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="The invitation link"
                  className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void copy()}
                  className="rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-black hover:opacity-90"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void invite()}
              className="rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Making a link…' : 'Make an invitation'}
            </button>
          )}
        </div>
      ) : null}

      {says ? (
        <p aria-live="polite" className="mt-3 text-sm text-[var(--text-dim)]">
          {says}
        </p>
      ) : null}
    </div>
  )
}
