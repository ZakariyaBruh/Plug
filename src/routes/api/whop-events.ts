import { createFileRoute } from '@tanstack/react-router'
import { unwrapWebhook } from '@whop/sdk/helpers'

import { dropConfigs, revokeAllSeats } from '#/lib/household'
import { HOUSEHOLD_PLAN_IDS, SEAT_PLAN_ID } from '#/lib/products'

/*
 * WHAT WHOP TELLS US, AND THE ONE THING WE DO ABOUT IT.
 *
 * A Household subscription carries a second seat, and that seat is a real
 * membership on a free plan (see lib/household.ts). Whop does not cascade:
 * when the person paying stops paying, their membership goes invalid and the
 * free one they handed to somebody else carries on working. This is what
 * closes it.
 *
 * The seat plan also expires 35 days after it is granted, and the owner's own
 * account page renews it only while they are still paying — so a seat dies by
 * itself even if this endpoint is never called. That is the backstop. This is
 * the part that makes it seconds rather than weeks.
 *
 * NOTHING HERE TRUSTS THE REQUEST. The body is verified against Whop's
 * Standard Webhooks signature before it is read at all, using the raw bytes:
 * a re-serialized body does not verify, which is why this reads text() and
 * never json(). An unsigned or badly signed request is a stranger asking us
 * to cancel somebody's membership, and it gets a 401 without being parsed.
 */

type Event = {
  /*
   * Whop names the event in `type`. `action` is accepted alongside it
   * because older payloads used that, and an endpoint that silently stopped
   * matching after a rename would take weeks to notice — which, for the
   * thing that takes a free Premium seat away when somebody stops paying, is
   * weeks of giving it away.
   */
  type?: string
  action?: string
  data?: {
    id?: string
    status?: string
    plan?: { id?: string } | string | null
    plan_id?: string
    user?: { id?: string } | string | null
    user_id?: string
    metadata?: Record<string, unknown> | null
  }
}

/** Whop has written ids both nested and flat over the life of this API. */
function idOf(value: { id?: string } | string | null | undefined, flat?: string) {
  if (typeof value === 'string') return value
  return value?.id ?? flat ?? ''
}

export const Route = createFileRoute('/api/whop-events')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.WHOP_WEBHOOK_SECRET
        if (!secret) return new Response('not configured', { status: 503 })

        const raw = await request.text()
        const headers: Record<string, string> = {}
        request.headers.forEach((value, name) => {
          headers[name] = value
        })

        let event: Event
        try {
          event = unwrapWebhook<Event>(raw, { headers, key: secret })
        } catch {
          return new Response('bad signature', { status: 401 })
        }

        /*
         * `membership.deactivated` and `membership.activated` are what an
         * account-scoped webhook is actually allowed to subscribe to — the
         * API refuses `membership.went_invalid` outright, though both
         * spellings are in the enum the CLI prints. The older names are
         * accepted here anyway, because they are the same events and an
         * endpoint that silently ignored a rename would take weeks to notice.
         */
        const action = event.type ?? event.action ?? ''
        const ENDED = ['membership.deactivated', 'membership.went_invalid', 'membership_went_invalid']
        const BEGAN = ['membership.activated', 'membership.went_valid', 'membership_went_valid']

        const planId = idOf(event.data?.plan, event.data?.plan_id)
        const whose = idOf(event.data?.user, event.data?.user_id)

        /*
         * A SEAT WAS JUST CLAIMED, so the invitation that produced it is
         * spent. Deleting it here is what closes the window in which a
         * forwarded link could be claimed twice — the capacity check in
         * routes/seat.$id.tsx would refuse the second one anyway, but only
         * once the first has finished, and this makes that window seconds
         * rather than minutes.
         *
         * The owner is read off the seat's own metadata, which Whop copied
         * from the checkout configuration. It is the only thing tying the two
         * together.
         */
        if (BEGAN.includes(action) && planId === SEAT_PLAN_ID) {
          const owner = String(event.data?.metadata?.household_owner ?? '')
          if (!owner) return new Response('seat with no owner', { status: 200 })
          try {
            await dropConfigs(owner)
            return new Response('invitation spent', { status: 200 })
          } catch {
            return new Response('could not clear the invitation', { status: 500 })
          }
        }

        /*
         * The body names what it ignored. Only Whop ever reads it — nothing
         * reaches here without a valid signature — and it is what
         * `whop webhooks test` prints, which is the only way to check this
         * endpoint against an event the account has never actually had.
         */
        if (!ENDED.includes(action)) {
          return new Response(`ignored ${action || 'unnamed'} on ${planId || 'no plan'}`, { status: 200 })
        }
        if (!HOUSEHOLD_PLAN_IDS.includes(planId)) {
          return new Response(`not a household plan=${planId || 'none'}`, { status: 200 })
        }
        if (!whose) return new Response('no owner', { status: 200 })

        /*
         * A failure here must not be reported as success: Whop retries a
         * delivery that did not succeed, and a retry is exactly what should
         * happen if a seat is still standing. The expiry catches whatever
         * survives even that.
         */
        try {
          const gone = await revokeAllSeats(whose)
          await dropConfigs(whose).catch(() => {})
          return new Response(`revoked ${gone}`, { status: 200 })
        } catch {
          return new Response('could not revoke', { status: 500 })
        }
      },
    },
  },
})
