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

export type ReadRecipe = {
  name: string
  serves: number
  time: number | null
  ingredients: string[]
  steps: string[]
  source: string
  image: string
  notes: string
}

/** How a recipe was read — shown to the person, because "read by AI, check it" matters. */
export type ReadMethod = 'recipe-card' | 'microdata' | 'plugin' | 'headings' | 'ai'

// Buttons and labels that sit inside recipe boxes and are not part of the recipe.
const NOISE = /^(deselect all|select all|print( recipe)?|save( recipe)?|jump to recipe|pin( it)?|share|rate( this)? recipe|add to (shopping )?list|units?|us customary|metric|\d+x|scale|ingredients|instructions|method|directions|notes|nutrition)$/i

// De-duplicating is for the readers that guess from the page, where nested
// markup reads the same line twice. A recipe card is trusted as written: a
// real recipe can need "2 eggs" for the sponge and again for the icing.
function clean(lines: string[], min: number, dedupe: boolean): string[] {
  const seen = new Set<string>()
  return lines
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length >= min && /[a-z]/i.test(l) && !NOISE.test(l))
    .filter((l) => !dedupe || (seen.has(l.toLowerCase()) ? false : (seen.add(l.toLowerCase()), true)))
}

/*
 * Does this look like a real ingredient list? Most lines of one start with or
 * contain an amount — "200g", "2 tbsp", "a pinch". A guessed list that is
 * mostly not that is the page's navigation, and the AI does better.
 */
const AMOUNT = /\d|½|¼|¾|\b(cups?|tbsp|tsp|tablespoons?|teaspoons?|pinch|handful|cloves?|grams?|g|kg|ml|litres?|ounces?|oz|lbs?|pounds?|bunch|tins?|cans?|slices?|large|small|medium)\b/i

export function plausible(ingredients: string[]): boolean {
  if (ingredients.length < 2) return false
  const counted = ingredients.filter((l) => AMOUNT.test(l)).length
  return counted / ingredients.length >= 0.5
}

function finish(r: Omit<ReadRecipe, 'source'>, pageUrl: string, dedupe = true): ReadRecipe | null {
  // A long line with no amount in it is an advert or a tip ("Keep the screen
  // awake with our app"), not an ingredient.
  const ingredients = clean(r.ingredients, 3, dedupe).filter((l) => l.length <= 80 || AMOUNT.test(l)).map((l) => l.slice(0, 200)).slice(0, 60)
  const method = clean(r.steps, 8, dedupe).map((l) => l.slice(0, 1200)).slice(0, 40)
  const name = r.name.trim().slice(0, 120)
  // Two ingredients and a step at least: one stray list item is not a recipe.
  if (!name || ingredients.length < 2 || !method.length) return null
  return { ...r, name, ingredients, steps: method, source: pageUrl, image: r.image.startsWith('https://') ? r.image.slice(0, 500) : '', notes: r.notes.slice(0, 400) }
}

/* ---- 1. the recipe card the site publishes for search engines (JSON-LD) */

function fromJsonLd(html: string, pageUrl: string): ReadRecipe | null {
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
    const ingredients = (Array.isArray(node.recipeIngredient) ? node.recipeIngredient : Array.isArray(node.ingredients) ? node.ingredients : []).map(plain)
    const found = finish({
      name: plain(node.name),
      serves: serves(node.recipeYield),
      time: minutes(node.totalTime) ?? ((minutes(node.prepTime) ?? 0) + (minutes(node.cookTime) ?? 0) || null),
      ingredients,
      steps: steps(node.recipeInstructions),
      image: image(node.image),
      notes: plain(node.description),
    }, pageUrl, false)
    if (found) return found
  }
  return null
}

/* ---- shared pieces for reading the page itself ------------------------ */

function meta(html: string, prop: string): string {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i')
  return plain((re.exec(html) ?? re2.exec(html))?.[1] ?? '')
}

function pageName(html: string): string {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]
  return plain(h1) || meta(html, 'og:title') || plain(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]).split(/\s[|–-]\s/)[0]
}

function listItems(chunk: string): string[] {
  return [...chunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => plain(m[1])).filter((t) => t.length > 1)
}

/** Every element with this attribute, by the text inside it. Good enough for the flat markup recipe plugins write. */
function byAttr(html: string, attr: RegExp): string[] {
  const out: string[] = []
  const lower = html.toLowerCase()
  const open = new RegExp(`<(li|p|span|div|td)\\b[^>]*${attr.source}[^>]*>`, 'gi')
  // An element inside one already read is a piece of that line ("200g" inside
  // "200g golden caster sugar"), not a line of its own.
  let readUntil = -1
  for (const m of html.matchAll(open)) {
    if ((m.index ?? 0) < readUntil) continue
    const tag = m[1].toLowerCase()
    const from = (m.index ?? 0) + m[0].length
    const close = lower.indexOf(`</${tag}>`, from)
    if (close === -1) continue
    readUntil = close
    const inner = html.slice(from, close)
    // A container that holds a list is the list's items, not one long line.
    const items = listItems(inner)
    if (items.length > 1) out.push(...items)
    else {
      const text = plain(inner)
      if (text.length > 1) out.push(text)
    }
  }
  return out
}

function pageServes(html: string): number {
  const m = /(?:serves|servings|yield|makes)[^0-9]{0,20}(\d{1,2})/i.exec(plain(html.slice(0, 400000)))
  return m ? serves(m[1]) : 2
}

/* ---- 2. schema.org microdata: older sites mark the recipe up in place */

function fromMicrodata(html: string, pageUrl: string): ReadRecipe | null {
  if (!/itemtype=["'][^"']*schema\.org\/Recipe["']/i.test(html)) return null
  const name = byAttr(html, /itemprop=["']name["']/)[0] || pageName(html)
  return finish({
    name,
    serves: pageServes(html),
    time: null,
    ingredients: byAttr(html, /itemprop=["'](?:recipeIngredient|ingredients)["']/),
    steps: byAttr(html, /itemprop=["']recipeInstructions["']/),
    image: meta(html, 'og:image'),
    notes: meta(html, 'og:description'),
  }, pageUrl)
}

/* ---- 3. the recipe plugins food blogs are built on --------------------- */

const PLUGINS: { name: string; ingredients: RegExp; steps: RegExp }[] = [
  // WP Recipe Maker, by far the commonest on food blogs.
  { name: 'wprm', ingredients: /class=["'][^"']*\bwprm-recipe-ingredient\b(?!-)[^"']*["']/, steps: /class=["'][^"']*\bwprm-recipe-instruction-text\b[^"']*["']/ },
  // Tasty Recipes.
  { name: 'tasty', ingredients: /class=["'][^"']*\btasty-recipes?-ingredients\b[^"']*["']/, steps: /class=["'][^"']*\btasty-recipes?-instructions\b[^"']*["']/ },
  // Mediavine Create.
  { name: 'mv-create', ingredients: /class=["'][^"']*\bmv-create-ingredients\b[^"']*["']/, steps: /class=["'][^"']*\bmv-create-instructions\b[^"']*["']/ },
  // Zip Recipes, EasyRecipe, Yummly-style and most hand-built themes.
  { name: 'generic', ingredients: /class=["'][^"']*\b(?:recipe-)?ingredients?(?:-item|-line|-list)?\b[^"']*["']/, steps: /class=["'][^"']*\b(?:recipe-)?(?:instructions?|directions?|method|steps?)(?:-item|-step|-list|-text)?\b[^"']*["']/ },
]

function fromPlugins(html: string, pageUrl: string): ReadRecipe | null {
  for (const plugin of PLUGINS) {
    const ingredients = [...new Set(byAttr(html, plugin.ingredients))]
    if (ingredients.length < 2) continue
    const found = finish({
      name: pageName(html),
      serves: pageServes(html),
      time: null,
      ingredients,
      steps: [...new Set(byAttr(html, plugin.steps))],
      image: meta(html, 'og:image'),
      notes: meta(html, 'og:description'),
    }, pageUrl)
    if (found && plausible(found.ingredients)) return found
  }
  return null
}

/* ---- 4. headings: "Ingredients" then a list, "Method" then steps ------- */

function fromHeadings(html: string, pageUrl: string): ReadRecipe | null {
  const headings = [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map((m) => ({ text: plain(m[1]).toLowerCase(), at: (m.index ?? 0) + m[0].length }))
  const section = (test: RegExp) => {
    const i = headings.findIndex((h) => test.test(h.text))
    if (i === -1) return ''
    const end = headings[i + 1]?.at ?? Math.min(html.length, headings[i].at + 20000)
    return html.slice(headings[i].at, end)
  }
  const ing = section(/^ingredients?\b|\bingredients\s*$/)
  const method = section(/^(method|instructions|directions|steps|preparation|how to make)/)
  if (!ing || !method) return null
  const stepItems = listItems(method)
  const steps = stepItems.length ? stepItems : [...method.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => plain(m[1])).filter((t) => t.length > 20)
  const found = finish({
    name: pageName(html),
    serves: pageServes(html),
    time: null,
    ingredients: listItems(ing),
    steps,
    image: meta(html, 'og:image'),
    notes: meta(html, 'og:description'),
  }, pageUrl)
  return found && plausible(found.ingredients) ? found : null
}

/*
 * Every reader, best first. The recipe card is the site's own clean data and
 * wins whenever it is there; each reader after it is a little more of a
 * guess, and the AI (in the route) is the last resort, for a page none of
 * these can make sense of.
 */
export function readRecipe(html: string, pageUrl: string): { recipe: ReadRecipe; method: ReadMethod } | null {
  const readers: [ReadMethod, (h: string, u: string) => ReadRecipe | null][] = [
    ['recipe-card', fromJsonLd],
    ['microdata', fromMicrodata],
    ['plugin', fromPlugins],
    ['headings', fromHeadings],
  ]
  for (const [method, read] of readers) {
    const recipe = read(html, pageUrl)
    if (recipe) return { recipe, method }
  }
  return null
}

/** The readable words on the page, for the AI to read when nothing else could. */
export function pageText(html: string, max = 14000): string {
  const main = /<(article|main)\b[^>]*>([\s\S]*)<\/\1>/i.exec(html)?.[2] ?? html
  return plain(
    main
      .replace(/<(script|style|noscript|svg|nav|header|footer|form|aside|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|li|h[1-6]|div|br|tr)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n'),
  ).slice(0, max)
}
