import { createFileRoute } from '@tanstack/react-router'

import { checkProductAccess, checkProductAccessFor, usernameFor } from '#/lib/session'
import { whopUserId } from '#/lib/whop-token'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'

// What the game at /decide asks instead of a pasted licence key: is the
// Whop account signed into this browser one that owns morsels45 Premium?
// Same check the rest of the site already makes (see lib/viewer.ts) — one
// answer, good on any device someone signs into.
//
// TWO WAYS TO BE IDENTIFIED, because there are two ways to be here.
//
// On the site itself the visitor is whoever owns the `wa` cookie that OAuth
// wrote. Inside a whop the app is in an iframe on whop.com, so that cookie is
// a third-party cookie and the browser may simply refuse to send it. The
// answer then comes back "not signed in" for a member who is signed in and
// has paid — which is the worst thing this endpoint can do, because from
// their side it is indistinguishable from being cheated out of what they
// bought.
//
// So when the cookie is missing, fall back to the signed token Whop's proxy
// injects on every request to an app in its iframe. It is verified against
// Whop's published keys before it counts (lib/whop-token.ts) — the header on
// its own is worthless, since this origin is reachable directly and anyone
// can set any header they like.
//
// Cookie first, deliberately: it is the one that also carries a display name,
// and it costs nothing when it is there. The token path only runs when the
// cookie answered "nobody".
export const Route = createFileRoute('/api/premium-status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const answer = (signedIn: boolean, hasPremium: boolean, username: string) =>
          new Response(JSON.stringify({ signedIn, hasPremium, username }), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          })

        const session = await checkProductAccess(PREMIUM_PRODUCT_ID)
        if (session.signedIn) {
          const { user } = session
          return answer(true, session.hasAccess, user?.preferred_username ?? user?.name ?? '')
        }

        const userId = await whopUserId(request)
        if (!userId) return answer(false, false, '')

        const viaToken = await checkProductAccessFor(userId, PREMIUM_PRODUCT_ID)
        return answer(true, viaToken.hasAccess, await usernameFor(userId))
      },
    },
  },
})
