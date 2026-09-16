import { createFileRoute } from '@tanstack/react-router'

import { ALL_DISHES } from '#/lib/dishes'

/*
 * /api/daily — five dishes to try, written fresh each day.
 *
 * WHY THIS IS NOT PART OF THE CATALOGUE. The 133 dishes in decide/js/data.js
 * are curated: every one has hand-checked tags that the question engine reasons
 * over and that the dietary rules filter on. These five are not that. They are
 * a discovery shelf — something to read about and go and cook — and they stay
 * out of the deciding engine entirely. A generated dish with a plausible but
 * wrong tag would quietly poison both the questions and the rules, and the rule
 * it would break is somebody's diet.
 *
 * WHY IT IS NOT IN data.js EITHER. That file is in the service worker's
 * precache and the build id is a hash of the shell, so appending five dishes a
 * day would change the id daily and make every reader re-download the whole app
 * every morning. At roughly 341 bytes a dish it would also be 652 KB inside a
 * year. Five dishes over the wire is under 2 KB and is cached for the day.
 *
 * ONE GENERATION PER DAY PER EDGE, not per reader. The response is immutable
 * for the date it names and carries a day-long Cache-Control, so Cloudflare
 * serves it from the edge and the model is asked a handful of times a day
 * worldwide rather than once a visit.
 */

const MODEL = 'gemini-3.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const WANTED = 5
const TIMEOUT_MS = 12000
const MAX_OUTPUT_TOKENS = 1400

/*
 * What a dish may declare it contains, and the tag each maps to.
 *
 * This is the whole safety story. The six standing dietary rules filter on
 * these tags, so a generated dish that fails to declare itself honestly is a
 * vegetarian being handed chicken. The model is asked for an explicit list
 * rather than left to omit things: a missing `contains` is a rejected dish, not
 * a dish assumed to be safe. Fail closed, every time.
 */
const CONTAINS: Record<string, string> = {
  meat: 'meat',
  seafood: 'seafood',
  cheese: 'cheesy',
  spicy: 'spicy',
  fried: 'fried',
  caffeine: 'caffeine',
}

function instruction(known: string[]) {
  return (
    `You write short entries for a food app's "five to try today" shelf.\n\n` +
    `Return JSON: {"dishes":[{"name":"","icon":"","blurb":"","contains":[]}]} with exactly ` +
    `${WANTED} dishes.\n\n` +
    `name: a real, specific dish that people actually cook or order somewhere in the world. ` +
    `Never invent a dish. Never use a brand name. Under 40 characters.\n` +
    `icon: ONE emoji that suits it.\n` +
    `blurb: one sentence, under 90 characters, plain and concrete — what it is and why it is ` +
    `worth eating. No marketing words, no exclamation marks.\n` +
    `contains: every one of these that applies, as an array of lowercase strings — ` +
    `${Object.keys(CONTAINS).join(', ')}. Be strict and literal: include "meat" for any meat ` +
    `including poultry, include "seafood" for any fish or shellfish, include "cheese" if cheese ` +
    `is in it at all, include "caffeine" for coffee, tea, or chocolate-heavy dishes. If none ` +
    `apply return an empty array. Somebody's diet depends on this list being right.\n\n` +
    `Pick five from five different cuisines. Vary them: not five mains, not five from one ` +
    `region. Do not use any of these, which the app already has:\n${known.join(', ')}`
  )
}

/** One emoji, and nothing smuggled in beside it. */
function oneEmoji(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 8) return null
  // No letters, digits or markup — an "icon" of <img> or "A" is not an icon.
  if (/[\p{L}\p{N}<>&"'/\\]/u.test(trimmed)) return null
  return trimmed
}

function clean(value: unknown, cap: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (!trimmed || trimmed.length > cap) return null
  return trimmed
}

type Made = { name: string; icon: string; blurb: string; tags: Record<string, number> }

/*
 * Turn one answer into a dish, or into nothing.
 *
 * Every field has to be there and has to be the right shape. A dish that is
 * half-right is dropped rather than patched, because the half that is wrong is
 * the half nobody checks.
 */
function toDish(raw: unknown, taken: Set<string>): Made | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>

  const name = clean(row.name, 40)
  const blurb = clean(row.blurb, 120)
  const icon = oneEmoji(row.icon)
  if (!name || !blurb || !icon) return null

  // Never shadow a real catalogue dish: it would have this blurb here and its
  // own everywhere else.
  const key = name.toLowerCase()
  if (taken.has(key)) return null

  // The declaration is mandatory. No list means no dish.
  if (!Array.isArray(row.contains)) return null
  const tags: Record<string, number> = {}
  for (const entry of row.contains) {
    if (typeof entry !== 'string') return null
    const tag = CONTAINS[entry.trim().toLowerCase()]
    if (!tag) continue // an unknown word is not fatal, but it is not a tag either
    tags[tag] = 1
  }

  taken.add(key)
  return { name, icon, blurb, tags }
}

function json(body: unknown, status: number, cacheSeconds = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheSeconds
        ? `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
        : 'no-store',
    },
  })
}

export const Route = createFileRoute('/api/daily')({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.GEMINI_API_KEY
        // No key is not an error the reader should see. The card simply does
        // not appear, which is the right failure for a bonus shelf.
        if (!key) return json({ dishes: [], day: null }, 200, 300)

        const day = new Date().toISOString().slice(0, 10)
        const known = ALL_DISHES.map((d) => d.name)
        const taken = new Set(known.map((n) => n.toLowerCase()))

        const control = new AbortController()
        const timer = setTimeout(() => control.abort(), TIMEOUT_MS)
        type Answer = { candidates?: { content?: { parts?: { text?: string }[] } }[] }
        let payload: Answer | null = null
        try {
          const res = await fetch(ENDPOINT, {
            method: 'POST',
            signal: control.signal,
            headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: instruction(known) }] },
              // The date is in the prompt so a given day reads the same way
              // wherever it is generated, and so two days running differ.
              contents: [{ role: 'user', parts: [{ text: `Five to try on ${day}.` }] }],
              generationConfig: {
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                temperature: 1,
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingLevel: 'low' },
              },
            }),
          })
          if (!res.ok) {
            console.error('daily: gemini answered', res.status)
            return json({ dishes: [], day }, 200, 300)
          }
          payload = (await res.json()) as Answer
        } catch (err) {
          console.error('daily: no answer', err)
          return json({ dishes: [], day }, 200, 300)
        } finally {
          clearTimeout(timer)
        }

        const text = (payload?.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p?.text ?? '')
          .join('')
          .trim()

        let parsed: { dishes?: unknown } | null = null
        try {
          parsed = JSON.parse(text)
        } catch {
          console.error('daily: answer was not JSON')
          return json({ dishes: [], day }, 200, 300)
        }

        const rows = Array.isArray(parsed?.dishes) ? parsed.dishes : []
        const dishes: Made[] = []
        for (const row of rows) {
          const made = toDish(row, taken)
          if (made) dishes.push(made)
          if (dishes.length === WANTED) break
        }

        // Most of a batch surviving is fine; a batch that mostly failed
        // validation means the model is having a bad day, and half a shelf
        // looks broken. Cached briefly so the next hour can do better.
        if (dishes.length < 3) {
          console.error('daily: only', dishes.length, 'of', rows.length, 'survived validation')
          return json({ dishes: [], day }, 200, 300)
        }

        // Good for the rest of the day, at the edge as well as in the browser.
        return json({ dishes, day }, 200, 60 * 60 * 24)
      },
    },
  },
})
