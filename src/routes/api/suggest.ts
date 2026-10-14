import { createFileRoute } from '@tanstack/react-router'

import { ALL_DISHES } from '#/lib/dishes'
import { langLine } from '#/lib/lang'

/*
 * /api/suggest — what to eat next, argued from what you already liked.
 *
 * Different question from /api/chat, and that is why it is a different route.
 * The chat answers whatever is asked in a sentence or two. This is handed a
 * list of dishes somebody has actually enjoyed plus a few answers about
 * tonight, and has to come back with specific dishes and a reason for each.
 *
 * NOTHING IT NAMES IS TRUSTED. The model is told the catalogue and asked to
 * choose from it, and then every name it returns is matched against the real
 * catalogue here and anything else is dropped. That is not politeness about
 * hallucination — a dish this app does not have is a dish with no recipe, no
 * page and no way to be tapped, so an invented name is a dead end wearing the
 * app's own styling.
 *
 * The key is read from the app's secret store, same as the chat, and never
 * leaves the worker.
 */

const MODEL = 'gemini-3.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const MAX_LIKED = 24 // how much history is worth sending
const WANT = 4 // dishes asked for
const TIMEOUT_MS = 12000
const MAX_OUTPUT_TOKENS = 700

type Ask = { liked?: unknown; avoid?: unknown; answers?: unknown; lang?: unknown }

function names(raw: unknown, cap: number): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const v of raw) {
    if (typeof v !== 'string') continue
    const trimmed = v.trim().slice(0, 60)
    if (trimmed && out.indexOf(trimmed) === -1) out.push(trimmed)
    if (out.length >= cap) break
  }
  return out
}

function answerLines(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return []
  const out: string[] = []
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v !== 'string' || !v.trim()) continue
    out.push(`${k.slice(0, 30)}: ${v.trim().slice(0, 60)}`)
    if (out.length >= 6) break
  }
  return out
}

function instruction(liked: string[], avoid: string[], answers: string[]) {
  return [
    'You suggest what somebody should eat, from one fixed menu.',
    '',
    'Choose ONLY from this menu. Spell each name exactly as it appears here:',
    ALL_DISHES.map((d) => d.name).join(', '),
    '',
    liked.length
      ? 'Dishes this person has enjoyed before: ' + liked.join(', ')
      : 'You have no history for this person yet.',
    avoid.length ? 'Do not suggest these: ' + avoid.join(', ') : '',
    answers.length ? 'About tonight — ' + answers.join('; ') : '',
    '',
    `Pick ${WANT} dishes they have NOT already got in the enjoyed list. Aim for`,
    'ones that follow from what they like without being the same thing again —',
    'a reason to try it, not a echo of what they already ordered.',
    '',
    'Answer as JSON and nothing else, in this exact shape:',
    '{"picks":[{"name":"<exact menu name>","why":"<one short sentence>"}]}',
    'The why is one plain sentence, no more than about fifteen words, and it',
    'should say what connects it to their taste. No markdown, no preamble.',
  ]
    .filter(Boolean)
    .join('\n')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const Route = createFileRoute('/api/suggest')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.GEMINI_API_KEY
        if (!key) {
          console.error('suggest: GEMINI_API_KEY is not set')
          return json({ error: 'unavailable' }, 503)
        }

        let ask: Ask = {}
        try {
          ask = (await request.json()) as Ask
        } catch {
          return json({ error: 'bad_request' }, 400)
        }

        const liked = names(ask.liked, MAX_LIKED)
        const avoid = names(ask.avoid, MAX_LIKED)
        const answers = answerLines(ask.answers)

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
              systemInstruction: {
                parts: [{ text: instruction(liked, avoid, answers) + langLine(ask.lang) }],
              },
              contents: [{ role: 'user', parts: [{ text: 'What should I eat?' }] }],
              generationConfig: {
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                temperature: 0.9,
                // Asking for JSON and being given prose is the commonest way
                // this fails; the model can be told to answer in JSON properly
                // rather than asked nicely in the prompt.
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingLevel: 'low' },
              },
            }),
          })
          if (!res.ok) {
            console.error('suggest: gemini answered', res.status)
            return json({ error: res.status === 429 ? 'busy' : 'unavailable' }, 502)
          }
          payload = (await res.json()) as Answer
        } catch (err) {
          console.error('suggest: no answer', err)
          return json({ error: 'unavailable' }, 502)
        } finally {
          clearTimeout(timer)
        }

        const text = (payload?.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p?.text ?? '')
          .join('')
          .trim()

        let parsed: { picks?: { name?: unknown; why?: unknown }[] } | null = null
        try {
          parsed = JSON.parse(text)
        } catch {
          console.error('suggest: answer was not JSON')
          return json({ error: 'no_answer' }, 502)
        }

        /*
         * Every name checked against the real catalogue, case-insensitively,
         * and anything that is not in it is dropped without comment. A dish
         * this app does not have has no recipe and no page — suggesting one
         * would be a dead end in the app's own voice.
         */
        const bySlug = new Map(ALL_DISHES.map((d) => [d.name.toLowerCase(), d]))
        const seen = new Set<string>()
        const picks: { name: string; slug: string; icon: string; why: string }[] = []

        for (const raw of parsed?.picks ?? []) {
          if (typeof raw?.name !== 'string') continue
          const dish = bySlug.get(raw.name.trim().toLowerCase())
          if (!dish || seen.has(dish.slug)) continue
          seen.add(dish.slug)
          const why = typeof raw.why === 'string' ? raw.why.trim().slice(0, 160) : ''
          picks.push({ name: dish.name, slug: dish.slug, icon: dish.icon, why })
          if (picks.length >= WANT) break
        }

        if (!picks.length) {
          console.error('suggest: nothing it named was on the menu')
          return json({ error: 'no_answer' }, 502)
        }
        return json({ picks })
      },
    },
  },
})
