import lineup from './tv-lineup.json'

/*
 * FOOD TV — free, live food channels with what's on, free with an account.
 *
 * THE CHANNELS come from iptv-org (github.com/iptv-org/iptv), the public
 * database of free-to-air and free ad-supported channels, and are chosen by
 * scripts/tv-lineup.mjs: food only, official streams only, and only the ones
 * a web player on this site can actually read — at most twelve. The reason
 * that is a script and not a request at runtime is written at the top of it.
 * Nothing here relays a stream; the viewer's browser plays it straight from
 * the channel's own servers.
 *
 * WHAT'S ON comes from where iptv-org/epg (the guide half of the same
 * project) says each channel publishes its listings — Plex's and Pluto TV's
 * public guide APIs, asked the same way that project's own site configs ask
 * them. One small request per channel, kept fifteen minutes.
 */

export type GuideSource = { site: 'plex.tv' | 'pluto.tv'; id: string }

export type TvChannel = {
  id: string
  name: string
  country: string
  website: string
  logo: string
  stream: string
  guide: GuideSource | null
}

export type Programme = { title: string; subtitle: string; start: number; stop: number }

export const TV_CHANNELS = lineup.channels as TvChannel[]
export const TV_GENERATED = lineup.generated

/*
 * THE LIST, CHECKED ON THE FLY.
 *
 * tv-lineup.json is the list as scripts/tv-lineup.mjs last verified it, with
 * the guide source for each channel — that part needs the 25 MB guide index
 * and stays a script. But which channels exist and where they stream from
 * changes week to week, so the candidate list is rebuilt here from iptv-org's
 * live cooking playlist (13 KB) every hour: verified channels first, each
 * with every stream address iptv-org currently lists for it, then any food
 * channel that has appeared since.
 *
 * And none of it is shown on trust. The page checks each candidate from the
 * viewer's own browser before listing it (see the TV section of app.js) —
 * which is the only check that can know about the viewer's country, network
 * and browser — and lists the first twelve that answer.
 */
const PLAYLIST = 'https://iptv-org.github.io/iptv/categories/cooking.m3u'
// Restreams of paid channels by bare IP or re-hosts, and hosts that only
// allow their own site (Pluto TV). Same list as scripts/tv-lineup.mjs.
const BLOCKED_HOST = /^\d+\.\d+\.\d+\.\d+$|freeott|mcquack|freem3u|techtraveleat|cinerama|skygo|tangotv|smartplaytv|onetv\.app|fasttvcdn|catcast|alpaca|mjunoon|pishow|bitred|uplink\.kz|jmp2\.uk|pluto\.tv/i
// Filed under cooking, but not food.
const NOT_FOOD = new Set(['Boligkjopiblinde.se', 'Boligkobiblinde.se', 'BuyingBlindDenmark.se', 'Skonneombygninger.se', 'StugfixarnaNorge.se'])
export const MAX_CANDIDATES = 20

export type Candidate = { id: string; name: string; logo: string; website: string; streams: string[]; hasGuide: boolean }

type Entry = { id: string; name: string; logo: string; url: string }

export function parsePlaylist(text: string): Entry[] {
  const out: Entry[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('#EXTINF')) continue
    const url = (lines[i + 1] ?? '').trim()
    const attr = (name: string) => new RegExp(`${name}="([^"]*)"`).exec(line)?.[1] ?? ''
    const group = attr('group-title')
    const label = line.slice(line.lastIndexOf(',') + 1)
    if (/geo-blocked/i.test(label) || /shop/i.test(group)) continue
    if (!url.startsWith('https://')) continue
    let host = ''
    try { host = new URL(url).hostname } catch { continue }
    if (BLOCKED_HOST.test(host)) continue
    const id = attr('tvg-id').split('@')[0]
    if (!id || NOT_FOOD.has(id)) continue
    const name = label.replace(/\s*\(\d+p\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim()
    out.push({ id, name: name || id, logo: attr('tvg-logo'), url })
  }
  return out
}

const PLAYLIST_TTL_MS = 60 * 60 * 1000
let playlistMemo: { at: number; entries: Promise<Entry[]> } | null = null

function liveEntries(): Promise<Entry[]> {
  if (playlistMemo && Date.now() - playlistMemo.at < PLAYLIST_TTL_MS) return playlistMemo.entries
  const entries = fetch(PLAYLIST, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'morsels45/1.0 (+https://morsels45-app.whop.site)' } })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`playlist ${r.status}`))))
    .then(parsePlaylist)
  const memo = { at: Date.now(), entries }
  playlistMemo = memo
  // A failed fetch is not kept, and the verified list still answers.
  entries.catch(() => { if (playlistMemo === memo) playlistMemo = null })
  return entries
}

export async function candidates(): Promise<Candidate[]> {
  const live = await liveEntries().catch((err) => {
    console.error('tv: live playlist unavailable, using the verified list alone', err)
    return [] as Entry[]
  })
  const byId = new Map<string, Entry[]>()
  for (const e of live) byId.set(e.id, [...(byId.get(e.id) ?? []), e])

  const out: Candidate[] = TV_CHANNELS.map((c) => ({
    id: c.id,
    name: c.name,
    logo: c.logo || byId.get(c.id)?.[0]?.logo || '',
    website: c.website,
    streams: [...new Set([c.stream, ...(byId.get(c.id) ?? []).map((e) => e.url)])],
    hasGuide: !!c.guide,
  }))
  for (const [id, entries] of byId) {
    if (out.some((c) => c.id === id)) continue
    out.push({ id, name: entries[0].name, logo: entries[0].logo.startsWith('https://') ? entries[0].logo : '', website: '', streams: [...new Set(entries.map((e) => e.url))], hasGuide: false })
  }
  return out.slice(0, MAX_CANDIDATES)
}

/** What a signed-out visitor sees: the names, not the streams. */
export function tvTeaser() {
  return TV_CHANNELS.map(({ id, name, logo }) => ({ id, name, logo }))
}

const AGENT = 'morsels45/1.0 (+https://morsels45-app.whop.site)'
const TIMEOUT_MS = 8000
const HOUR = 3600 * 1000
// How far ahead the page is told about: enough for "on later tonight"
// without shipping a day of listings nobody scrolls to.
const AHEAD_MS = 8 * HOUR
const MAX_PROGRAMMES = 8

async function plexDay(id: string, day: Date): Promise<Programme[]> {
  const date = day.toISOString().slice(0, 10)
  const res = await fetch(`https://epg.provider.plex.tv/grid?channelGridKey=${encodeURIComponent(id)}&date=${date}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'x-plex-provider-version': '7.2', Accept: 'application/json', 'User-Agent': AGENT },
  })
  if (!res.ok) throw new Error(`plex ${res.status}`)
  const data = (await res.json()) as {
    MediaContainer?: {
      Metadata?: { title?: string; grandparentTitle?: string; Media?: { beginsAt?: number; endsAt?: number }[] }[]
    }
  }
  const out: Programme[] = []
  for (const item of data.MediaContainer?.Metadata ?? []) {
    const show = item.grandparentTitle || item.title || ''
    // Plex often repeats the show in the episode: "Rick Stein's Far Eastern
    // Odyssey - Episode 3" under "Rick Stein's Far Eastern Odyssey".
    let episode = item.grandparentTitle && item.title !== item.grandparentTitle ? item.title ?? '' : ''
    if (episode.startsWith(show)) episode = episode.slice(show.length).replace(/^[\s:–—-]+/, '')
    // One listing can air several times in a day, each a Media entry.
    for (const media of item.Media ?? []) {
      if (!media.beginsAt || !media.endsAt || !show) continue
      out.push({ title: show, subtitle: episode, start: media.beginsAt * 1000, stop: media.endsAt * 1000 })
    }
  }
  return out
}

async function plexGuide(id: string, now: number): Promise<Programme[]> {
  const today = await plexDay(id, new Date(now))
  const reaches = today.reduce((latest, p) => Math.max(latest, p.stop), 0)
  // Plex lists by UTC day, so late in the evening "tonight" is tomorrow's grid.
  if (reaches < now + AHEAD_MS) {
    const tomorrow = await plexDay(id, new Date(now + 24 * HOUR)).catch(() => [])
    return today.concat(tomorrow)
  }
  return today
}

async function plutoGuide(id: string, now: number): Promise<Programme[]> {
  const start = new Date(now - 3 * HOUR).toISOString()
  const stop = new Date(now + AHEAD_MS).toISOString()
  const res = await fetch(`https://api.pluto.tv/v2/channels/${encodeURIComponent(id)}?start=${start}&stop=${stop}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json', 'User-Agent': AGENT },
  })
  if (!res.ok) throw new Error(`pluto ${res.status}`)
  const data = (await res.json()) as {
    timelines?: { title?: string; start?: string; stop?: string; episode?: { name?: string } }[]
  }
  return (data.timelines ?? [])
    .map((t) => ({
      title: t.title ?? '',
      subtitle: t.episode?.name && t.episode.name !== t.title ? t.episode.name : '',
      start: Date.parse(t.start ?? ''),
      stop: Date.parse(t.stop ?? ''),
    }))
    .filter((p) => p.title && Number.isFinite(p.start) && Number.isFinite(p.stop))
}

/*
 * Now and what follows, in order, one row per showing. Back-to-back episodes
 * of the same show are kept apart — "Rick Stein, Rick Stein, Rick Stein" is
 * what is actually on, and folding them would make the next thing look
 * sooner than it is.
 */
function upcoming(all: Programme[], now: number): Programme[] {
  const seen = new Set<number>()
  return all
    .filter((p) => p.stop > now && p.start < now + AHEAD_MS && p.stop > p.start)
    .sort((a, b) => a.start - b.start)
    .filter((p) => (seen.has(p.start) ? false : (seen.add(p.start), true)))
    .slice(0, MAX_PROGRAMMES)
}

const TTL_MS = 15 * 60 * 1000
const memo = new Map<string, { at: number; programmes: Promise<Programme[]> }>()

function guideFor(channel: TvChannel, now: number): Promise<Programme[]> {
  if (!channel.guide) return Promise.resolve([])
  const hit = memo.get(channel.id)
  if (hit && now - hit.at < TTL_MS) return hit.programmes
  const source = channel.guide
  const programmes = source.site === 'plex.tv' ? plexGuide(source.id, now) : plutoGuide(source.id, now)
  memo.set(channel.id, { at: now, programmes })
  programmes.catch(() => memo.delete(channel.id))
  return programmes
}

/** Every channel's listings that could be had, by channel id. A guide that
 * fails is simply absent; the channel still plays. */
export async function whatsOn(): Promise<Record<string, Programme[]>> {
  const now = Date.now()
  const entries = await Promise.all(
    TV_CHANNELS.filter((c) => c.guide).map(async (channel) => {
      try {
        return [channel.id, upcoming(await guideFor(channel, now), now)] as const
      } catch (err) {
        console.error(`tv: no guide for ${channel.id}`, err)
        return [channel.id, []] as const
      }
    }),
  )
  return Object.fromEntries(entries.filter(([, list]) => list.length))
}
