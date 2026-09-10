import { createFileRoute } from '@tanstack/react-router'

import { checkProductAccess } from '#/lib/session'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'

// What the game at /decide asks instead of a pasted licence key: is the
// Whop account signed into this browser one that owns morsels45 Premium?
// Same check the rest of the site already makes (see lib/viewer.ts) — one
// answer, good on any device someone signs into.
export const Route = createFileRoute('/api/premium-status')({
  server: {
    handlers: {
      GET: async () => {
        const { signedIn, hasAccess, user } = await checkProductAccess(PREMIUM_PRODUCT_ID)
        return new Response(
          JSON.stringify({
            signedIn,
            hasPremium: hasAccess,
            username: user?.preferred_username ?? user?.name ?? '',
          }),
          { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
        )
      },
    },
  },
})
