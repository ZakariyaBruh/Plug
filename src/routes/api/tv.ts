import { createFileRoute } from '@tanstack/react-router'

import { identifyVisitor } from '#/lib/session'
import { candidates, isTvCategory, tvCategoryList, tvTeaser, whatsOn } from '#/lib/tv'

function json(body: unknown, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

/*
 * /api/tv — the TV. Free, account-only, beside the radio: see lib/tv.ts.
 *
 *   GET /api/tv?cat=music          one group's channels (food when none is
 *                                  named), with the list of groups: names and
 *                                  logos to anybody; once signed in, the
 *                                  candidates with every stream address,
 *                                  which the page checks from the viewer's
 *                                  own browser before listing any of them
 *   GET /api/tv?guide=1&cat=music  what's on now and next in that group,
 *                                  signed in only
 */
export const Route = createFileRoute('/api/tv')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await identifyVisitor(request)
        const params = new URL(request.url).searchParams
        const wantsGuide = params.has('guide')
        const asked = params.get('cat') ?? 'food'
        const category = isTvCategory(asked) ? asked : 'food'

        if (!wantsGuide) {
          const groups = { categories: tvCategoryList(), category }
          return userId
            ? json({ signedIn: true, ...groups, channels: await candidates(category) })
            : json({ signedIn: false, ...groups, channels: tvTeaser(category) })
        }
        if (!userId) return json({ signedIn: false, error: 'not_signed_in' }, 401)
        // A minute's private caching: the page asks again every few minutes
        // to move "now" along, and the listings themselves are kept for a
        // quarter of an hour in lib/tv.ts.
        return json({ signedIn: true, category, now: Date.now(), guide: await whatsOn(category) }, 200, 'private, max-age=60')
      },
    },
  },
})
