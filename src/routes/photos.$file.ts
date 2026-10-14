import { createFileRoute } from '@tanstack/react-router'

import { PHOTO_WIDTHS, photoFor, upstreamFor } from '#/lib/dish-photos'

/*
 * /photos/<slug>.jpg — a dish page's photograph, from this site.
 *
 * The photographs live on Wikimedia Commons (see scripts/dish-photos.mjs).
 * Showing them from Commons directly would hand every visitor's address to
 * Wikimedia and have the images indexed as theirs; showing them from here,
 * fetched by the server, does neither. Only the photos in the list can be
 * asked for, so this is not a way to fetch anything else.
 *
 * Each is kept in the edge cache once fetched, and browsers keep it a year:
 * a photo's address only ever means that one photo.
 */
const UA = 'morsels45/1.0 (https://morsels45-app.whop.site; dish photos for recipe pages)'

export const Route = createFileRoute('/photos/$file')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        // <slug>.jpg is the full 1280 pixels; <slug>-960.jpg and -500 are the
        // smaller copies phones are given.
        const m = /^([a-z0-9-]+?)(?:-(500|960))?\.(jpg|png)$/.exec(params.file)
        const width = m?.[2] ? Number(m[2]) : undefined
        const photo = m ? photoFor(m[1]) : null
        if (!m || !photo || photo.ext !== m[3] || (width && !PHOTO_WIDTHS.includes(width as 500 | 960))) {
          return new Response('Not found', { status: 404 })
        }

        const edge = (globalThis as { caches?: { default?: Cache } }).caches?.default
        const key = new Request(new URL(`/photos/${params.file}`, request.url).toString())
        if (edge) {
          const hit = await edge.match(key).catch(() => undefined)
          if (hit) return hit
        }

        const upstream = await fetch(upstreamFor(photo, width), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) }).catch(() => null)
        if (!upstream || !upstream.ok) {
          console.error(`photos: ${m[1]} would not load from Commons (${upstream?.status ?? 'no answer'})`)
          return new Response('Photo unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } })
        }
        const body = await upstream.arrayBuffer()
        const response = new Response(body, {
          headers: {
            'Content-Type': upstream.headers.get('content-type') ?? (m[3] === 'png' ? 'image/png' : 'image/jpeg'),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
        if (edge) await edge.put(key, response.clone()).catch(() => {})
        return response
      },
    },
  },
})
