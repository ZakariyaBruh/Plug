import { createFileRoute } from '@tanstack/react-router'

import { identifyVisitor } from '#/lib/session'
import { checkinState, recordCheckin } from '#/lib/habits'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/*
 * /api/checkin — one tap, once a day: how are you doing. Account-only (see
 * lib/habits.ts for why), not Premium, and nothing to do with food — the
 * identity check is identifyVisitor rather than checkProductAccess because
 * there is no product to ask about here, only "is this a real account."
 */
export const Route = createFileRoute('/api/checkin')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await identifyVisitor(request)
        if (!userId) return json({ signedIn: false })
        return json({ signedIn: true, ...(await checkinState(userId)) })
      },
      POST: async ({ request }) => {
        const userId = await identifyVisitor(request)
        if (!userId) return json({ error: 'not_signed_in' }, 401)

        let body: { mood?: unknown }
        try {
          body = await request.json()
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        const mood = typeof body.mood === 'string' ? body.mood : ''
        const state = await recordCheckin(userId, mood)
        if (!state) return json({ error: 'bad_request' }, 400)
        return json({ signedIn: true, ...state })
      },
    },
  },
})
