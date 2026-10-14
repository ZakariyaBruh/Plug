/*
 * READING A RECIPE OFF SOMEBODY ELSE'S PAGE.
 *
 * Nearly every recipe site publishes the recipe as schema.org/Recipe JSON-LD
 * for Google's benefit — the ingredients and the method as clean data, with
 * none of the life story, pop-ups or adverts around it. So that is what is
 * read, and nothing else: no scraping of the visible page, no guessing at
 * which list is the ingredients. A page without it is answered honestly
 * ("this page doesn't publish its recipe in a form we can read").
 *
 * The fetch is the dangerous part, so it is fenced: http(s) only, ordinary
 * ports, no addresses that point back inside a network, redirects followed by
 * hand and checked again at every hop, and a size cap on what is read.
 */

const MAX_BYTES = 3 * 1024 * 1024
const MAX_HOPS = 4
const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[.*\])$/i

export function safeUrl(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.port && url.port !== '80' && url.port !== '443') return null
  if (url.username || url.password) return null
  if (PRIVATE_HOST.test(url.hostname) || !url.hostname.includes('.')) return null
  return url
}

export async function fetchPage(start: URL): Promise<{ html: string; url: string } | { error: string }> {
  let url = start
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    let res: Response
    try {
      res = await fetch(url.href, {
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; morsels45 recipe import; +https://morsels45-app.whop.site)',
          Accept: 'text/html,application/xhtml+xml',
        },
      })
    } catch {
      return { error: 'unreachable' }
    }
    if (res.status >= 300 && res.status < 400) {
      const next = safeUrl(new URL(res.headers.get('location') ?? '', url).href)
      if (!next) return { error: 'blocked' }
      url = next
      continue
    }
    // 402 is what Dotdash Meredith's sites (Allrecipes, Serious Eats, Simply
    // Recipes) answer every automated request with, whoever is asking.
    if (!res.ok) return { error: [401, 402, 403, 429].includes(res.status) ? 'refused' : 'unreachable' }
    const type = res.headers.get('content-type') ?? ''
    if (!/html|xml/i.test(type)) return { error: 'not_a_page' }
    const reader = res.body?.getReader()
    if (!reader) return { error: 'unreachable' }
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) {
        await reader.cancel()
        break
      }
      chunks.push(value)
    }
    const html = new TextDecoder().decode(concat(chunks))
    return { html, url: url.href }
  }
  return { error: 'too_many_redirects' }
}

function concat(chunks: Uint8Array[]) {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0))
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.byteLength
  }
  return out
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

export function plain(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
      const lower = code.toLowerCase()
      if (lower in ENTITIES) return ENTITIES[lower]
      if (lower.startsWith('#x')) return String.fromCodePoint(parseInt(lower.slice(2), 16) || 32)
      if (lower.startsWith('#')) return String.fromCodePoint(parseInt(lower.slice(1), 10) || 32)
      return whole
    })
    .replace(/\s+/g, ' ')
    .trim()
}

function isRecipe(node: Record<string, unknown>) {
  const type = node['@type']
  return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))
}

function findRecipe(node: unknown, depth = 0): Record<string, unknown> | null {
  if (!node || typeof node !== 'object' || depth > 6) return null
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findRecipe(n, depth + 1)
      if (hit) return hit
    }
    return null
  }
  const obj = node as Record<string, unknown>
  if (isRecipe(obj)) return obj
  for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement']) {
    const hit = findRecipe(obj[key], depth + 1)
    if (hit) return hit
  }
  return null
}

/** ISO 8601 duration (PT1H30M) to minutes. */
export function minutes(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:\d+S)?)?$/i.exec(value.trim())
  if (!m) return null
  const total = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
  return total > 0 ? total : null
}

function steps(value: unknown, depth = 0): string[] {
  if (depth > 4) return []
  if (typeof value === 'string') {
    // Some sites put the whole method in one string, one step per line.
    return value.split(/\n+|(?<=\.)\s{2,}/).map(plain).filter(Boolean)
  }
  if (Array.isArray(value)) return value.flatMap((v) => steps(v, depth + 1))
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (obj.itemListElement) return steps(obj.itemListElement, depth + 1)
    const text = plain(obj.text ?? obj.name)
    return text ? [text] : []
  }
  return []
}

function image(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return image(value[0])
  if (value && typeof value === 'object') return image((value as Record<string, unknown>).url)
  return ''
}

/*
 * recipeYield is "4", 4, ["4", "4 servings"], "Makes about 3 dozen" or
 * "Serves 6-8" depending on the site. The first number in it, a dozen
 * counted as twelve, and two when there is no number at all.
 */
function serves(value: unknown): number {
  const raw = Array.isArray(value) ? (value.find((v) => /\d/.test(String(v))) ?? value[0]) : value
  const text = String(raw ?? '')
  const m = /(\d+)/.exec(text)
  if (!m) return 2
  const n = parseInt(m[1], 10) * (/dozen/i.test(text) ? 12 : 1)
  return n > 0 ? Math.min(n, 50) : 2
}

export function readRecipe(html: string, pageUrl: string) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, body] of blocks) {
    let data: unknown
    try {
      data = JSON.parse(body.trim())
    } catch {
      continue
    }
    const node = findRecipe(data)
    if (!node) continue
    const ingredients = (Array.isArray(node.recipeIngredient) ? node.recipeIngredient : Array.isArray(node.ingredients) ? node.ingredients : [])
      .map(plain)
      .filter(Boolean)
      .slice(0, 60)
    const method = steps(node.recipeInstructions).slice(0, 40)
    const name = plain(node.name)
    if (!name || (!ingredients.length && !method.length)) continue
    const img = image(node.image)
    return {
      name: name.slice(0, 120),
      serves: serves(node.recipeYield),
      time: minutes(node.totalTime) ?? ((minutes(node.prepTime) ?? 0) + (minutes(node.cookTime) ?? 0) || null),
      ingredients: ingredients.map((l) => l.slice(0, 200)),
      steps: method.map((s) => s.slice(0, 1200)),
      source: pageUrl,
      image: img.startsWith('https://') ? img.slice(0, 500) : '',
      notes: plain(node.description).slice(0, 400),
    }
  }
  return null
}
