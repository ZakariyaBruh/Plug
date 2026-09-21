import { createFileRoute } from '@tanstack/react-router'

/*
 * A TOMBSTONE THAT STILL ANSWERS POLITELY.
 *
 * This endpoint existed for exactly one job: when a Household subscriber
 * stopped paying, Whop does not cascade, so the free seat they had handed to
 * somebody else carried on working. This took it away. Household is gone and
 * so is that job.
 *
 * It returns 200 rather than 410 because the webhook subscription still
 * exists on the Whop side, and a webhook that starts failing generates
 * retries and alerts about a problem nobody has. Delete the subscription in
 * the Whop dashboard and then delete this file; until then it acknowledges
 * and does nothing, which is exactly what there is to do.
 *
 * Nothing is read from the body, so there is nothing to verify and no secret
 * in use here any more.
 */
export const Route = createFileRoute('/api/whop-events')({
  server: {
    handlers: {
      POST: async () => new Response('nothing to do', { status: 200 }),
    },
  },
})
