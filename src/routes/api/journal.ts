import { createFileRoute } from '@tanstack/react-router'

import { identifyVisitor } from '#/lib/session'
import { journalState, recordJournal } from '#/lib/habits'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/*
 * /api/journal — one line a day about something good. Account-only, not
 * Premium: see lib/habits.ts. Same identity check as /api/checkin.
 */
export const Route = createFileRoute('/api/journal')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await identifyVisitor(request)
        if (!userId) return json({ signedIn: false })
        return json({ signedIn: true, ...(await journalState(userId)) })
      },
      POST: async ({ request }) => {
        const userId = await identifyVisitor(request)
        if (!userId) return json({ error: 'not_signed_in' }, 401)

        let body: { entry?: unknown }
        try {
          body = await request.json()
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        const entry = typeof body.entry === 'string' ? body.entry : ''
        const state = await recordJournal(userId, entry)
        if (!state) return json({ error: 'bad_request' }, 400)
        return json({ signedIn: true, ...state })
      },
    },
  },
})
