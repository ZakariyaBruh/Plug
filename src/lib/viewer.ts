import { createServerFn } from '@tanstack/react-start'

import { checkProductAccess } from '#/lib/session'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'

export const loadViewer = createServerFn({ method: 'GET' }).handler(async () => {
  const { signedIn, hasAccess, user } = await checkProductAccess(PREMIUM_PRODUCT_ID)
  return {
    signedIn,
    hasPremium: hasAccess,
    user: user
      ? { name: user.name ?? null, preferred_username: user.preferred_username ?? null }
      : null,
  }
})
