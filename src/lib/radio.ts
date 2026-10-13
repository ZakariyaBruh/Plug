/*
 * KITCHEN RADIO — live stations to cook and eat to, free with an account.
 *
 * WHERE THE STATIONS COME FROM. Radio Browser (radio-browser.info), a free,
 * community-run directory of about fifty thousand internet radio stations
 * with a public JSON API and no key. Nothing here is a stream we host or
 * relay: this asks the directory for a list, and the reader's own browser
 * plays the station's stream straight from the station.
 *
 * WHAT A "FOOD CHANNEL" IS, HONESTLY. The directory has almost no food talk
 * radio — searched every way there is, "food" and "cooking" turn up one
 * station each, and "kitchen" turns up Kitchener, Ontario. What it does have
 * is plenty of stations made for the table: dinner lounges, dinner jazz,
 * restaurant and coffee-bar channels. And it has every country's radio,
 * which is the better idea anyway — cooking a curry with Bollywood on, or a
 * paella with flamenco. So two kinds of channel: made for the table, and
 * cook the world.
 *
 * Each channel is one or more directory searches, run when somebody opens
 * that channel and not before, so twelve channels cost the directory nothing
 * until they are listened to.
 */

export type Station = {
  id: string
  name: string
  url: string
  favicon: string
  homepage: string
  country: string
  tags: string[]
  codec: string
  bitrate: number
}

export type ChannelGroup = 'table' | 'world'

export type Channel = {
  id: string
  title: string
  emoji: string
  blurb: string
  group: ChannelGroup
  /** Directory searches, merged. Each is a set of /json/stations/search params. */
  queries: Record<string, string>[]
  /** Station names that match a search but are not what the channel means. */
  exclude?: RegExp
}

export const CHANNELS: Channel[] = [
  {
    id: 'dinner',
    title: 'Dinner party',
    emoji: '\u{1F377}',
    blurb: 'Dinner lounge, dinner jazz and restaurant channels — made to be on while people eat.',
    group: 'table',
    queries: [{ name: 'dinner' }, { name: 'restaurant' }],
  },
  {
    id: 'coffee',
    title: 'Coffee & brunch',
    emoji: '☕',
    blurb: 'Coffee-bar and café radio for slow mornings and long weekend brunches.',
    group: 'table',
    queries: [{ name: 'coffee' }, { name: 'cafe' }],
  },
  {
    id: 'jazz',
    title: 'Kitchen jazz',
    emoji: '\u{1F3B7}',
    blurb: 'Smooth jazz and bossa nova — the sound of somebody else doing the washing up.',
    group: 'table',
    queries: [{ tag: 'smooth jazz' }, { tag: 'bossa nova' }],
  },
  {
    id: 'italian',
    title: 'Italian',
    emoji: '\u{1F35D}',
    blurb: 'Cooking pasta? Italian radio — pop, canzoni and the old songs.',
    group: 'world',
    queries: [{ countrycode: 'IT', tag: 'italian' }, { countrycode: 'IT', tag: 'musica italiana' }],
  },
  {
    id: 'french',
    title: 'French',
    emoji: '\u{1F950}',
    blurb: 'Chanson for a slow braise or a Sunday tart.',
    group: 'world',
    queries: [{ tag: 'chansons françaises' }, { tag: 'french chansons' }, { tag: 'chanson française' }],
  },
  {
    id: 'spanish',
    title: 'Spanish',
    emoji: '\u{1F958}',
    blurb: 'Flamenco and rumba while the paella takes its time.',
    group: 'world',
    queries: [{ tag: 'flamenco' }, { tag: 'sevillanas' }, { countrycode: 'ES', tag: 'rumba' }],
  },
  {
    id: 'mexican',
    title: 'Mexican',
    emoji: '\u{1F32E}',
    blurb: 'Mariachi and ranchera for taco night.',
    group: 'world',
    queries: [{ tag: 'mariachi' }, { tag: 'ranchera' }],
  },
  {
    id: 'indian',
    title: 'Indian',
    emoji: '\u{1F35B}',
    blurb: 'Bollywood, old and new, for a curry that wants an hour.',
    group: 'world',
    queries: [{ tag: 'bollywood' }],
  },
  {
    id: 'japanese',
    title: 'Japanese',
    emoji: '\u{1F363}',
    blurb: 'City pop and J-pop while the rice steams.',
    group: 'world',
    queries: [{ tag: 'city pop' }, { countrycode: 'JP', tag: 'jpop' }, { countrycode: 'JP', tag: 'japanese' }],
  },
  {
    id: 'greek',
    title: 'Greek',
    emoji: '\u{1FAD2}',
    blurb: 'Greek radio for a table of mezze.',
    group: 'world',
    queries: [{ countrycode: 'GR', tag: 'greek' }, { tag: 'laika' }],
  },
  {
    id: 'middle-eastern',
    title: 'Middle Eastern',
    emoji: '\u{1F9C6}',
    blurb: 'Arabic music for falafel, shawarma and a long night of small plates.',
    group: 'world',
    queries: [{ tag: 'arabic music' }, { tag: 'arabic' }],
  },
  {
    id: 'caribbean',
    title: 'Caribbean & Latin',
    emoji: '\u{1F357}',
    blurb: 'Reggae and salsa for jerk chicken, plantain and anything off a grill.',
    group: 'world',
    queries: [{ tag: 'reggae' }, { tag: 'salsa' }, { tag: 'calypso' }, { tag: 'soca' }],
  },
]

export const CHANNEL_IDS = CHANNELS.map((c) => c.id)

/** The lineup without the searches — what the page needs to draw the chips. */
export function lineup() {
  return CHANNELS.map(({ id, title, emoji, blurb, group }) => ({ id, title, emoji, blurb, group }))
}

/*
 * WHICH SERVER. The directory runs a handful of mirrors and asks clients to
 * spread themselves across them rather than all hit one. Workers cannot do
 * the DNS lookup the directory suggests for finding them, so they are named
 * here and tried from a random starting point, falling through to the next
 * on any failure. de1 and de2 are the two that have answered reliably.
 */
const MIRRORS = ['https://de1.api.radio-browser.info', 'https://de2.api.radio-browser.info', 'https://fi1.api.radio-browser.info']
// The directory asks for a User-Agent that says who is calling.
const AGENT = 'morsels45/1.0 (+https://morsels45-app.whop.site)'
const TIMEOUT_MS = 6000
// Every mirror once and the first two again: a mirror answering 502 for a
// moment is common, and one retry clears most of it without letting a
// directory that is properly down hold a request for more than half a minute.
const ATTEMPTS = MIRRORS.length + 2

async function ask(path: string): Promise<unknown> {
  const start = Math.floor(Math.random() * MIRRORS.length)
  let lastError: unknown = null
  for (let i = 0; i < ATTEMPTS; i++) {
    const base = MIRRORS[(start + i) % MIRRORS.length]
    try {
      const res = await fetch(base + path, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': AGENT, Accept: 'application/json' },
      })
      if (res.ok) return await res.json()
      lastError = new Error(`${base} answered ${res.status}`)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError ?? new Error('radio: no mirror answered')
}

type Raw = {
  stationuuid?: string
  name?: string
  url_resolved?: string
  favicon?: string
  homepage?: string
  country?: string
  tags?: string
  codec?: string
  bitrate?: number
  hls?: number
  lastcheckok?: number
  votes?: number
}

/*
 * WHAT IS PLAYABLE HERE, which is narrower than what the directory lists.
 *
 * HTTPS only: this page is HTTPS, and a browser will not play an http://
 * stream inside it. HLS is out because only Safari plays it from a bare
 * <audio> tag — a station that works on an iPhone and silently does nothing
 * on every laptop is worse than one that is not listed. And the codecs are
 * the ones every current browser decodes.
 */
const PLAYABLE_CODECS = new Set(['MP3', 'AAC', 'AAC+', 'OGG'])

function playable(raw: Raw): raw is Required<Raw> {
  return (
    typeof raw.stationuuid === 'string' &&
    typeof raw.name === 'string' &&
    raw.name.trim() !== '' &&
    typeof raw.url_resolved === 'string' &&
    raw.url_resolved.startsWith('https://') &&
    !/\.m3u8(\?|$)/i.test(raw.url_resolved) &&
    raw.hls !== 1 &&
    raw.lastcheckok === 1 &&
    PLAYABLE_CODECS.has((raw.codec ?? '').toUpperCase())
  )
}

function toStation(raw: Required<Raw>): Station {
  return {
    id: raw.stationuuid,
    name: raw.name.trim().replace(/\s+/g, ' ').slice(0, 80),
    url: raw.url_resolved,
    // An http:// favicon is mixed content on this page; better the emoji.
    favicon: raw.favicon?.startsWith('https://') ? raw.favicon : '',
    homepage: raw.homepage?.startsWith('https://') || raw.homepage?.startsWith('http://') ? raw.homepage : '',
    country: raw.country ?? '',
    tags: (raw.tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 4),
    codec: raw.codec ?? '',
    bitrate: typeof raw.bitrate === 'number' ? raw.bitrate : 0,
  }
}

/*
 * The directory lists the same station many times over — once per stream
 * quality, once per person who added it — so "Dinner party" was three copies
 * of one lounge. One row per stream URL, and one per name once the "(AAC)"
 * style suffixes are taken off it.
 */
function nameKey(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]|\|.*$/g, '')
    .replace(/[^a-z0-9À-￿]+/g, ' ')
    .trim()
}

/*
 * Every channel promises something to cook to, and a phone-in about the
 * budget is not that. A Greek music search turned up a politics station and
 * a French one a conservative talk channel, both tagged with the language as
 * well as with what they actually are.
 */
const NOT_MUSIC = new Set(['news', 'talk', 'news talk', 'talk radio', 'sport', 'sports', 'politics', 'business', 'religion', 'catholic', 'christian'])

function talkStation(raw: Raw) {
  return (raw.tags ?? '')
    .split(',')
    .some((tag) => NOT_MUSIC.has(tag.trim().toLowerCase()))
}

export const PER_CHANNEL = 10
const SEARCH_LIMIT = 60

export async function searchChannel(channel: Channel): Promise<Station[]> {
  const lists = await Promise.all(
    channel.queries.map(async (query) => {
      const params = new URLSearchParams({
        ...query,
        // A tag search is a substring match unless told otherwise, so
        // "reggae" was also every reggaeton station and "rumba" a hip-hop
        // station in Kampala. Names stay substring: "dinner" is meant to find
        // "Dinner Lounge" and "80s80s DINNERPARTY" alike.
        ...(query.tag ? { tagExact: 'true' } : {}),
        hidebroken: 'true',
        is_https: 'true',
        order: 'votes',
        reverse: 'true',
        limit: String(SEARCH_LIMIT),
      })
      const found = await ask(`/json/stations/search?${params}`)
      return Array.isArray(found) ? (found as Raw[]) : []
    }),
  )

  const merged = lists
    .flat()
    .filter(playable)
    .filter((raw) => !channel.exclude?.test(raw.name))
    .filter((raw) => !talkStation(raw))
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))

  const seenUrl = new Set<string>()
  const seenName = new Set<string>()
  const out: Station[] = []
  for (const raw of merged) {
    const key = nameKey(raw.name)
    if (seenUrl.has(raw.url_resolved) || (key && seenName.has(key))) continue
    seenUrl.add(raw.url_resolved)
    if (key) seenName.add(key)
    out.push(toStation(raw))
    if (out.length >= PER_CHANNEL) break
  }
  return out
}

/*
 * Kept for six hours per worker. Station lists move on the scale of weeks,
 * and a channel opened by twenty people in an afternoon should be one
 * question to the directory, not twenty. A failed search is not kept, so the
 * next person to open the channel asks again.
 */
const TTL_MS = 6 * 60 * 60 * 1000
const memo = new Map<string, { at: number; stations: Promise<Station[]> }>()

export function stationsFor(channel: Channel): Promise<Station[]> {
  const hit = memo.get(channel.id)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.stations
  const stations = searchChannel(channel)
  memo.set(channel.id, { at: Date.now(), stations })
  stations.catch(() => memo.delete(channel.id))
  return stations
}

/*
 * THE ONE THING THE DIRECTORY ASKS IN RETURN: say when a station is played.
 * It is how the directory ranks stations for everybody else, and its terms
 * ask every client to do it. Sent from here rather than from the page, so
 * the directory learns which station was played and nothing at all about
 * who played it.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isStationId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}

export async function countPlay(stationId: string): Promise<void> {
  if (!isStationId(stationId)) return
  await ask(`/json/url/${encodeURIComponent(stationId)}`).catch(() => {})
}
