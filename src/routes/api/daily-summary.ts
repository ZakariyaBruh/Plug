import { createFileRoute } from '@tanstack/react-router'

import { identifyVisitor } from '#/lib/session'
import { dailySummary } from '#/lib/habits'

/*
 * /api/daily-summary — what the Daily page's calendar, streak and checklist
 * are drawn from. Account-only, like the three things it summarises.
 */
export const Route = createFileRoute('/api/daily-summary')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await identifyVisitor(request)
        const body = userId ? { signedIn: true, ...(await dailySummary(userId)) } : { signedIn: false }
        return new Response(JSON.stringify(body), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      },
    },
  },
})
