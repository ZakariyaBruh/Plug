import { createFileRoute } from '@tanstack/react-router'

/*
 * A TOMBSTONE, NOT A ROUTE.
 *
 * This endpoint granted the second Household seat: a signed-in household
 * subscriber POSTed to it and it created a free membership on the Premium
 * product for somebody else. Household has been withdrawn, so it grants
 * nothing and can grant nothing — the code that knew how was removed, not
 * commented out.
 *
 * It answers 410 rather than 404 on purpose. A 404 says "wrong address" and
 * invites somebody to keep looking; 410 says this existed and is finished,
 * which is the true and more useful answer.
 */
export const Route = createFileRoute('/api/household')({
  server: {
    handlers: {
      GET: async () => new Response('Household has been withdrawn.', { status: 410 }),
      POST: async () => new Response('Household has been withdrawn.', { status: 410 }),
      DELETE: async () => new Response('Household has been withdrawn.', { status: 410 }),
    },
  },
})
