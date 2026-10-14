import { createFileRoute } from '@tanstack/react-router'

import { aiRefusal, askJson } from '#/lib/ai'
import { dishNames, ingredientsFor } from '#/lib/catalogue'
import { gate, json, readJson } from '#/lib/gate'
import { cacheGetMany, cachePut, takeAllowance } from '#/lib/hub-store'

/*
 * /api/budget — roughly what each planned dish costs per serving, in your
 * currency, for the calendar's budget view (Premium).
 *
 * ESTIMATES from supermarket prices, labelled as such on the page: the model
 * prices the ingredients of the recipe this app ships for the dish, divided
 * by what it serves. Each dish and currency is priced once a month for
 * everybody, so most requests never reach the model. Prices outside what a
 * home-cooked serving can cost are discarded.
 */
const CURRENCIES = ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD', 'INR', 'ZAR', 'SEK', 'NOK', 'DKK', 'CHF', 'JPY', 'SGD', 'AED']
const MONTH_MS = 30 * 24 * 3600 * 1000
const BATCH = 12
const KEY = (cur: string, name: string) => `cost:v1:${cur}:${name.toLowerCase()}`
const CEILING: Record<string, number> = { JPY: 5000, INR: 2000 }

export const Route = createFileRoute('/api/budget')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const body = await readJson<{ dishes?: unknown; currency?: unknown }>(request, 8 * 1024)
        const currency = typeof body?.currency === 'string' && CURRENCIES.includes(body.currency) ? body.currency : 'GBP'
        const names = dishNames(body?.dishes, 40)
        if (!names.length) return json({ currency, costs: {} })

        const cached = await cacheGetMany<number>(names.map((n) => KEY(currency, n)))
        const costs: Record<string, number> = {}
        const missing: string[] = []
        for (const name of names) {
          const hit = cached.get(KEY(currency, name))
          if (typeof hit === 'number') costs[name] = hit
          else missing.push(name)
        }

        const ask = missing.slice(0, BATCH)
        if (ask.length && (await takeAllowance(who.userId, 'budget', 20))) {
          const described = ask.map((name) => {
            const r = ingredientsFor(name)
            return r ? `${name} (serves ${r.serves}): ${r.lines.join('; ')}` : `${name}: a typical home-cooked serving`
          })
          const result = await askJson<{ dishes?: { name?: unknown; perServing?: unknown }[] }>(
            'budget',
            [
              `You estimate what home-cooked dishes cost per serving at an ordinary supermarket, in ${currency}.`,
              'Price only the amounts the recipe uses (a teaspoon of spice costs pennies, not the jar), then divide by',
              'the number it serves. Assume salt, pepper, oil and water are already in the cupboard.',
              'Answer as JSON only: {"dishes":[{"name":"<exact name>","perServing":0.00}]}',
            ].join('\n'),
            [{ text: described.join('\n') }],
            { maxTokens: 900, temperature: 0.2 },
          )
          if (!result.ok && !Object.keys(costs).length) return json({ error: result.error }, aiRefusal(result.error))
          if (result.ok) {
            const ceiling = CEILING[currency] ?? 60
            for (const d of result.value.dishes ?? []) {
              const name = ask.find((n) => typeof d?.name === 'string' && n.toLowerCase() === d.name.trim().toLowerCase())
              const value = Number(d?.perServing)
              if (!name || !Number.isFinite(value) || value <= 0 || value > ceiling) continue
              costs[name] = Math.round(value * 100) / 100
              await cachePut(KEY(currency, name), costs[name], MONTH_MS)
            }
          }
        }
        return json({ currency, costs, pending: names.filter((n) => costs[n] === undefined) })
      },
    },
  },
})
