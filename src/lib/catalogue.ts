import { ALL_DISHES, type Dish } from '#/lib/dishes'
import { quickest } from '#/lib/recipes'

/*
 * THE CATALOGUE, AS THE AI FEATURES SEE IT.
 *
 * Every hub feature that asks the model to name a dish — filling the
 * calendar, a dinner-party menu, what the fridge can make — goes through
 * here, for the same two promises the rest of the app keeps:
 *
 *   1. It only names real dishes. The model is handed the menu and every name
 *      it returns is matched back to it; anything else is dropped. A dish we
 *      do not have has no recipe, no page and nothing to tap.
 *   2. It never serves somebody what they do not eat. The rules arrive as the
 *      same tags the game bans (pork, dairy, allium …) and a dish carrying
 *      any of them, even as a maybe, is off the menu before the model sees it.
 */

const KNOWN_TAG = /^[a-z]{2,16}$/

export function cleanRules(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const tag of raw) {
    if (typeof tag === 'string' && KNOWN_TAG.test(tag) && !out.includes(tag)) out.push(tag)
    if (out.length >= 24) break
  }
  return out
}

export function breaks(dish: Dish, rules: string[]) {
  return rules.some((tag) => dish.tags.includes(tag))
}

/** Food, not drinks, that keeps every rule given. */
export function allowedDishes(rules: string[], { drinks = false } = {}): Dish[] {
  return ALL_DISHES.filter((d) => (drinks || !d.tags.includes('drink')) && !breaks(d, rules))
}

export function menuText(dishes: Dish[]) {
  return dishes.map((d) => d.name).join(', ')
}

const BY_NAME = new Map(ALL_DISHES.map((d) => [d.name.toLowerCase(), d]))

/** The catalogue dish a returned name refers to, if it is one we have and it keeps the rules. */
export function matchDish(name: unknown, rules: string[] = []): Dish | null {
  if (typeof name !== 'string') return null
  const dish = BY_NAME.get(name.trim().toLowerCase())
  if (!dish || breaks(dish, rules)) return null
  return dish
}

export function dishNames(raw: unknown, cap: number): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const v of raw) {
    const dish = matchDish(v)
    if (dish && !out.includes(dish.name)) out.push(dish.name)
    if (out.length >= cap) break
  }
  return out
}

/** The ingredient lines the quickest bundled recipe uses, for estimating cost or nutrition. */
export function ingredientsFor(name: string): { serves: number; lines: string[] } | null {
  const recipe = quickest(name)
  return recipe ? { serves: recipe.serves || 2, lines: recipe.ingredients.slice(0, 30) } : null
}
