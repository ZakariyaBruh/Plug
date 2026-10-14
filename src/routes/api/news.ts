import { createFileRoute } from '@tanstack/react-router'

import { latestStories } from '#/lib/news'

/*
 * /api/news — food writing from a handful of public feeds, merged. The
 * reading and the merging live in lib/news.ts, shared with the AI briefing.
 */
export const Route = createFileRoute('/api/news')({
  server: {
    handlers: {
      GET: async () => {
        const stories = await latestStories()

        return new Response(JSON.stringify({ stories }), {
          headers: {
            'Content-Type': 'application/json',
            // Fifteen minutes. Food writing does not move faster than that, and
            // the alternative is seven publishers taking a request per reader.
            'Cache-Control': 'public, max-age=900',
          },
        })
      },
    },
  },
})
