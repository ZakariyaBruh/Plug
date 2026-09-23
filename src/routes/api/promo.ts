import { createFileRoute } from '@tanstack/react-router'
import { WhopClient } from '@whop/sdk'

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
/*
 * Why it is not live, when it is not.
 *
 * A single `{live:false}` is the right answer for the browser and a useless
 * one for whoever has to operate this: "no offer showing" has six causes and
 * they need different fixes. The reason names which, and it is safe to say
 * out loud — it reveals no key, no id and nothing about the person asking,
 * only which branch was taken.
 */
type Dead = PromoState & { reason?: string }

function dead(reason: string): Dead {
  return { live: false, reason }
}

function whopClient() {
  return new WhopClient({
    token: process.env.WHOP_API_KEY ?? '',
    baseUrl: `${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/api/v1`,
  })
}

function json(body: Dead, seconds: number) {
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
        if (!promo) return json(dead('none scheduled'), 300)

        /*
         * The same client the checkout page builds, constructed the same way.
         *
         * A hand-rolled fetch with `Bearer ${process.env.WHOP_API_KEY}` came
         * back unauthorised in production while the checkout page, two files
         * away, resolved its plan fine — so the SDK is finding a credential
         * that a bare env read does not. Rather than work out which, this uses
         * the thing that demonstrably works here, which is also the thing that
         * will keep working when the platform changes how it hands apps a key.
         */
        try {
          const record = await whopClient()
            .promoCodes.retrieve({ id: promo.promoId })
            .catch(() => null)
          if (!record) return json(dead('could not read the code'), 30)

          const total = Number(record.stock ?? 0)
          const taken = Number(record.uses ?? 0)
          const capped = !record.unlimited_stock && total > 0
          if (record.status !== 'active') return json(dead('code is ' + record.status), 30)
          // Out of stock is the whole point: it goes away by itself, on the
          // same number that stopped it working.
          if (capped && taken >= total) return json(dead('all ' + total + ' taken'), 30)

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
        } catch (err) {
          return json(dead('fetch failed'), 30)
        }
      },
    },
  },
})
