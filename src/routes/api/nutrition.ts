import { createFileRoute } from '@tanstack/react-router'

import { aiRefusal, askJson } from '#/lib/ai'
import { dishNames, ingredientsFor } from '#/lib/catalogue'
import { gate, json, readJson } from '#/lib/gate'
import { cacheGetMany, cachePut, takeAllowance } from '#/lib/hub-store'

/*
 * /api/nutrition — roughly what a serving of each dish is, for the
 * calendar's nutrition view (Premium).
 *
 * ESTIMATES, and labelled as such on the page. The model is handed the
 * recipe this app actually ships for the dish — its ingredients and how many
 * it serves — and asked for per-serving figures. Each dish is worked out
 * once and kept for a year for everybody (a dish's nutrition does not depend
 * on who asked), so most requests never reach the model at all. Numbers
 * outside what a plate of food can be are thrown away, not shown.
 */
type Nutrition = { kcal: number; protein: number; carbs: number; fat: number; fibre: number }
const YEAR_MS = 365 * 24 * 3600 * 1000
const BATCH = 12
const KEY = (name: string) => `nutri:v1:${name.toLowerCase()}`
const LIMITS: Record<keyof Nutrition, number> = { kcal: 2500, protein: 150, carbs: 300, fat: 150, fibre: 60 }

function clean(raw: unknown): Nutrition | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const out = {} as Nutrition
  for (const key of Object.keys(LIMITS) as (keyof Nutrition)[]) {
    const n = Number(r[key])
    if (!Number.isFinite(n) || n < 0 || n > LIMITS[key]) return null
    out[key] = Math.round(n)
  }
  return out.kcal > 0 ? out : null
}

export const Route = createFileRoute('/api/nutrition')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const body = await readJson<{ dishes?: unknown }>(request, 8 * 1024)
        const names = dishNames(body?.dishes, 40)
        if (!names.length) return json({ nutrition: {} })

        const cached = await cacheGetMany<Nutrition>(names.map(KEY))
        const nutrition: Record<string, Nutrition> = {}
        const missing: string[] = []
        for (const name of names) {
          const hit = cached.get(KEY(name))
          if (hit) nutrition[name] = hit
          else missing.push(name)
        }

        const ask = missing.slice(0, BATCH)
        if (ask.length && (await takeAllowance(who.userId, 'nutrition', 20))) {
          const described = ask.map((name) => {
            const r = ingredientsFor(name)
            return r ? `${name} (serves ${r.serves}): ${r.lines.join('; ')}` : `${name}: a typical home-cooked serving`
          })
          const result = await askJson<{ dishes?: { name?: unknown; kcal?: unknown; protein?: unknown; carbs?: unknown; fat?: unknown; fibre?: unknown }[] }>(
            'nutrition',
            [
              'You estimate nutrition per serving for home-cooked dishes, from the recipe given.',
              'Divide the whole recipe by the number it serves. Grams for protein, carbs, fat and fibre; kcal for energy.',
              'Be realistic, not optimistic. Whole numbers.',
              'Answer as JSON only: {"dishes":[{"name":"<exact name>","kcal":0,"protein":0,"carbs":0,"fat":0,"fibre":0}]}',
            ].join('\n'),
            [{ text: described.join('\n') }],
            { maxTokens: 1200, temperature: 0.2 },
          )
          if (!result.ok && !Object.keys(nutrition).length) return json({ error: result.error }, aiRefusal(result.error))
          if (result.ok) {
            for (const d of result.value.dishes ?? []) {
              const name = ask.find((n) => typeof d?.name === 'string' && n.toLowerCase() === d.name.trim().toLowerCase())
              const value = clean(d)
              if (!name || !value) continue
              nutrition[name] = value
              await cachePut(KEY(name), value, YEAR_MS)
            }
          }
        }
        const pending = names.filter((n) => !nutrition[n])
        return json({ nutrition, pending })
      },
    },
  },
})
