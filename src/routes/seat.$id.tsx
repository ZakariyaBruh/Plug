import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { PageShell } from '#/components/PageShell'
import { checkoutFor } from '#/lib/household'
import { pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * /seat/<id> — where an invitation to somebody's Household seat lands.
 *
 * WHY THIS EXISTS RATHER THAN SHARING WHOP'S CHECKOUT LINK DIRECTLY.
 *
 * A seat is a membership on a free plan attached to the Premium product, so
 * the checkout link that creates one is Premium for anybody holding it. The
 * link is unguessable, but unguessable is not the same as unshareable, and
 * the failure we care about is the ordinary one: it gets forwarded, or sits
 * in a group chat, and four people claim one seat.
 *
 * So the link that leaves this app points here, and this asks the question
 * Whop's own checkout cannot: is the seat this invitation was written for
 * still going spare? Taken, revoked, or the owner has stopped paying, and it
 * stops working — before anybody reaches a checkout, rather than after they
 * already have a membership we then have to take away.
 *
 * The id is the configuration id, which is already the secret. Nothing is
 * signed on top of it because there is nothing extra to say: the record it
 * names carries its own owner, and the owner is who the capacity is checked
 * against.
 */

const check = createServerFn({ method: 'GET' })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => await checkoutFor(data.id))

export const Route = createFileRoute('/seat/$id')({
  loader: async ({ params }) => {
    const seat = await check({ data: { id: params.id } })
    // Straight on to Whop when it is good. Nothing is shown in between,
    // because a page that says "redirecting…" is a page nobody wanted.
    if (seat.ok) throw redirect({ href: seat.url })
    return { viewer: await loadViewer(), why: seat.why }
  },
  head: () =>
    pageHead({
      title: 'A seat on somebody’s Household — morsels45',
      description: 'Someone is sharing their morsels45 Premium with you.',
      // One person's invitation, meant for one person. Not a search result.
      noindex: true,
    }),
  component: SeatPage,
})

function SeatPage() {
  const { viewer, why } = Route.useLoaderData()

  return (
    <PageShell user={viewer.user}>
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center fade-in-up">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">This invitation is not open</h1>
          <p className="mt-3 text-[var(--text-dim)]">{why}</p>
          <p className="mt-6 text-sm text-[var(--text-dim)]">
            Ask whoever sent it for a fresh link — they can make one from their account page.
          </p>
          <a
            href="/decide/"
            className="mt-8 inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
          >
            Play the free game
          </a>
        </div>
      </main>
    </PageShell>
  )
}
