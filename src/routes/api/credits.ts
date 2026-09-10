import { createFileRoute } from '@tanstack/react-router'

import { PREMIUM_PRODUCT_ID } from '#/lib/products'
import { checkProductAccess } from '#/lib/session'
import { COST, FREE_PER_DAY, allowanceLeft, db, getAccount, recentLedger } from '#/lib/credits'
import { provider } from '#/lib/surveys'

/*
 * /api/credits — what the Credits tab reads.
 *
 * Read-only by design. Nothing here can move a balance: points come in
 * through the survey postback and go out through the feature routes that
 * charge for themselves. A browser that could adjust its own balance would
 * make the whole thing decorative.
 */
export const Route = createFileRoute('/api/credits')({
  server: {
    handlers: {
      GET: async () => {
        const { signedIn, hasAccess, user } = await checkProductAccess(PREMIUM_PRODUCT_ID)

        if (!signedIn || !user) {
          return json({ signedIn: false, hasPremium: false, configured: !!db() })
        }

        const [account, ledger, chatLeft, newsLeft] = await Promise.all([
          getAccount(user.sub),
          recentLedger(user.sub),
          allowanceLeft(user.sub, 'chat'),
          allowanceLeft(user.sub, 'news'),
        ])

        return json({
          signedIn: true,
          hasPremium: hasAccess,
          configured: !!db(),
          balance: account.balance,
          lifetimeEarned: account.lifetimeEarned,
          lifetimeSpent: account.lifetimeSpent,
          freePerDay: FREE_PER_DAY,
          cost: COST,
          remaining: { chat: chatLeft, news: newsLeft },
          // Signed per-user, so it is built here rather than in the page.
          wallUrl: hasAccess ? null : provider()?.wallUrl(user.sub) ?? null,
          ledger,
        })
      },
    },
  },
})

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
