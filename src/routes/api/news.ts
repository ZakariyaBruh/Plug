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

/*
 * KEEP is a ceiling on the response, not a page length. The reader is shown a
 * batch at a time (see NEWS_PAGE in the game) and reads on from there, so what
 * comes back here is the whole pile rather than a first screenful — seven
 * publishers currently file well under this between them, and it exists so a
 * publisher with a thousand-item feed cannot turn one response into a
 * megabyte.
 */
const KEEP = 160
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

const byNewest = (a: Story, b: Story) => (b.published ?? 0) - (a.published ?? 0)

/*
 * The whole pile, ordered so that any window into it is fair.
 *
 * PER_SOURCE used to be a cut: each publisher's newest eight, merged, sorted,
 * truncated to KEEP, and everything past that thrown away. That was fine while
 * the page was one long list. It stops being fine the moment the page is read
 * in batches — "something else to read" can only mean something if there is
 * something else, and what was left on the floor was roughly a third of what
 * seven publishers had filed.
 *
 * So the same fairness, as an ORDER rather than a limit. Round one is every
 * publisher's newest eight, sorted by date among themselves — which is exactly
 * the list the page used to show, unchanged. Round two is everybody's next
 * eight, and so on until the feeds are empty. Read a window of any size from
 * anywhere in the result and it is drawn from as many publishers as had
 * anything to give at that depth, newest first within the round; a publisher
 * having a busy afternoon still cannot crowd the rest out.
 */
function inRounds(lists: Story[][]): Story[] {
  const sorted = lists.map((list) => list.slice().sort(byNewest))
  const deepest = sorted.reduce((most, list) => Math.max(most, list.length), 0)
  const out: Story[] = []
  for (let at = 0; at < deepest; at += PER_SOURCE) {
    const round = sorted.map((list) => list.slice(at, at + PER_SOURCE)).flat()
    round.sort(byNewest)
    out.push(...round)
  }
  return out
}

export const Route = createFileRoute('/api/news')({
  server: {
    handlers: {
      GET: async () => {
        // One slow publisher must not hold up the rest, and one broken one
        // must not empty the page: each feed is settled on its own.
        const lists = await Promise.all(FEEDS.map((feed) => readFeed(feed).catch(() => [])))
        const stories = inRounds(lists).slice(0, KEEP)

        return new Response(JSON.stringify({ stories }), {
          headers: {
            'Content-Type': 'application/json',
            // Fifteen minutes. Food writing does not move faster than that, and
            // the alternative is seven publishers taking a request per reader.
            'Cache-Control': 'public, max-age=900',
          },
        })
      },
    },
  },
})
