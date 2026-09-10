import book from 'virtual:recipe-book'

/*
 * recipes.ts — the recipe book, typed.
 *
 * The data is extracted from public/decide/js/recipes.js by the recipeBook()
 * plugin in vite.config.ts and inlined as JSON, so this module is a shape and
 * a couple of lookups rather than any parsing.
 *
 * WHY THE SERVER NEEDS IT AT ALL, when the game already renders recipes in the
 * browser. A dish page was 84 words: a name, a one-line blurb and a button.
 * That is a fine thing to receive in a message and a poor thing to offer a
 * search engine — 112 near-identical pages that thin read as doorway pages,
 * which get crawled and then not indexed. The recipes were already written;
 * they were just never on the page a crawler sees.
 */

export type Recipe = {
  name: string
  time: number
  serves: number
  level: string
  ingredients: string[]
  steps: string[]
}

const BOOK = book as Record<string, Recipe[]>

/** Every recipe bundled for a dish, by its catalogue name. Empty if none. */
export function recipesFor(name: string): Recipe[] {
  return BOOK[name] ?? []
}

/** The quickest recipe for a dish — what the page leads with, and what the schema times. */
export function quickest(name: string): Recipe | null {
  const list = recipesFor(name)
  if (!list.length) return null
  return list.reduce((best, r) => (r.time < best.time ? r : best))
}

/** ISO 8601 duration, which is the only form Google's Recipe schema accepts. */
export function isoDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'PT0M'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `PT${hours ? `${hours}H` : ''}${mins ? `${mins}M` : ''}` || 'PT0M'
}
