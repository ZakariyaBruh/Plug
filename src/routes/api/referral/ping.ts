import { createFileRoute } from '@tanstack/react-router'

import { checkProductAccess } from '#/lib/session'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'
import { whopUserId } from '#/lib/whop-token'
import { recordPlay } from '#/lib/referrals'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/*
 * /api/referral/ping — one heartbeat of a referred friend's play time.
 *
 * WHO IS PLAYING IS NEVER TAKEN FROM THE BODY. The game sends `code` (whose
 * invite this is) and `seconds` (how long since the last heartbeat); who is
 * actually playing is read the same two ways /api/premium-status reads it —
 * the session cookie, or Whop's signed iframe token — so nobody can credit
 * seconds, or a day of Premium, to an account that is not their own signed-in
 * session. See lib/referrals.ts for why the same friend cannot be replayed
 * for a second day and why referring yourself is refused outright.
 *
 * A SMALL CEILING ON `seconds` PER CALL, independent of whatever the client
 * says its own interval was: a tab that was asleep and wakes up, or a request
 * replayed by hand, should cost at most one heartbeat's worth of credit, not
 * however long the gap actually was.
 */
const MAX_SECONDS_PER_PING = 30

export const Route = createFileRoute('/api/referral/ping')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { code?: unknown; seconds?: unknown }
        try {
          body = await request.json()
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        const code = typeof body.code === 'string' ? body.code : ''
        const seconds = typeof body.seconds === 'number' ? body.seconds : 0
        if (!code || !(seconds > 0)) return json({ error: 'bad_request' }, 400)

        const session = await checkProductAccess(PREMIUM_PRODUCT_ID)
        const referredId = session.signedIn ? session.user.sub : await whopUserId(request)
        if (!referredId) return json({ error: 'not_signed_in' }, 401)

        const result = await recordPlay(referredId, code, Math.min(seconds, MAX_SECONDS_PER_PING))
        return json(result)
      },
    },
  },
})
