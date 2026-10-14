import { createFileRoute } from '@tanstack/react-router'

import { db } from '#/lib/db'

/*
 * /api/db-health — can this deployment reach its database.
 *
 * Answers with whether it could, how long the round trip took, and nothing
 * else: no URL, no table names, no counts. It runs `select 1`, so it reads no
 * data and writes none, which is why it can sit on a public route without
 * the privacy page needing a word about it.
 */
export const Route = createFileRoute('/api/db-health')({
  server: {
    handlers: {
      GET: async () => {
        const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        const client = db()
        if (!client) {
          return new Response(JSON.stringify({ ok: false, reason: 'not configured' }), { headers })
        }
        const started = Date.now()
        try {
          await client.execute('select 1')
          return new Response(JSON.stringify({ ok: true, ms: Date.now() - started }), { headers })
        } catch {
          return new Response(JSON.stringify({ ok: false, reason: 'unreachable' }), { headers })
        }
      },
    },
  },
})
