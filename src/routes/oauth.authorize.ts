import { createFileRoute } from '@tanstack/react-router'

import { signInContext } from '#/lib/oauth'

/*
 * /oauth/authorize ON THIS SITE — a page that should not exist, and is asked
 * for anyway.
 *
 * Whop's sign-in page lives at whop.com/oauth/authorize, and Whop's own
 * redirects point at it by path alone ("/login?next=/oauth/authorize?…"). Some
 * app shells resolve that path against the site they are showing rather than
 * whop.com, and the visitor lands here — a 404, which their app reports as an
 * invalid address. It has been asked for, in pairs, after every deploy.
 *
 * So it goes on to where it was meant to: Whop's page, with the same
 * question, which Whop then checks as it would have anyway. Only whop.com,
 * whatever the query says, so it cannot be used to send anybody anywhere
 * else. And each one is written down — which kind of browser, from where —
 * so whatever is doing this can be named.
 */
export const Route = createFileRoute('/oauth/authorize')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const isSignIn = url.searchParams.has('client_id')
        console.error('[oauth] whop sign-in page asked for on this site:', JSON.stringify({ ...signInContext(request), withQuery: isSignIn }))
        return new Response(null, {
          status: 302,
          headers: {
            Location: isSignIn ? `https://whop.com/oauth/authorize${url.search}` : '/decide/',
            'Cache-Control': 'no-store',
          },
        })
      },
    },
  },
})
