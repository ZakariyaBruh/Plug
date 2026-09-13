/*
 * Feed reading, kept apart from the route that serves it.
 *
 * This file is pure: XML in, stories out, no fetching. That is the point —
 * the parsing is the part that can be wrong in a hundred small ways (Atom
 * puts the link in an attribute, RSS puts it in the element; dates come in
 * four different tags; summaries are HTML) and the only way to know it is
 * right is to run it over what the publishers actually send. tools/feed-check.mjs
 * does exactly that against the live feeds.
 *
 * NOTHING HERE IS TRUSTED. Everything arriving is written by somebody else:
 * titles, summaries, links. Tags are stripped, entities decoded, the result
 * handed back as data to be rendered with textContent at the other end, and a
 * link that is not plain http(s) is dropped rather than turned into something
 * a reader can tap.
 */

/**
 * Who gets read. Four publishers, deliberately unalike: a newspaper's food
 * desk, a restaurant title, a paper of record, and a baking blog — so the
 * page is not four versions of the same restaurant opening.
 */
/*
 * Every one of these was fetched with this app's own User-Agent and Accept
 * headers before it went in, and only the ones that answered 200 with real
 * items are here. Several obvious candidates are missing on purpose and it is
 * worth writing down which, so nobody spends an afternoon rediscovering it:
 *
 *   Serious Eats      402 on every path tried
 *   Simply Recipes     402
 *   Epicurious         404 — the old services/rss path is gone
 *   Food52             429, rate limited even on a first request
 *   BBC Good Food      301 to something that is not a feed
 *   Bon Appétit        200, and exactly one item in it
 *
 * Note smittenkitchen.com/feed has no trailing slash: with one it answers 302
 * and the redirect is not followed here.
 */
export const FEEDS = [
  { source: 'The Guardian', url: 'https://www.theguardian.com/food/rss' },
  { source: 'Guardian Restaurants', url: 'https://www.theguardian.com/food/restaurants/rss' },
  { source: 'Eater', url: 'https://www.eater.com/rss/index.xml' },
  { source: 'NYT Dining', url: 'https://rss.nytimes.com/services/xml/rss/nyt/DiningandWine.xml' },
  { source: 'King Arthur Baking', url: 'https://www.kingarthurbaking.com/blog/feed' },
  { source: 'The Kitchn', url: 'https://www.thekitchn.com/main.rss' },
  { source: 'Smitten Kitchen', url: 'https://smittenkitchen.com/feed' },
  { source: 'Saveur', url: 'https://www.saveur.com/feed/' },
]

/*
 * Say who is asking. A worker sends no User-Agent at all by default, and
 * several publishers answer a request without one with a 406 — the Guardian
 * does, which is how three of four feeds came back empty the first time.
 */
export const AGENT = 'morsels45/1.0 (+https://morsels45-app.whop.site)'

export const FEED_ACCEPT =
  'application/rss+xml, application/atom+xml, application/xml, text/xml'

export type Story = {
  title: string
  link: string
  source: string
  published: number | null
  summary: string
}

/** How many stories to take from any one publisher, so nobody drowns the rest. */
export const PER_FEED = 12

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…',
  mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
}

export function decode(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[String(name).toLowerCase()] ?? whole)
}

// Feed summaries are HTML. This is a reader, not a browser: the markup goes and
// the sentence stays.
export function plain(html: string): string {
  return decode(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? m[1] : ''
}

// RSS puts the URL inside <link>; Atom puts it in an attribute, sometimes on
// several <link>s of which only one is the article. Atom's <link/> is empty, so
// the text-content reading has to be ignored when it comes back blank.
function linkOf(block: string): string {
  const plainLink = plain(tag(block, 'link'))
  if (plainLink) return plainLink
  const alt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
  if (alt) return decode(alt[1])
  const any = block.match(/<link[^>]*href=["']([^"']+)["']/i)
  return any ? decode(any[1]) : ''
}

function when(block: string): number | null {
  for (const name of ['pubDate', 'published', 'updated', 'dc:date']) {
    const raw = plain(tag(block, name))
    if (!raw) continue
    const at = Date.parse(raw)
    if (!Number.isNaN(at)) return at
  }
  return null
}

// A summary cut at exactly 300 characters ends mid-word, which reads as a bug
// rather than as a standfirst. Cut back to the last space and say so.
function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:—–-]+$/, '') + '…'
}

export function parseFeed(xml: string, source: string): Story[] {
  const blocks = xml.match(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi) ?? []
  const stories: Story[] = []

  for (const block of blocks.slice(0, PER_FEED)) {
    const title = plain(tag(block, 'title'))
    const link = linkOf(block)
    // A link that is not a plain web address has no business being turned into
    // something somebody can tap.
    if (!title || !/^https?:\/\//i.test(link)) continue
    const summary = plain(
      tag(block, 'description') || tag(block, 'summary') || tag(block, 'content'),
    )
    stories.push({
      title: clip(title, 200),
      link,
      source,
      published: when(block),
      summary: clip(summary, 300),
    })
  }
  return stories
}
