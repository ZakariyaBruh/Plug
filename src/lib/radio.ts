/*
 * FOOD RADIO — live stations made for the kitchen and the table, free with
 * an account.
 *
 * WHERE THE STATIONS COME FROM. Radio Browser (radio-browser.info), a free,
 * community-run directory of about fifty thousand internet radio stations
 * with a public JSON API and no key. Nothing here is a stream we host or
 * relay: this asks the directory for a list, and the listener's own browser
 * plays the station's stream straight from the station.
 *
 * FOOD ONLY, AND NEVER MORE THAN TWELVE. The first version had twelve
 * channels of ten stations each, half of them a country's pop radio to cook
 * that country's food to — a hundred and twenty rows, most of them not about
 * food at all. A list that long is a list nobody chooses from. So: one list,
 * at most twelve, and every station on it named for eating — dinner
 * lounges, restaurant and coffee-bar channels, a barbecue station, a tapas
 * bar's. The directory has almost no food talk radio (searched every way
 * there is, "cooking" finds one station and "kitchen" finds Kitchener,
 * Ontario), so these are stations made to have on while you cook and eat.
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
  /** What it is named for, as a dish: shown when the station has no logo. */
  emoji: string
}

/*
 * One directory search per kind of eating, taken in turn so the twelve are a
 * spread — a couple of dinner lounges, a couple of coffee bars, the barbecue
 * one — rather than whichever word happens to have the most stations.
 */
const FOOD_SEARCHES: { name: string; emoji: string }[] = [
  { name: 'dinner', emoji: '\u{1F377}' },
  { name: 'restaurant', emoji: '\u{1F37D}\uFE0F' },
  { name: 'coffee', emoji: '\u2615' },
  { name: 'food', emoji: '\u{1F372}' },
  { name: 'bbq', emoji: '\u{1F525}' },
  { name: 'tapas', emoji: '\u{1FAD2}' },
  { name: 'brunch', emoji: '\u{1F95E}' },
  { name: 'kitchen', emoji: '\u{1F373}' },
  { name: 'cooking', emoji: '\u{1F373}' },
  { name: 'chef', emoji: '\u{1F9D1}\u200D\u{1F373}' },
  { name: 'gourmet', emoji: '\u{1F37D}\uFE0F' },
  { name: 'bistro', emoji: '\u{1F37D}\uFE0F' },
]

/*
 * The directory's name search is a substring match, which is how "chef"
 * finds Nostalgie Rochefort and "kitchen" finds every station in Kitchener.
 * So each name is checked again for the word itself, on its own.
 */
const FOOD_WORD = /\b(dinner\w*|restaurant\w*|coffee\w*|food|bbq|tapas|brunch|kitchen|cooking|chef|gourmet|bistro)\b/i

/*
 * Checked against the name itself, not the genre list a lot of stations pad
 * it with after a bar: "0R - HOTEL LOUNGE || Chill, Jazz, Sax, Dinner" is a
 * hotel lounge. And not "breakfast" or "lunch" at all — in radio those are
 * the morning and midday shows, so "Breakfast Radio" is a DJ, not a meal.
 * "Pizza" went for the same reason: the station that has it is a college
 * station that happens to be called Pizza FM.
 */
function namedForFood(name: string) {
  return FOOD_WORD.test(name.split('|')[0])
}

export const MAX_STATIONS = 12
// One from any one broadcaster. Three German stream networks each run a
// dinner lounge, a restaurant lounge and a coffee lounge, and at two apiece
// they were half the list.
const PER_HOST = 1

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

function toStation(raw: Required<Raw>, emoji: string): Station {
  return {
    id: raw.stationuuid,
    // "0R - RESTAURANT LOUNGE || Lounge, Jazz, Chill, Soft" and "90s90s
    // Dinnerparty | aac 64k": the name is the part before the bar, and the
    // rest is a genre list or a bitrate that the row already shows.
    name: (raw.name.split('|')[0].trim() || raw.name.trim()).replace(/\s+/g, ' ').slice(0, 80),
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
    emoji,
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

const SEARCH_LIMIT = 40

async function search(name: string): Promise<Raw[]> {
  const params = new URLSearchParams({
    name,
    hidebroken: 'true',
    is_https: 'true',
    order: 'votes',
    reverse: 'true',
    limit: String(SEARCH_LIMIT),
  })
  const found = await ask(`/json/stations/search?${params}`)
  return Array.isArray(found) ? (found as Raw[]) : []
}

export async function searchFoodStations(): Promise<Station[]> {
  const settled = await Promise.allSettled(FOOD_SEARCHES.map((s) => search(s.name)))
  // Some searches failing is a thinner list; all of them failing is the
  // directory being down, and that is an error rather than an empty radio.
  if (settled.every((r) => r.status === 'rejected')) throw new Error('radio: every search failed')

  const pools = settled.map((r, i) => ({
    emoji: FOOD_SEARCHES[i].emoji,
    stations: (r.status === 'fulfilled' ? r.value : [])
      .filter(playable)
      .filter((raw) => namedForFood(raw.name) && !talkStation(raw))
      .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)),
  }))

  const seenUrl = new Set<string>()
  const seenName = new Set<string>()
  const perHost = new Map<string, number>()
  const out: Station[] = []
  // Round robin: the best of each search, then the next best of each.
  for (let progress = true; progress && out.length < MAX_STATIONS; ) {
    progress = false
    for (const pool of pools) {
      if (out.length >= MAX_STATIONS) break
      while (pool.stations.length) {
        const raw = pool.stations.shift()!
        const key = nameKey(raw.name)
        let host = ''
        try { host = new URL(raw.url_resolved).hostname } catch {}
        if (seenUrl.has(raw.url_resolved) || (key && seenName.has(key))) continue
        if ((perHost.get(host) ?? 0) >= PER_HOST) continue
        seenUrl.add(raw.url_resolved)
        if (key) seenName.add(key)
        perHost.set(host, (perHost.get(host) ?? 0) + 1)
        out.push(toStation(raw, pool.emoji))
        progress = true
        break
      }
    }
  }
  return out
}

/*
 * Kept for six hours per worker. Station lists move on the scale of weeks,
 * and twenty people opening the radio in an afternoon should be one round of
 * questions to the directory, not twenty. A failed round is not kept, so the
 * next person to open it asks again.
 */
const TTL_MS = 6 * 60 * 60 * 1000
let memo: { at: number; stations: Promise<Station[]> } | null = null

export function foodStations(): Promise<Station[]> {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.stations
  const stations = searchFoodStations()
  const entry = { at: Date.now(), stations }
  memo = entry
  stations.catch(() => { if (memo === entry) memo = null })
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
