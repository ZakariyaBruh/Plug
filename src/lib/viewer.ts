import { createServerFn } from '@tanstack/react-start'

import { checkProductAccess } from '#/lib/session'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'
import { bonusActive } from '#/lib/referrals'

export const loadViewer = createServerFn({ method: 'GET' }).handler(async () => {
  const { signedIn, hasAccess, user } = await checkProductAccess(PREMIUM_PRODUCT_ID)
  // A day earned by referring a friend counts the same as a real membership —
  // see lib/referrals.ts — checked only for a signed-in visitor who does not
  // already have access, so a paying member never waits on an extra query.
  // Kept distinct from hasAccess below: /account needs to know a free day is
  // not a subscription, so it never offers to "manage or cancel" one.
  const bonus = hasAccess ? false : signedIn && user ? await bonusActive(user.sub) : false
  return {
    signedIn,
    isMember: hasAccess,
    hasPremium: hasAccess || bonus,
    user: user
      ? { name: user.name ?? null, preferred_username: user.preferred_username ?? null, id: user.sub }
      : null,
  }
})
