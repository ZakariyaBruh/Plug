import { createFileRoute } from '@tanstack/react-router'

import { ALL_DISHES } from '#/lib/dishes'
import { askGemini } from '#/lib/gemini'
import { CHAT_PER_DAY, isPremium, spend, today, usedToday, visitorKey } from '#/lib/allowance'

/*
 * /api/chat — the food assistant.
 *
 * WHY THE KEY IS NOT IN THE PAGE. Gemini bills per call against one key, and a
 * key in front-end JavaScript is a key anybody can read and spend. It lives in
 * the app's secret store, is read here as an env binding, and never leaves the
 * worker — the browser only ever sees the words that came back. This is the
 * whole reason the chat is a route rather than a fetch from the game.
 *
 * FREE FOR EVERYONE, which is what makes the limits below matter. There is no
 * sign-in to hide behind and no paywall to slow anybody down, so every request
 * is assumed to be a stranger's: the question is capped, the history is
 * capped, the answer is capped, and one address can only ask so often.
 *
 * NOTHING FROM THE BROWSER IS TRUSTED. Messages are strings typed by whoever
 * is on the page. They are length-limited and passed to Gemini as content,
 * never interpolated into the system instruction — the instruction is built
 * here from this repo's own dish list, so a message cannot rewrite it by
 * pretending to be one. What comes back is returned as data and rendered with
 * textContent at the other end.
 */

const MAX_MESSAGE = 500 // characters in one question
const MAX_TURNS = 12 // how far back the conversation is carried
/*
 * Headroom, not answer length. On Gemini 3 this budget covers the thinking as
 * well as the words, and thinking goes first: at 220 the model spent 207
 * tokens deciding and had nine left to speak with, so answers arrived cut off
 * mid-sentence — "A cheese quesadilla comes". What keeps the reply to one
 * sentence is the instruction, not this number, so this only has to be
 * comfortably clear of what low-effort thinking costs.
 */
const MAX_OUTPUT_TOKENS = 900
// How it is asked — two overlapping attempts on two models — is lib/gemini.ts.

/*
 * Abuse control, and an honest note about what it is.
 *
 * This worker has no KV or Durable Object binding, so there is nowhere durable
 * to count against. This counts in the isolate's own memory: it stops one
 * browser hammering the endpoint, which is the common case, and it does NOT
 * stop a determined flood spread across many isolates. It is the strongest
 * thing available without adding infrastructure, and it is deliberately cheap
 * so it cannot itself become the expensive part.
 */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 12
const seen = new Map<string, { n: number; until: number }>()

function overLimit(who: string): boolean {
  const now = Date.now()
  // Opportunistic sweep so the map cannot grow without bound in a long-lived
  // isolate. Cheap: it only ever runs when the map is already large.
  if (seen.size > 5000) {
    for (const [key, hit] of seen) if (hit.until < now) seen.delete(key)
  }
  const hit = seen.get(who)
  if (!hit || hit.until < now) {
    seen.set(who, { n: 1, until: now + WINDOW_MS })
    return false
  }
  hit.n += 1
  return hit.n > MAX_PER_WINDOW
}

type Turn = { role: 'user' | 'model'; text: string }

function cleanTurns(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return []
  const out: Turn[] = []
  for (const item of raw.slice(-MAX_TURNS)) {
    const role = (item as { role?: unknown })?.role
    const text = (item as { text?: unknown })?.text
    if (typeof text !== 'string') continue
    const trimmed = text.trim().slice(0, MAX_MESSAGE)
    if (!trimmed) continue
    out.push({ role: role === 'model' ? 'model' : 'user', text: trimmed })
  }
  // Gemini rejects a conversation that does not start with the user.
  while (out.length && out[0].role !== 'user') out.shift()
  return out
}

/*
 * The instruction, built from this repo rather than written out by hand.
 *
 * Naming the real catalogue is what makes this the app's assistant rather than
 * a general chatbot wearing its colours: asked for something cold and sweet it
 * answers with a dish the game can actually land on, which the rest of the app
 * then knows what to do with.
 */
function instruction() {
  const names = ALL_DISHES.map((d) => d.name).join(', ')
  /*
   * A GENERAL ASSISTANT THAT HAPPENS TO LIVE IN A FOOD APP.
   *
   * It was pinned to food twice over: first to naming a dish from the
   * catalogue, then to food as a subject, with an instruction to refuse
   * anything else. Both were narrower than the thing is capable of and
   * narrower than the app needs — somebody who opens a chat box asks it what
   * is in a chat box, and being told "food is all I know about" is a worse
   * answer than the real one.
   *
   * What stays is the catalogue, because that is the part only this app can
   * do: a dish named exactly as the menu spells it becomes something the
   * reader can tap through to. So food questions land somewhere, and
   * everything else is simply answered.
   */
  return [
    'You are the assistant inside morsels45, an app for deciding what to eat.',
    'Food is what the app is about and what you know best, but you are not limited to it.',
    'Answer whatever is actually asked, as helpfully as you would answer anything else.',
    '',
    'Two or three sentences unless more is genuinely needed. Plain sentences: no preamble,',
    'no restating the question back, no headings, no bullet lists, no markdown, no emoji.',
    'Hold a conversation properly — follow-ups, "why", "what about", changing their mind.',
    '',
    'When somebody is vague about food ("im hungry", "idk"), pick something for them rather',
    'than asking them to narrow it down. Deciding is the hard part; that is what this app is for.',
    '',
    'This app has its own menu, and a dish named exactly as it appears there becomes a link',
    'the reader can tap. So when they ask what to eat, prefer one of these and spell it the',
    'same way. Only when they ask: do not garnish an unrelated answer with a meal suggestion,',
    'and never steer a question back to food that was not about food:',
    names,
    '',
    'You are not a doctor, a lawyer or a financial adviser. For anything medical, legal or',
    'financial, say what you usefully can and suggest they check it with someone qualified.',
    'Never claim to know their kitchen, their location, or what they have eaten before.',
  ].join('\n')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

/*
 * Where this visitor stands today. `left` is null when the ledger could not be
 * read, which the page treats as "not counting" rather than as zero.
 */
async function standing(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const day = today()
  const key = await visitorKey(ip, day)
  const used = key ? await usedToday(key, 'chat', day) : null
  return { key, day, used, left: used === null ? null : Math.max(0, CHAT_PER_DAY - used) }
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      // What the page asks when the chat opens, so the number it shows is
      // the server's and not a guess kept in the browser.
      GET: async ({ request }) => {
        const { left } = await standing(request)
        return json({ left, limit: CHAT_PER_DAY })
      },

      POST: async ({ request }) => {
        const key = process.env.GEMINI_API_KEY
        if (!key) {
          console.error('chat: GEMINI_API_KEY is not set')
          return json({ error: 'unavailable' }, 503)
        }

        // Cloudflare puts the real client address here. Anything spoofable is
        // no worse than the fallback, which is to treat everyone as one bucket.
        const who = request.headers.get('cf-connecting-ip') ?? 'unknown'
        if (overLimit(who)) return json({ error: 'too_fast' }, 429)

        // The daily allowance. Premium is only looked up once somebody is out,
        // so the ordinary free question never waits on a call to Whop.
        const mine = await standing(request)
        const metered = !(mine.used !== null && mine.used >= CHAT_PER_DAY && (await isPremium(request)))
        if (metered && mine.left === 0) {
          return json({ error: 'limit', left: 0, limit: CHAT_PER_DAY }, 402)
        }

        let turns: Turn[] = []
        try {
          const body = (await request.json()) as { messages?: unknown }
          turns = cleanTurns(body?.messages)
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        if (!turns.length) return json({ error: 'bad_request' }, 400)

        const body = JSON.stringify({
            systemInstruction: { parts: [{ text: instruction() }] },
            contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
            generationConfig: {
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              temperature: 0.85,
              /*
               * THIS LINE IS WHY THE THING ANSWERS AT ALL.
               *
               * Gemini 3 models think before they speak, and left to their own
               * budget they think hardest about the vaguest questions — which
               * here are the commonest ones. "im hungry" took thirteen to
               * twenty-two seconds and mostly timed out, while a specific
               * question came back in about one. Nobody who has typed "im
               * hungry" is waiting twenty seconds.
               *
               * There is nothing here worth deliberating over: it is picking
               * dinner off a list of a hundred and twelve.
               */
              thinkingConfig: { thinkingLevel: 'low' },
            },
        })

        const { res: answer, lastStatus } = await askGemini(key, body, 'chat')
        // 429 from Gemini is the account's own quota, not this visitor's —
        // told apart so the page can say which it was.
        if (!answer) return json({ error: lastStatus === 429 ? 'busy' : 'unavailable' }, 502)

        const payload = (await answer.json().catch(() => null)) as {
          candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
        } | null

        const candidate = payload?.candidates?.[0]
        const reply = (candidate?.content?.parts ?? [])
          .map((p) => p?.text ?? '')
          .join('')
          .trim()

        if (!reply) {
          // A blocked or empty answer is not an error the reader caused, and
          // saying "something went wrong" would be a lie about whose fault it is.
          console.error('chat: no text in the answer', candidate?.finishReason ?? 'no candidate')
          return json({ error: 'no_answer' }, 502)
        }

        // Counted only now that there is an answer to give: a question the
        // model never answered is not one the visitor got.
        let left: number | null = null
        if (metered && mine.key) {
          const used = await spend(mine.key, 'chat', mine.day)
          if (used !== null) left = Math.max(0, CHAT_PER_DAY - used)
        }
        return json({ reply, left, limit: CHAT_PER_DAY })
      },
    },
  },
})
