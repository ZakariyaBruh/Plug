import { createFileRoute } from '@tanstack/react-router'

import { clearSession } from '#/lib/session'

export const Route = createFileRoute('/api/oauth/logout')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        clearSession()
        const url = new URL(request.url)
        return new Response(null, { status: 302, headers: { Location: `${url.origin}/` } })
      },
    },
  },
})
