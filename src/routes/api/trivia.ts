import { createFileRoute } from '@tanstack/react-router'

import { identifyVisitor } from '#/lib/session'
import { triviaState, recordTriviaAnswer } from '#/lib/habits'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/*
 * /api/trivia — the same question for everyone, each day, answered once.
 * Account-only, not Premium: see lib/habits.ts. The question bank lives on
 * the server so the correct answer is never sitting in the page's own
 * source for someone to read before picking.
 */
export const Route = createFileRoute('/api/trivia')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await identifyVisitor(request)
        if (!userId) return json({ signedIn: false })
        const state = await triviaState(userId)
        if (!state) return json({ signedIn: true, question: null })
        return json({ signedIn: true, ...state })
      },
      POST: async ({ request }) => {
        const userId = await identifyVisitor(request)
        if (!userId) return json({ error: 'not_signed_in' }, 401)

        let body: { choice?: unknown }
        try {
          body = await request.json()
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        const choice = typeof body.choice === 'number' ? body.choice : NaN
        const state = await recordTriviaAnswer(userId, choice)
        if (!state) return json({ error: 'bad_request' }, 400)
        return json({ signedIn: true, ...state })
      },
    },
  },
})
