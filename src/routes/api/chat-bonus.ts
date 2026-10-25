import { createFileRoute } from '@tanstack/react-router'

import { BONUS_ON } from '#/lib/site'

import {
  BONUS_CLAIMS_PER_DAY,
  BONUS_PER_CLAIM,
  bonusToken,
  bonusTokenOk,
  premiumFor,
  spendBonus,
  standing,
} from '#/lib/allowance'

/*
 * /api/chat-bonus — two more Standard questions for opening a sponsor page.
 *
 * Two steps, because the one thing this server can know about a claim is how
 * long ago the visitor asked for it:
 *
 *   { step: 'start' }              -> { token, per }   the page is about to be opened
 *   { step: 'claim', token }       -> { left, limit }  at least BONUS_MIN_SECONDS later
 *
 * It cannot know the sponsor page was really opened (see the note over
 * BONUS_PER_CLAIM in lib/allowance.ts), so it does not pretend to: it enforces
 * the delay and the daily cap, counted in the same ledger as the questions, and
 * the reward is a free-model answer, which costs nothing.
 *
 * Never for Premium (who have no limit to extend), and never past the cap.
 */

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const Route = createFileRoute('/api/chat-bonus')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // The sponsor-page offer is an ad; with the master switch off (lib/site.ts) it does not exist.
        if (!BONUS_ON) return json({ error: 'not_found' }, 404)
        let sent: Record<string, unknown> = {}
        try {
          sent = ((await request.json()) as Record<string, unknown>) ?? {}
        } catch {
          return json({ error: 'bad_request' }, 400)
        }

        const mine = await standing(request)
        // No ledger, nothing to add to: the question limit is not being counted either.
        if (mine.left === null) return json({ error: 'unavailable' }, 503)
        if (mine.claims >= BONUS_CLAIMS_PER_DAY) return json({ error: 'cap', left: mine.left, limit: mine.limit }, 429)
        if (await premiumFor(request, mine)) return json({ error: 'premium' }, 409)

        if (sent.step === 'start') {
          const token = await bonusToken(mine, Date.now())
          if (!token) return json({ error: 'unavailable' }, 503)
          return json({ token, per: BONUS_PER_CLAIM })
        }

        if (sent.step === 'claim') {
          if (!(await bonusTokenOk(mine, sent.token, Date.now()))) return json({ error: 'too_soon' }, 425)
          const claimed = await spendBonus(mine)
          if (claimed === null) return json({ error: 'unavailable' }, 503)
          // Whatever the ledger now says, not arithmetic done here.
          const after = await standing(request)
          return json({ left: after.left, limit: after.limit, claimsLeft: Math.max(0, BONUS_CLAIMS_PER_DAY - after.claims) })
        }

        return json({ error: 'bad_request' }, 400)
      },
    },
  },
})
