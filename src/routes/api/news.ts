import { createFileRoute } from '@tanstack/react-router'

import { AGENT, FEEDS, FEED_ACCEPT, type Story, parseFeed } from '#/lib/feed'

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
            // Fifteen minutes. Food writing does not move faster than that, and
            // the alternative is four publishers taking a request per reader.
            'Cache-Control': 'public, max-age=900',
          },
        })
      },
    },
  },
})
