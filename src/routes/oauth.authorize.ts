import { createFileRoute } from '@tanstack/react-router'

import { CANONICAL_ORIGIN, isLocal, signInContext } from '#/lib/oauth'

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
 * So a visitor on this site goes on to where they were meant to: Whop's
 * page, with the same question, which Whop then checks as it would have
 * anyway. Only whop.com, whatever the query says, so it cannot be used to
 * send anybody anywhere else. Each one is written down — which kind of
 * browser, from where — so whatever does it can be named.
 *
 * WHAT IT TURNED OUT TO BE, mostly: Whop's own post-deploy check, which
 * follows the sign-in redirect with no browser at all and whose requests for
 * api.whop.com and whop.com are answered by this app. It got a 404 here for
 * weeks without harm; sent on to whop.com it came straight back, round and
 * round. So only requests for this site's own address are sent on; anything
 * addressed to another host gets the plain 404 it always had.
 */
export const Route = createFileRoute('/oauth/authorize')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        if (!isLocal(url) && url.hostname !== new URL(CANONICAL_ORIGIN).hostname) return new Response('Not found', { status: 404 })
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
