import { createFileRoute } from '@tanstack/react-router'

import { identifyVisitor } from '#/lib/session'
import { RADIO_CATEGORIES, categoryStations, countPlay, isRadioCategory, isStationId } from '#/lib/radio'

function json(body: unknown, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

/*
 * /api/radio — the radio. Free, account-only, like the daily three: see
 * lib/radio.ts for where the stations come from and how each group is chosen.
 *
 *   GET  /api/radio?cat=jazz   one group's stations (food when none is
 *                              named), with the list of groups: names to
 *                              anybody — the signed-
 *                              out page shows what signing in gets you — and
 *                              the streams as well once signed in
 *   POST /api/radio {station}  "this was played", passed on to the
 *                              directory without anything about who
 */
export const Route = createFileRoute('/api/radio')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await identifyVisitor(request)
        const asked = new URL(request.url).searchParams.get('cat') ?? 'food'
        const category = isRadioCategory(asked) ? asked : 'food'
        const groups = { categories: RADIO_CATEGORIES, category }
        let stations
        try {
          stations = await categoryStations(category)
        } catch (err) {
          console.error(`radio: the directory could not be reached for ${category}`, err)
          return json({ signedIn: !!userId, ...groups, error: 'directory_unavailable' }, 502)
        }
        if (!userId) {
          return json({
            signedIn: false,
            ...groups,
            stations: stations.map(({ id, name, favicon, emoji, country, tags }) => ({ id, name, favicon, emoji, country, tags })),
          })
        }
        // Private: the list is the same for everybody, but who may have the
        // streams is not, so no shared cache gets to hand them on.
        return json({ signedIn: true, ...groups, stations }, 200, 'private, max-age=600')
      },
      POST: async ({ request }) => {
        const userId = await identifyVisitor(request)
        if (!userId) return json({ error: 'not_signed_in' }, 401)
        let body: { station?: unknown }
        try {
          body = await request.json()
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        if (!isStationId(body.station)) return json({ error: 'bad_request' }, 400)
        await countPlay(body.station)
        return new Response(null, { status: 204 })
      },
    },
  },
})
