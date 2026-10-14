import { createFileRoute } from '@tanstack/react-router'

import { identifyVisitor } from '#/lib/session'
import { candidates, tvTeaser, whatsOn } from '#/lib/tv'

function json(body: unknown, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

/*
 * /api/tv — food TV. Free, account-only, beside the radio: see lib/tv.ts.
 *
 *   GET /api/tv          the channels: names and logos to anybody; once
 *                        signed in, the candidates with every stream
 *                        address, which the page checks from the viewer's
 *                        own browser before listing any of them
 *   GET /api/tv?guide=1  what's on now and next, signed in only
 */
export const Route = createFileRoute('/api/tv')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await identifyVisitor(request)
        const wantsGuide = new URL(request.url).searchParams.has('guide')

        if (!wantsGuide) {
          return userId
            ? json({ signedIn: true, channels: await candidates() })
            : json({ signedIn: false, channels: tvTeaser() })
        }
        if (!userId) return json({ signedIn: false, error: 'not_signed_in' }, 401)
        // A minute's private caching: the page asks again every few minutes
        // to move "now" along, and the listings themselves are kept for a
        // quarter of an hour in lib/tv.ts.
        return json({ signedIn: true, now: Date.now(), guide: await whatsOn() }, 200, 'private, max-age=60')
      },
    },
  },
})
