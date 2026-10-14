import { createFileRoute } from '@tanstack/react-router'

import { gate, json, readJson, str } from '#/lib/gate'
import { COOKBOOK_MAX, countCookbook, deleteCookbook, listCookbook, saveCookbook } from '#/lib/hub-store'

/*
 * /api/cookbook — your own recipes, and the ones you imported, kept against
 * your account (Premium).
 *
 *   GET                 every recipe, newest first
 *   POST {recipe}       save one (new, or an edit of one with that id)
 *   DELETE ?id=…        remove one
 *
 * A recipe is cleaned to a fixed shape here — strings cut to length, lists
 * capped — whatever was sent. It is shown with textContent on the page;
 * nothing in it is ever treated as markup.
 */
const ID = /^[a-z0-9-]{6,40}$/

type CookbookRecipe = {
  id: string
  name: string
  serves: number
  time: number | null
  ingredients: string[]
  steps: string[]
  source: string
  image: string
  notes: string
}

function lines(raw: unknown, cap: number, each: number): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((l) => str(l, each)).filter(Boolean).slice(0, cap)
}

function cleanRecipe(raw: unknown, id: string): CookbookRecipe | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = str(r.name, 120)
  const ingredients = lines(r.ingredients, 60, 200)
  const steps = lines(r.steps, 40, 1200)
  if (!name || (!ingredients.length && !steps.length)) return null
  const serves = Math.round(Number(r.serves))
  const time = Math.round(Number(r.time))
  const source = str(r.source, 500)
  const image = str(r.image, 500)
  return {
    id,
    name,
    serves: Number.isFinite(serves) && serves > 0 ? Math.min(serves, 50) : 2,
    time: Number.isFinite(time) && time > 0 ? Math.min(time, 24 * 60) : null,
    ingredients,
    steps,
    source: /^https?:\/\//.test(source) ? source : '',
    image: /^https:\/\//.test(image) ? image : '',
    notes: str(r.notes, 1000),
  }
}

export const Route = createFileRoute('/api/cookbook')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        try {
          const recipes = await listCookbook(who.userId)
          return recipes ? json({ recipes }) : json({ error: 'storage_unavailable' }, 503)
        } catch (err) {
          console.error('cookbook: read failed', err)
          return json({ error: 'storage_unavailable' }, 503)
        }
      },
      POST: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const body = await readJson<{ recipe?: Record<string, unknown> }>(request, 96 * 1024)
        const given = typeof body?.recipe?.id === 'string' && ID.test(body.recipe.id) ? body.recipe.id : null
        const id = given ?? crypto.randomUUID()
        const recipe = cleanRecipe(body?.recipe, id)
        if (!recipe) return json({ error: 'bad_request' }, 400)
        try {
          if (!given && (await countCookbook(who.userId)) >= COOKBOOK_MAX) return json({ error: 'cookbook_full' }, 409)
          const saved = await saveCookbook(who.userId, id, recipe)
          return saved ? json({ recipe }) : json({ error: 'storage_unavailable' }, 503)
        } catch (err) {
          console.error('cookbook: write failed', err)
          return json({ error: 'storage_unavailable' }, 503)
        }
      },
      DELETE: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const id = new URL(request.url).searchParams.get('id') ?? ''
        if (!ID.test(id)) return json({ error: 'bad_request' }, 400)
        try {
          await deleteCookbook(who.userId, id)
          return json({ ok: true })
        } catch (err) {
          console.error('cookbook: delete failed', err)
          return json({ error: 'storage_unavailable' }, 503)
        }
      },
    },
  },
})
