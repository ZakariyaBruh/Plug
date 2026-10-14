import { createFileRoute } from '@tanstack/react-router'

import { gate, json } from '#/lib/gate'
import { cacheGet, cachePut } from '#/lib/hub-store'

/*
 * /api/scan?code=5000159484695 — what is in a packet, from its barcode
 * (Premium).
 *
 * The data is Open Food Facts (openfoodfacts.org), the open, crowd-sourced
 * database of food products — free to use, and its terms ask for a named
 * User-Agent, which this sends. Asked from here rather than the browser so
 * the answer can be checked and shaped once, and kept for a week.
 *
 * It answers with what the product contains in the app's own diet words —
 * pork, dairy, egg, shellfish, allium… — so the page can hold it against the
 * rules the person already set and say "this has dairy in it" in the same
 * terms the rest of the app uses. Those flags are worked out from the
 * product's declared allergens and its ingredient list; where Open Food Facts
 * has no ingredient list the answer says so rather than calling it safe.
 */
const CODE = /^\d{6,14}$/
const FIELDS = [
  'product_name', 'brands', 'quantity', 'image_front_small_url', 'nutriscore_grade', 'nova_group',
  'allergens_tags', 'traces_tags', 'ingredients_analysis_tags', 'ingredients_text', 'ingredients_text_en',
  'nutriments', 'labels_tags',
].join(',')
const WEEK_MS = 7 * 24 * 3600 * 1000

const WORDS: [string, RegExp][] = [
  ['pork', /\b(pork|bacon|ham|lard|pancetta|prosciutto|chorizo|salami|pepperoni|gelatine?|porcine)\b/i],
  ['beef', /\b(beef|veal|bovine|ox|tallow)\b/i],
  ['alcohol', /\b(wine|beer|rum|brandy|whisk(e)?y|vodka|liqueur|alcohol|cider|sake|mirin)\b/i],
  ['allium', /\b(onions?|garlic|leeks?|shallots?|chives?)\b/i],
  ['root', /\b(potato(es)?|carrots?|ginger|turmeric|beetroot|radish|galangal)\b/i],
  ['shellfish', /\b(shrimp|prawns?|crab|lobster|mussels?|clams?|oysters?|scallops?|squid|octopus)\b/i],
  ['meat', /\b(chicken|turkey|duck|lamb|mutton|beef|pork|veal|meat|bacon|ham|gelatine?)\b/i],
  ['seafood', /\b(fish|anchov(y|ies)|tuna|salmon|cod|sardines?|mackerel)\b/i],
]
const ALLERGEN: Record<string, string> = {
  'en:milk': 'dairy', 'en:eggs': 'egg', 'en:crustaceans': 'shellfish', 'en:molluscs': 'shellfish',
  'en:fish': 'seafood', 'en:gluten': 'gluten', 'en:nuts': 'nuts', 'en:peanuts': 'peanuts',
  'en:soybeans': 'soy', 'en:sesame-seeds': 'sesame', 'en:celery': 'celery', 'en:mustard': 'mustard',
}

type Off = {
  status?: number
  product?: {
    product_name?: string; brands?: string; quantity?: string; image_front_small_url?: string
    nutriscore_grade?: string; nova_group?: number; allergens_tags?: string[]; traces_tags?: string[]
    ingredients_analysis_tags?: string[]; ingredients_text?: string; ingredients_text_en?: string
    nutriments?: Record<string, number | string>; labels_tags?: string[]
  }
}

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null
}

function shape(code: string, data: Off) {
  const p = data.product
  if (!p || data.status === 0) return null
  const text = (p.ingredients_text_en || p.ingredients_text || '').slice(0, 3000)
  const contains = new Set<string>()
  for (const tag of p.allergens_tags ?? []) if (ALLERGEN[tag]) contains.add(ALLERGEN[tag])
  for (const [word, re] of WORDS) if (text && re.test(text)) contains.add(word)
  const analysis = p.ingredients_analysis_tags ?? []
  if (analysis.includes('en:non-vegetarian')) contains.add('meat')
  if (contains.has('pork') || contains.has('beef')) contains.add('meat')
  const traces = (p.traces_tags ?? []).map((t) => ALLERGEN[t]).filter(Boolean)
  const n = p.nutriments ?? {}
  return {
    code,
    name: (p.product_name || 'Unnamed product').slice(0, 120),
    brand: (p.brands || '').split(',')[0].trim().slice(0, 60),
    quantity: (p.quantity || '').slice(0, 40),
    image: p.image_front_small_url?.startsWith('https://') ? p.image_front_small_url : '',
    nutriscore: /^[a-e]$/.test(p.nutriscore_grade ?? '') ? p.nutriscore_grade!.toUpperCase() : null,
    nova: typeof p.nova_group === 'number' ? p.nova_group : null,
    vegan: analysis.includes('en:vegan') ? true : analysis.includes('en:non-vegan') ? false : null,
    vegetarian: analysis.includes('en:vegetarian') ? true : analysis.includes('en:non-vegetarian') ? false : null,
    contains: [...contains],
    traces: [...new Set(traces)],
    ingredientsKnown: !!text,
    ingredients: text.slice(0, 1200),
    per100g: {
      kcal: num(n['energy-kcal_100g']),
      fat: num(n.fat_100g),
      saturates: num(n['saturated-fat_100g']),
      carbs: num(n.carbohydrates_100g),
      sugars: num(n.sugars_100g),
      protein: num(n.proteins_100g),
      salt: num(n.salt_100g),
      fibre: num(n.fiber_100g),
    },
  }
}

export const Route = createFileRoute('/api/scan')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const code = new URL(request.url).searchParams.get('code') ?? ''
        if (!CODE.test(code)) return json({ error: 'bad_code' }, 400)

        const cached = await cacheGet<ReturnType<typeof shape>>(`off:${code}`)
        if (cached) return json({ product: cached })

        let data: Off
        try {
          const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`, {
            signal: AbortSignal.timeout(10000),
            headers: { 'User-Agent': 'morsels45/1.0 (+https://morsels45-app.whop.site)', Accept: 'application/json' },
          })
          if (res.status === 404) return json({ error: 'not_found' }, 404)
          if (!res.ok) return json({ error: 'unavailable' }, 502)
          data = (await res.json()) as Off
        } catch {
          return json({ error: 'unavailable' }, 502)
        }
        const product = shape(code, data)
        if (!product) return json({ error: 'not_found' }, 404)
        await cachePut(`off:${code}`, product, WEEK_MS)
        return json({ product })
      },
    },
  },
})
