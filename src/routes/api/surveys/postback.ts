import { createFileRoute } from '@tanstack/react-router'

import { credit, pointsFor, reverse } from '#/lib/credits'
import { fromProvider, provider } from '#/lib/surveys'

/*
 * /api/surveys/postback — the only thing in this app that can create points.
 *
 * NOT REACHABLE FROM THE BROWSER IN ANY MEANINGFUL SENSE. The reward is
 * granted here, server to server, because every other place it could be
 * granted is somewhere the person being rewarded controls. A "survey
 * finished" callback in the page, a redirect back from the wall, a fetch the
 * game makes on completion — all of them are a person telling us they earned
 * money, and all of them can be replayed by hand.
 *
 * Three things have to hold before a single point moves:
 *   1. the request comes from the network's own address (fromProvider)
 *   2. the signature over trans_id verifies (parsePostback)
 *   3. the transaction id has not been seen (the unique index, inside credit())
 *
 * The third is not paranoia: survey networks retry postbacks until they get
 * their acknowledgement byte, so the same completion WILL arrive twice.
 */
export const Route = createFileRoute('/api/surveys/postback')({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      // CPX sends GET; other networks POST the same query string.
      POST: async ({ request }) => handle(request),
    },
  },
})

async function handle(request: Request): Promise<Response> {
  const net = provider()
  if (!net) {
    console.error('surveys: no provider configured')
    return new Response('provider', { status: 503 })
  }

  if (!fromProvider(request)) {
    // Deliberately terse and deliberately 403: an unverified caller learns
    // nothing about whether the transaction id or the hash was the problem.
    return new Response('forbidden', { status: 403 })
  }

  const event = net.parsePostback(new URL(request.url))
  if (!event) {
    console.error('surveys: postback failed verification')
    return new Response('bad signature', { status: 403 })
  }

  try {
    if (event.kind === 'ignored') {
      console.log('surveys: ignored postback —', event.reason)
      return net.ack()
    }

    if (event.kind === 'reversal') {
      const { duplicate } = await reverse({
        userId: event.userId,
        points: event.points,
        provider: net.id,
        providerTxnId: event.txnId,
        metadata: event.raw,
      })
      console.log(`surveys: reversal ${event.txnId} for ${event.userId}${duplicate ? ' (already applied)' : ''}`)
      return net.ack()
    }

    /*
     * Screenouts are paid, and that is a deliberate cost.
     *
     * Most survey starts end in a screenout rather than a completion — the
     * panel decides three questions in that you are not who the study wants.
     * Paying nothing for that is accurate and also the fastest way to make
     * this tab feel broken, so a screenout is worth a token point out of our
     * 70%. It buys nothing on its own; it just means the attempt was not
     * wasted.
     */
    if (event.kind === 'screenout') {
      await credit({
        userId: event.userId,
        points: SCREENOUT_POINTS,
        reason: 'survey_screenout',
        provider: net.id,
        providerTxnId: event.txnId,
        metadata: event.raw,
      })
      return net.ack()
    }

    const points = pointsFor(event.netRevenueUsd)
    const { credited, duplicate } = await credit({
      userId: event.userId,
      points,
      reason: 'survey_complete',
      provider: net.id,
      providerTxnId: event.txnId,
      netRevenueUsd: event.netRevenueUsd,
      metadata: event.raw,
    })
    console.log(
      `surveys: ${event.txnId} $${event.netRevenueUsd} -> ${points}pts for ${event.userId}` +
        (duplicate ? ' (duplicate, ignored)' : credited ? '' : ' (not credited)'),
    )
    return net.ack()
  } catch (err) {
    /*
     * A 500 here is the right answer, not a swallowed error: the network reads
     * anything that is not its acknowledgement byte as "try again", which is
     * exactly what should happen if the database was briefly unreachable. The
     * unique index makes that retry safe.
     */
    console.error('surveys: postback failed', err)
    return new Response('retry', { status: 500 })
  }
}

const SCREENOUT_POINTS = 1
