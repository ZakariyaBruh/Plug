import { createFileRoute, redirect } from '@tanstack/react-router'

/*
 * A TOMBSTONE.
 *
 * This page claimed the second seat on somebody's Household subscription:
 * open the link, sign in, and Premium switched on. Household has been
 * withdrawn and no seat was ever granted — all three plans behind it had
 * never had a member — so there is no link in existence that this could
 * honour.
 *
 * It redirects rather than erroring. An invitation link is a thing somebody
 * was handed by a person they know, and the kindest answer to one that has
 * expired is the page explaining what the thing costs now, not a 404.
 */
export const Route = createFileRoute('/seat/$id')({
  beforeLoad: () => {
    throw redirect({ to: '/premium' })
  },
})
