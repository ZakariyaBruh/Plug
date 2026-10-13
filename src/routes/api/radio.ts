import { createFileRoute } from '@tanstack/react-router'

import { identifyVisitor } from '#/lib/session'
import { CHANNELS, countPlay, isStationId, lineup, stationsFor } from '#/lib/radio'

function json(body: unknown, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

/*
 * /api/radio — kitchen radio. Free, account-only, like the daily three: see
 * lib/radio.ts for where the stations come from and why the channels are what
 * they are.
 *
 *   GET  /api/radio                 the lineup, to anybody — the signed-out
 *                                   page shows what signing in gets you
 *   GET  /api/radio?channel=italian that channel's stations, signed in only
 *   POST /api/radio {station}       "this was played", passed on to the
 *                                   directory without anything about who
 */
export const Route = createFileRoute('/api/radio')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await identifyVisitor(request)
        const channelId = new URL(request.url).searchParams.get('channel')
        if (!channelId) return json({ signedIn: !!userId, channels: lineup() })

        if (!userId) return json({ signedIn: false, error: 'not_signed_in' }, 401)
        const channel = CHANNELS.find((c) => c.id === channelId)
        if (!channel) return json({ signedIn: true, error: 'unknown_channel' }, 404)

        try {
          const stations = await stationsFor(channel)
          // Private: the list is the same for everybody, but who may read it
          // is not, so no shared cache gets to hand it on.
          return json({ signedIn: true, channel: channel.id, stations }, 200, 'private, max-age=600')
        } catch (err) {
          console.error(`radio: ${channel.id} could not be listed`, err)
          return json({ signedIn: true, channel: channel.id, error: 'directory_unavailable' }, 502)
        }
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
