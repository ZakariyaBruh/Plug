import { createFileRoute } from '@tanstack/react-router'

import { ALL_DISHES } from '#/lib/dishes'

/*
 * /api/menu — three courses that go together, argued for.
 *
 * The app already builds a menu on its own, by scoring every dish against
 * each course and marking down whatever repeats the evening (see COURSES and
 * buildMenu in decide/js/app.js). That is fast, works with no signal, and is
 * the fallback when this route cannot answer — but it only knows tags. It
 * cannot be told "six of us, one is vegetarian, and it is thirty degrees out".
 *
 * This can. Two ways in, because people arrive in two moods: answer a couple
 * of questions, or just say the thing. Either way the model is handed the real
 * catalogue and has to choose from it.
 *
 * NOTHING IT NAMES IS TRUSTED, same as /api/suggest. Every name comes back
 * through the real catalogue and anything invented is dropped. A dish this app
 * does not have has no recipe, no page and no icon — an invented one is a dead
 * end wearing the app's own styling.
 */

const MODEL = 'gemini-3.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const COURSES = ['starter', 'main', 'pudding'] as const
const MAX_LIKED = 20
const MAX_PROMPT = 400
const TIMEOUT_MS = 12000
const MAX_OUTPUT_TOKENS = 700

type Ask = {
  mode?: unknown
  prompt?: unknown
  answers?: unknown
  liked?: unknown
  avoid?: unknown
  /*
   * Courses to leave alone. The game stopped sending this when the menu
   * became a run of one course at a time (there is nothing to pin: a course
   * you have agreed to is already settled and never re-asked). Still honoured,
   * because a browser holding a cached copy of the old game will keep sending
   * it for as long as its service worker takes to catch up, and answering
   * those requests worse than before is not an upgrade.
   */
  keep?: unknown
}

/*
 * Courses the person has pinned, as {course: dish name}.
 *
 * Only names that are really in the catalogue survive, and only for the three
 * real courses — this arrives from a browser and a pinned dish is about to be
 * quoted into a prompt, so it is checked on the way in like everything else.
 */
function kept(raw: unknown): { course: string; name: string }[] {
  if (!raw || typeof raw !== 'object') return []
  const byName = new Map(ALL_DISHES.map((d) => [d.name.toLowerCase(), d]))
  const out: { course: string; name: string }[] = []
  for (const [course, value] of Object.entries(raw as Record<string, unknown>)) {
    const slot = String(course).toLowerCase()
    if (!COURSES.includes(slot as (typeof COURSES)[number])) continue
    if (typeof value !== 'string') continue
    const dish = byName.get(value.trim().toLowerCase())
    if (dish) out.push({ course: slot, name: dish.name })
  }
  return out
}

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

function instruction(
  said: string,
  liked: string[],
  avoid: string[],
  pinned: { course: string; name: string }[],
) {
  return [
    'You write a three course menu from one fixed catalogue of dishes.',
    '',
    'Choose ONLY from this catalogue. Spell each name exactly as written here:',
    ALL_DISHES.map((d) => d.name).join(', '),
    '',
    said ? 'What they told you: ' + said : '',
    liked.length ? 'Dishes they have enjoyed before: ' + liked.join(', ') : '',
    avoid.length ? 'Never choose these: ' + avoid.join(', ') : '',
    /*
     * A kept course is settled, and the rest of the meal is chosen around it.
     * This is the whole point of the Keep button: "the main is right, fix the
     * rest of the evening to it" is a different and much better instruction
     * than "try again".
     */
    pinned.length
      ? 'These courses are already decided and must come back EXACTLY as they are: ' +
        pinned.map((p) => `${p.course} = ${p.name}`).join(', ') +
        '. Choose the other courses to go with them.'
      : '',
    '',
    'Pick exactly three dishes — a starter, a main and a pudding — and they',
    'have to work as one meal. Not three heavy things. Not three cold ones.',
    'Not three of the same cuisine unless that is the point of it. The starter',
    'should leave room for the main, and the pudding should suit what came',
    'before it. Three different dishes; never the same one twice.',
    '',
    'If what they told you rules something out — a diet, an allergy, no oven,',
    'no time, a fussy guest, the weather — that governs all three choices.',
    '',
    'WHERE THEY ARE EATING CHANGES THE ANSWER. If they are going out or',
    'ordering in, choose dishes worth paying somebody else to make — the ones',
    'that are a faff at home, or better from a kitchen with the right kit —',
    'and ignore how long they said they have, because that is a waiting time',
    'and not a cooking time. If they are cooking, the time they gave is a hard',
    'limit across all three courses together, and a starter or pudding that',
    'needs no cooking is a good way to spend it on the main.',
    '',
    'Answer as JSON and nothing else, in this exact shape:',
    '{"courses":[{"course":"starter","name":"<exact catalogue name>","why":"<one short sentence>"},',
    '{"course":"main","name":"...","why":"..."},{"course":"pudding","name":"...","why":"..."}]}',
    'Each why is one plain sentence, fifteen words at most, saying why that',
    'dish belongs in this particular meal. No markdown, no preamble.',
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

export const Route = createFileRoute('/api/menu')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.GEMINI_API_KEY
        if (!key) {
          console.error('menu: GEMINI_API_KEY is not set')
          return json({ error: 'unavailable' }, 503)
        }

        let ask: Ask = {}
        try {
          ask = (await request.json()) as Ask
        } catch {
          return json({ error: 'bad_request' }, 400)
        }

        /*
         * The two ways in collapse to one string before the model sees them.
         * A typed sentence and a set of answers are the same kind of thing —
         * what this person told us about tonight — and giving the model one
         * shape to read means one prompt to get right instead of two.
         */
        const typed = typeof ask.prompt === 'string' ? ask.prompt.trim().slice(0, MAX_PROMPT) : ''
        const answered = answerLines(ask.answers).join('; ')
        const said = typed || answered
        if (!said) return json({ error: 'bad_request' }, 400)

        const liked = names(ask.liked, MAX_LIKED)
        const avoid = names(ask.avoid, MAX_LIKED)
        const pinned = kept(ask.keep)

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
              systemInstruction: { parts: [{ text: instruction(said, liked, avoid, pinned) }] },
              contents: [{ role: 'user', parts: [{ text: 'Write me the menu.' }] }],
              generationConfig: {
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                temperature: 0.85,
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingLevel: 'low' },
              },
            }),
          })
          if (!res.ok) {
            console.error('menu: gemini answered', res.status)
            return json({ error: res.status === 429 ? 'busy' : 'unavailable' }, 502)
          }
          payload = (await res.json()) as Answer
        } catch (err) {
          console.error('menu: no answer', err)
          return json({ error: 'unavailable' }, 502)
        } finally {
          clearTimeout(timer)
        }

        const text = (payload?.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p?.text ?? '')
          .join('')
          .trim()

        let parsed: { courses?: { course?: unknown; name?: unknown; why?: unknown }[] } | null = null
        try {
          parsed = JSON.parse(text)
        } catch {
          console.error('menu: answer was not JSON')
          return json({ error: 'no_answer' }, 502)
        }

        const byName = new Map(ALL_DISHES.map((d) => [d.name.toLowerCase(), d]))
        const seen = new Set<string>()
        const filled = new Set<string>()
        const courses: { course: string; name: string; slug: string; icon: string; why: string }[] = []

        for (const raw of parsed?.courses ?? []) {
          if (typeof raw?.name !== 'string' || typeof raw?.course !== 'string') continue
          const slot = raw.course.trim().toLowerCase()
          // One dish per course and one course per dish: a menu that names the
          // same thing twice, or two mains and no pudding, is not a menu.
          if (!COURSES.includes(slot as (typeof COURSES)[number]) || filled.has(slot)) continue
          const dish = byName.get(raw.name.trim().toLowerCase())
          if (!dish || seen.has(dish.slug)) continue
          seen.add(dish.slug)
          filled.add(slot)
          const why = typeof raw.why === 'string' ? raw.why.trim().slice(0, 160) : ''
          courses.push({ course: slot, name: dish.name, slug: dish.slug, icon: dish.icon, why })
        }

        /*
         * Whatever the model did, a kept course comes back kept.
         *
         * "Keep this one" is a promise the app makes, and a promise that holds
         * only when a model feels like honouring it is not one. If it swapped
         * a pinned course, or dropped it, the pinned dish is put back into its
         * slot here and whatever the model put there is discarded.
         */
        for (const pin of pinned) {
          const dish = ALL_DISHES.find((d) => d.name === pin.name)
          if (!dish) continue
          const at = courses.findIndex((c) => c.course === pin.course)
          const row = { course: pin.course, name: dish.name, slug: dish.slug, icon: dish.icon, why: '' }
          if (at === -1) courses.push(row)
          else if (courses[at].name !== dish.name) courses[at] = row
        }

        // Fewer than two survivors is not a menu worth showing. The app falls
        // back to its own scorer, which always produces something.
        if (courses.length < 2) return json({ error: 'no_answer' }, 502)

        // Served in eating order regardless of what order they came back in.
        courses.sort((a, b) => COURSES.indexOf(a.course as never) - COURSES.indexOf(b.course as never))
        return json({ courses })
      },
    },
  },
})
