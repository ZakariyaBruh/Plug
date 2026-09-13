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

/*
 * HOW MANY STORIES, AND WHOSE.
 *
 * PER_SOURCE exists because a straight "newest 40 across everything" quietly
 * deletes the quiet publishers. Smitten Kitchen posts every week or two and
 * The Kitchn posts all day; merged and sorted by date, The Kitchn filled a
 * third of the list and Smitten Kitchen appeared exactly never — it had been
 * added, fetched, parsed and thrown away, and the only sign was a chip that
 * was not there.
 *
 * So each publisher's newest few are taken first, and only then is the lot
 * sorted by date. Everybody who filed today is on the page, the newest still
 * lead it, and a publisher having a busy afternoon cannot crowd the rest out.
 */
const PER_SOURCE = 8
const KEEP = 60
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
        // One slow publisher must not hold up the rest, and one broken one
        // must not empty the page: each feed is settled on its own.
        const lists = await Promise.all(FEEDS.map((feed) => readFeed(feed).catch(() => [])))
        const stories = lists
          // Each publisher's own newest first, so a prolific one cannot push a
          // quiet one off the page entirely.
          .map((list) =>
            list
              .slice()
              .sort((a, b) => (b.published ?? 0) - (a.published ?? 0))
              .slice(0, PER_SOURCE),
          )
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
