import { createFileRoute } from '@tanstack/react-router'

import { currentUser } from '#/lib/session'
import { whopUserId } from '#/lib/whop-token'
import {
  HOUSEHOLD_SEATS,
  SEATS_TO_GIVE,
  householdOf,
  revokeSeat,
  seatLink,
  seatView,
  seatsOf,
  sweepSeats,
} from '#/lib/household'

/*
 * The seats on a Household subscription: who has one, giving one, taking it
 * back.
 *
 * WHO IS ASKING is established here and nowhere else, the same two ways the
 * rest of the app establishes it (see api/premium-status): the OAuth cookie
 * first, and Whop's signed header as the fallback for the iframe, where a
 * third-party cookie may never arrive. Nothing in the body is allowed to say
 * who the caller is — this endpoint hands out free Premium, so the one thing
 * it must never do is take the client's word for whose subscription it is
 * spending.
 *
 * Everything past identity is decided in lib/household.ts, against Whop,
 * live: whether this person is actually paying for a Household plan right
 * now, and whether they have a seat left. There is no cached answer to either
 * question and no flag anywhere that could be stale or forged.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

/** The signed-in caller's user id, or null. Cookie first, signed header after. */
async function caller(request: Request): Promise<string | null> {
  const user = await currentUser()
  if (user?.sub) return user.sub
  return await whopUserId(request)
}

export const Route = createFileRoute('/api/household')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const me = await caller(request)
        if (!me) return json({ signedIn: false, owner: false, seats: [], left: 0 })

        const household = await householdOf(me)
        if (!household) return json({ signedIn: true, owner: false, seats: [], left: 0 })

        // Renews the seats that should live and cancels the ones that should
        // not. This is the owner looking at their own account, which is the
        // cheapest moment in the app to do it and the one where the answer is
        // about to be shown to them anyway.
        await sweepSeats(me).catch(() => {})

        const seats = await seatsOf(me)
        return json({
          signedIn: true,
          owner: true,
          covers: HOUSEHOLD_SEATS,
          seats: seats.map(seatView),
          left: Math.max(0, SEATS_TO_GIVE - seats.length),
        })
      },

      /*
       * Make an invitation. The answer is a link the owner sends to whoever
       * they eat with; see seatLink() for why it is a link and not an email.
       */
      POST: async ({ request }) => {
        const me = await caller(request)
        if (!me) return json({ ok: false, why: 'Sign in first.' }, 401)

        try {
          const result = await seatLink(me)
          return json(result, result.ok ? 200 : 403)
        } catch {
          // The real error carries plan ids and API paths. What comes back
          // here is what a person can act on.
          return json({ ok: false, why: 'Whop would not make the link. Try again in a minute.' }, 502)
        }
      },

      DELETE: async ({ request }) => {
        const me = await caller(request)
        if (!me) return json({ ok: false, why: 'Sign in first.' }, 401)

        const body = (await request.json().catch(() => null)) as { seat?: unknown } | null
        const seat = typeof body?.seat === 'string' ? body.seat : ''
        if (!seat.startsWith('mem_')) return json({ ok: false, why: 'No seat named.' }, 400)

        try {
          const result = await revokeSeat(me, seat)
          return json(result, result.ok ? 200 : 403)
        } catch {
          return json({ ok: false, why: 'Whop would not take the seat back. Try again in a minute.' }, 502)
        }
      },
    },
  },
})
