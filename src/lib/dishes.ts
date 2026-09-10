import dataJs from '../../public/decide/js/data.js?raw'

/*
 * The dish catalogue, read out of the game's own data file.
 *
 * public/decide/js/data.js is a plain script the browser loads by <script>
 * tag, so there is no module to import from it — but it is the one place a
 * dish is defined, and a second hand-kept list here would drift the first
 * time somebody adds a dish. So the item() calls are read out of the source
 * at build time (the ?raw import is inlined into the bundle; nothing is read
 * from disk at request time).
 *
 * This module exists so a shared link can name a real dish: it is what stops
 * /eat/<anything> from putting arbitrary text into a card that carries the
 * site's own name.
 */

export type Dish = {
  slug: string
  name: string
  icon: string
  blurb: string
  /** Flavour and format tags — 'hot', 'quick', 'veg' … See TAGS in data.js. */
  tags: string[]
}

/*
 * item('Pizza', '\u{1F355}', 'A slice big enough to fold. …', 'tags…', 'tags…')
 *
 * The last two groups are optional because a handful of items carry no tags,
 * and \s* spans newlines because the calls wrap. Tags are what let one dish
 * link to another: without them the 112 pages are islands that only the
 * sitemap knows about, which is most of the reason none of them were indexed.
 */
const ITEM =
  /item\('((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'(?:,\s*'((?:[^'\\]|\\.)*)')?(?:,\s*'((?:[^'\\]|\\.)*)')?/g

// The icons are written as JS escapes in the source, which a raw import hands
// over literally. Names and blurbs are plain text apart from escaped quotes.
function decode(literal: string) {
  return literal
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\'/g, "'")
}

/** Must match slugFor() in public/decide/js/app.js — both sides build the same link. */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const ALL_DISHES: Dish[] = [...dataJs.matchAll(ITEM)].map(
  ([, name, icon, blurb, yesTags, maybeTags]) => ({
    slug: slugify(decode(name)),
    name: decode(name),
    icon: decode(icon),
    blurb: decode(blurb),
    // A "maybe" tag is half-true of the dish in the game's scoring. For linking
    // one page to another that distinction does not matter — both mean the two
    // dishes have something in common, which is the whole question here.
    tags: [...(yesTags ?? '').split(/\s+/), ...(maybeTags ?? '').split(/\s+/)].filter(Boolean),
  }),
)

/*
 * Dishes that have most in common with this one, best first.
 *
 * Ranked by shared tags, which is crude and is meant to be: the job is to give
 * a crawler a real path between pages and a reader a plausible next tap, not
 * to be right about cuisine.
 */
export function relatedTo(dish: Dish, limit = 6): Dish[] {
  const own = new Set(dish.tags)
  return ALL_DISHES.filter((other) => other.slug !== dish.slug)
    .map((other) => ({ dish: other, shared: other.tags.filter((t) => own.has(t)).length }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.dish.name.localeCompare(b.dish.name))
    .slice(0, limit)
    .map((entry) => entry.dish)
}

const BY_SLUG = new Map(ALL_DISHES.map((dish) => [dish.slug, dish]))

export function dishBySlug(slug: string): Dish | null {
  return BY_SLUG.get(slug.toLowerCase()) ?? null
}
