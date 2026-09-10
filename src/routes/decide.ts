import { createFileRoute } from '@tanstack/react-router'

// /decide (no trailing slash) — send it to /decide/ where the game's own
// relative asset links (styles.css, js/app.js, ...) resolve correctly.
export const Route = createFileRoute('/decide')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        return new Response(null, { status: 302, headers: { Location: `${url.origin}/decide/` } })
      },
    },
  },
})
