import { createFileRoute } from '@tanstack/react-router'

import { askFirst } from '#/lib/consent'

// One question, asked by the cookie banner on every page: must this visitor
// opt in before ads and analytics run? Answered from the country Cloudflare put
// on the request, and never stored. See lib/consent.ts for the rule and for what
// happens when the country cannot be told.
export const Route = createFileRoute('/api/region')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const country = request.headers.get('cf-ipcountry')
        return new Response(JSON.stringify({ askFirst: askFirst(country) }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
        })
      },
    },
  },
})
