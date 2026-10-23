import { createFileRoute } from '@tanstack/react-router'

import { freeHealth, freeProviders } from '#/lib/free-ai'

// What the free assistant knows about the services it calls: which are configured, which are
// resting and why, how long each has been taking. Names and numbers only, never a key.
// It is this worker's own memory (a new worker starts clean), so an empty list means "no
// traffic yet", not "all well".
export const Route = createFileRoute('/api/ai-health')({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ providers: freeProviders(), lanes: freeHealth(), at: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }),
    },
  },
})
