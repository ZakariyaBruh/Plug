import { createFileRoute } from '@tanstack/react-router'

import { type PromoState, scheduled } from '#/lib/promos'

/*
 * /api/promo — is there an offer on, and how much of it is left.
 *
 * The count is read from the Whop promo code every time, because that is the
 * same number Whop enforces at checkout. It cannot be ahead of reality and it
 * cannot be faked from this end; the worst it can be is thirty seconds behind,
 * which is what the cache below allows and is the right trade for not asking
 * Whop once per page view.
 *
 * WHAT A THIRTY-SECOND CACHE CAN AND CANNOT DO. It can show "17 of 20 taken"
 * for half a minute after the eighteenth. It cannot let a twenty-first person
 * get the discount, because the stock is enforced where the money moves, not
 * here. Over-advertising by a few seconds is recoverable; a banner that keeps
 * promising a code Whop has stopped honouring is not, which is why `live`
 * goes false the moment uses reach stock rather than at some margin before it.
 *
 * NOTHING IS SENT TO ANYBODY. No request body, no id, no cookie read: this
 * endpoint is the same answer for every person who asks it, which is why it
 * can be cached at the edge at all.
 */
const DEAD: PromoState = { live: false }

function json(body: PromoState, seconds: number) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': seconds
        ? `public, max-age=${seconds}, s-maxage=${seconds}`
        : 'no-store',
    },
  })
}

export const Route = createFileRoute('/api/promo')({
  server: {
    handlers: {
      GET: async () => {
        const promo = scheduled()
        if (!promo) return json(DEAD, 300)

        const key = process.env.WHOP_API_KEY
        // No key, no claim. A banner that says "20 slots" without being able
        // to count them is the fake scarcity this is built to avoid, so the
        // honest failure is silence.
        if (!key) return json(DEAD, 60)

        try {
          const origin = process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'
          const response = await fetch(`${origin}/api/v1/promo_codes/${promo.promoId}`, {
            headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
          })
          if (!response.ok) return json(DEAD, 30)

          const record = (await response.json()) as {
            status?: string
            uses?: number
            stock?: number
            unlimited_stock?: boolean
          }

          const total = Number(record.stock ?? 0)
          const taken = Number(record.uses ?? 0)
          const capped = !record.unlimited_stock && total > 0
          if (record.status !== 'active') return json(DEAD, 30)
          // Out of stock is the whole point: it goes away by itself, on the
          // same number that stopped it working.
          if (capped && taken >= total) return json(DEAD, 30)

          /*
           * The code goes in the URL as well as on the screen. `foodie_30%`
           * ends in a percent sign, which is the escape character in a URL —
           * unencoded it would eat the next two characters and arrive as
           * something else entirely. encodeURIComponent is not optional here.
           */
          const href = `/checkout/${promo.planId}?promoCode=${encodeURIComponent(promo.code)}`

          return json(
            {
              live: true,
              id: promo.id,
              code: promo.code,
              headline: promo.headline,
              body: promo.body,
              cta: promo.cta,
              href,
              taken,
              total: capped ? total : 0,
              left: capped ? Math.max(0, total - taken) : 0,
            },
            30,
          )
        } catch {
          return json(DEAD, 30)
        }
      },
    },
  },
})
