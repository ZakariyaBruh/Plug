/*
 * scripts/tv-lineup.mjs — builds the food TV lineup from iptv-org.
 *
 *   bun scripts/tv-lineup.mjs            check and print, write nothing
 *   bun scripts/tv-lineup.mjs --write    and write src/lib/tv-lineup.json
 *
 * WHY A SCRIPT AND NOT A REQUEST AT RUNTIME. The lineup comes from iptv-org's
 * public database (github.com/iptv-org/iptv, published at iptv-org.github.io/
 * api), and the files that say which channel streams where and which guide
 * lists it are 4 MB and 25 MB of JSON. That is not something a worker should
 * download and parse to answer one person opening a tab. And the database
 * lists what exists, not what will play here: most of it cannot. So this does
 * the slow part — download, filter, actually try every stream — once, and the
 * site serves the dozen that passed. Run it again when a channel stops
 * playing; the What's-on guide is the only part fetched live (lib/tv.ts).
 *
 * WHAT HAS TO BE TRUE FOR A CHANNEL TO GET IN:
 *
 *   Food. iptv-org's "cooking" category, minus the shopping channels and the
 *   handful of house-renovation shows filed under it by mistake.
 *
 *   Official and free. Plenty of the category is somebody rebroadcasting a
 *   paid channel from a bare IP address. Those are out, by host.
 *
 *   Playable from this site. HTTPS, not marked geo-blocked, and every step
 *   of the stream — the playlist, the quality it points at, the first video
 *   segment — answering a request from this site's origin with CORS that
 *   allows it. Without that a web player cannot read the stream at all. This
 *   is what rules out every Pluto TV channel: their streams only allow
 *   pluto.tv.
 *
 *   At most twelve. A list of a hundred channels is a list nobody chooses
 *   from. English first, then the rest, and channels with a working guide
 *   ahead of channels without.
 *
 * THE GUIDE. iptv-org/epg is the companion project that knows where each
 * channel's listings are published. Only the sources that answer one small
 * request per channel are used (Plex and Pluto TV, the same requests its own
 * site configs make); the rest want whole-country XML files that are no job
 * for a worker. A guide is only kept if it lists something on right now.
 */
import { writeFileSync } from 'node:fs'

const API = 'https://iptv-org.github.io/api'
const ORIGIN = 'https://morsels45-app.whop.site'
const OUT = new URL('../src/lib/tv-lineup.json', import.meta.url)
const MAX = 12
const WRITE = process.argv.includes('--write')

// Restreams of paid channels, and hosts that only allow their own site.
const BLOCKED_HOST = /^(\d+\.\d+\.\d+\.\d+|.*(freeott|mcquack|freem3u|techtraveleat|cinerama|skygo|tangotv|smartplaytv|onetv\.app|fasttvcdn|catcast|alpaca|mjunoon|pishow|bitred|uplink\.kz|jmp2\.uk|pluto\.tv))/i
// Filed under cooking, but not food.
const NOT_FOOD = new Set(['Boligkjopiblinde.se', 'Boligkobiblinde.se', 'BuyingBlindDenmark.se', 'Skonneombygninger.se', 'StugfixarnaNorge.se'])
const ENGLISH = new Set(['US', 'UK', 'GB', 'CA', 'AU', 'IE', 'NZ'])
const GUIDE_SITES = ['plex.tv', 'pluto.tv']
// The database's spelling, which is sometimes the channel's logo text.
const DISPLAY_NAME = { 'bonappetit.us': 'Bon Appétit' }

async function json(name) {
  const res = await fetch(`${API}/${name}.json`)
  if (!res.ok) throw new Error(`${name}.json answered ${res.status}`)
  return res.json()
}

function corsOk(res) {
  const allow = res.headers.get('access-control-allow-origin')
  return allow === '*' || allow === ORIGIN
}

async function get(url) {
  return fetch(url, { headers: { Origin: ORIGIN }, signal: AbortSignal.timeout(15000), redirect: 'follow' })
}

function firstUri(text) {
  return text.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#'))
}

/* The playlist, the variant it points at, and one segment, all with CORS. */
async function playable(url) {
  try {
    const master = await get(url)
    if (!master.ok || !corsOk(master)) return `playlist ${master.status}, cors ${master.headers.get('access-control-allow-origin')}`
    let text = await master.text()
    if (!text.startsWith('#EXTM3U')) return 'not a playlist'
    let base = master.url
    if (!text.includes('#EXTINF')) {
      const variantUrl = new URL(firstUri(text) ?? '', base).href
      const variant = await get(variantUrl)
      if (!variant.ok || !corsOk(variant)) return `variant ${variant.status}`
      text = await variant.text()
      base = variant.url
    }
    const segUrl = firstUri(text)
    if (!segUrl) return 'no segments'
    const seg = await get(new URL(segUrl, base).href)
    if (!seg.ok || !corsOk(seg)) return `segment ${seg.status}`
    await seg.arrayBuffer()
    return null
  } catch (err) {
    return String(err?.message ?? err).slice(0, 60)
  }
}

async function guideNow(guide) {
  const now = Date.now()
  try {
    if (guide.site === 'pluto.tv') {
      const start = new Date(now - 3 * 3600e3).toISOString()
      const stop = new Date(now + 3 * 3600e3).toISOString()
      const res = await fetch(`https://api.pluto.tv/v2/channels/${guide.id}?start=${start}&stop=${stop}`)
      const data = await res.json()
      return (data.timelines ?? []).find((t) => Date.parse(t.start) <= now && Date.parse(t.stop) > now)?.title ?? null
    }
    if (guide.site === 'plex.tv') {
      const date = new Date(now).toISOString().slice(0, 10)
      const res = await fetch(`https://epg.provider.plex.tv/grid?channelGridKey=${guide.id}&date=${date}`, {
        headers: { 'x-plex-provider-version': '7.2', Accept: 'application/json' },
      })
      const data = await res.json()
      for (const item of data?.MediaContainer?.Metadata ?? []) {
        for (const media of item.Media ?? []) {
          if (media.beginsAt * 1000 <= now && media.endsAt * 1000 > now) return item.grandparentTitle || item.title
        }
      }
    }
  } catch {}
  return null
}

const [channels, streams, guides, logos] = await Promise.all(['channels', 'streams', 'guides', 'logos'].map(json))
const streamsOf = Map.groupBy(streams, (s) => s.channel)
const guidesOf = Map.groupBy(guides, (g) => g.channel)
const logosOf = Map.groupBy(logos, (l) => l.channel)

const food = channels.filter(
  (c) => (c.categories ?? []).includes('cooking') && !(c.categories ?? []).includes('shop') && !NOT_FOOD.has(c.id) && !c.is_nsfw,
)
console.log(`${food.length} channels in iptv-org's cooking category`)

const passed = []
for (const channel of food) {
  const candidates = (streamsOf.get(channel.id) ?? []).filter((s) => {
    if (!s.url.startsWith('https://')) return false
    if (BLOCKED_HOST.test(new URL(s.url).hostname)) return false
    if ((s.labels ?? []).some((l) => /geo-blocked/i.test(l))) return false
    // A stream that needs a spoofed referrer or user agent cannot be played
    // honestly from a browser on this site.
    return !s.referrer && !s.user_agent
  })
  if (!candidates.length) continue

  let stream = null
  for (const candidate of candidates) {
    const why = await playable(candidate.url)
    if (!why) { stream = candidate; break }
    console.log(`  ✗ ${channel.id}: ${why} — ${candidate.url.slice(0, 70)}`)
  }
  if (!stream) continue

  let guide = null
  for (const g of (guidesOf.get(channel.id) ?? []).filter((g) => GUIDE_SITES.includes(g.site))) {
    const candidate = { site: g.site, id: g.site_id }
    const on = await guideNow(candidate)
    if (on) { guide = candidate; console.log(`  ✓ ${channel.id} guide ${g.site}: now "${on}"`); break }
  }

  const logo = (logosOf.get(channel.id) ?? [])
    .filter((l) => l.url.startsWith('https://') && !l.feed)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? ''

  passed.push({
    id: channel.id,
    name: DISPLAY_NAME[channel.id] ?? channel.name,
    country: channel.country,
    website: channel.website ?? '',
    logo,
    stream: stream.url,
    guide,
  })
  console.log(`  ✓ ${channel.id} plays: ${stream.url.slice(0, 70)}`)
}

const rank = (c) => (ENGLISH.has(c.country) ? 0 : 2) + (c.guide ? 0 : 1)
passed.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
const lineup = passed.slice(0, MAX)

console.log(`\n${passed.length} playable, keeping ${lineup.length}:`)
for (const c of lineup) console.log(`  ${c.name} (${c.country})${c.guide ? ` — guide: ${c.guide.site}` : ''}`)

if (WRITE) {
  const body = { generated: new Date().toISOString().slice(0, 10), source: 'iptv-org', channels: lineup }
  writeFileSync(OUT, JSON.stringify(body, null, 2) + '\n')
  console.log(`\nwrote ${OUT.pathname}`)
}
