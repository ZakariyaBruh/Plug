import { createFileRoute } from '@tanstack/react-router'

import { AGENT, FEEDS, FEED_ACCEPT, type Story, parseFeed } from '#/lib/feed'
import { COST, FREE_PER_DAY, charge } from '#/lib/credits'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'
import { checkProductAccess } from '#/lib/session'

/*
 * /api/news — food writing from a handful of public feeds, merged.
 *
 * WHY THIS IS A ROUTE AND NOT A FETCH FROM THE PAGE. An RSS feed lives on
 * somebody else's origin and sends no CORS headers, so a browser cannot read
 * one directly however hard it tries. Fetching them here is not a workaround,
 * it is the only way — and it has the side benefit that four publishers get
 * one request from this worker rather than one from every reader.
 *
 * The parsing lives in lib/feed.ts so it can be run over what the publishers
 * actually send: `bun tools/feed-check.mjs`.
 *
 * METERED NOW, AND WORTH SAYING WHAT THAT COSTS. This was the one screen with
 * a reason to be free, and it was cheap to serve precisely because the answer
 * was identical for everybody: one shared fifteen-minute cache stood between
 * four publishers and every reader. Charging per reader means the answer is
 * per reader, so that cache goes — each load is now a real fetch of four feeds
 * and two round trips to Whop to find out who is asking.
 *
 * The allowance is therefore set high on purpose. It exists to make the tab
 * consistent with the rest of the app, not to be a place anybody actually runs
 * out: a reader who opens the news a few times a day should never see it.
 * FREE_PER_DAY.news is the dial, and turning it up costs nothing but cache.
 */

const KEEP = 40
const FEED_TIMEOUT_MS = 10000

async function readFeed(feed: (typeof FEEDS)[number]): Promise<Story[]> {
  const res = await fetch(feed.url, {
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    headers: { 'User-Agent': AGENT, Accept: FEED_ACCEPT },
  }).catch((err: unknown) => {
    // Named, because a feed that quietly returns nothing looks identical to a
    // feed with no stories in it, and the two need different fixing.
    console.error(`news: ${feed.source} did not answer`, err)
    return null
  })
  if (!res) return []
  if (!res.ok) {
    console.error(`news: ${feed.source} answered ${res.status}`)
    return []
  }
  const xml = await res.text().catch(() => '')
  const stories = xml ? parseFeed(xml, feed.source) : []
  if (!stories.length) console.error(`news: ${feed.source} parsed to nothing`)
  return stories
}

export const Route = createFileRoute('/api/news')({
  server: {
    handlers: {
      GET: async () => {
        const { signedIn, hasAccess, user } = await checkProductAccess(PREMIUM_PRODUCT_ID)

        // Premium reads for free, and so does a stranger — there is no durable
        // way to count an anonymous reader, and half-counting one is worse
        // than not charging them. Metering starts at sign-in.
        if (signedIn && user && !hasAccess) {
          const charged = await charge(user.sub, 'news').catch((err: unknown) => {
            // Same rule as the chat: an unreachable ledger must not be able to
            // take a working screen away.
            console.error('news: could not charge credits', err)
            return null
          })
          if (charged && !charged.ok) {
            return json(
              {
                error: 'no_credits',
                balance: charged.balance,
                cost: COST.news,
                freePerDay: FREE_PER_DAY.news,
              },
              402,
            )
          }
        }

        // One slow publisher must not hold up the other three, and one broken
        // one must not empty the page: each feed is settled on its own.
        const lists = await Promise.all(FEEDS.map((feed) => readFeed(feed).catch(() => [])))
        const stories = lists
          .flat()
          .sort((a, b) => (b.published ?? 0) - (a.published ?? 0))
          .slice(0, KEEP)

        return new Response(JSON.stringify({ stories }), {
          headers: {
            'Content-Type': 'application/json',
            /*
             * private, not public, and this is the cost of metering.
             *
             * A shared cache in front of a response that depends on who asked
             * would hand one reader's allowance to the next reader through it.
             * The fifteen minutes still holds in the reader's own browser,
             * which is where a repeat load within the window now gets served
             * from — and a load served from there is one the allowance is
             * never charged for.
             */
            'Cache-Control': 'private, max-age=900',
          },
        })
      },
    },
  },
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
