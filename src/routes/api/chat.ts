import { createFileRoute } from '@tanstack/react-router'

import { ALL_DISHES } from '#/lib/dishes'
import { COST, FREE_PER_DAY, charge, metered } from '#/lib/credits'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'
import { checkProductAccess } from '#/lib/session'

/*
 * /api/chat — the food assistant.
 *
 * WHY THE KEY IS NOT IN THE PAGE. Gemini bills per call against one key, and a
 * key in front-end JavaScript is a key anybody can read and spend. It lives in
 * the app's secret store, is read here as an env binding, and never leaves the
 * worker — the browser only ever sees the words that came back. This is the
 * whole reason the chat is a route rather than a fetch from the game.
 *
 * NO LONGER FREE FOR EVERYONE, and the limits below changed shape because of
 * it. It used to be that there was no sign-in to hide behind and no paywall to
 * slow anybody down, so every request was assumed to be a stranger's. Now
 * there are three callers, and they are told apart before the model is asked
 * anything: Premium is unlimited, a signed-in visitor gets a daily allowance
 * and then pays a point a message, and a stranger gets a small taste and a
 * prompt to sign in. What has not changed is that the request itself is still
 * assumed to be hostile — the question is capped, the history is capped, the
 * answer is capped, and one address can still only ask so often.
 *
 * NOTHING FROM THE BROWSER IS TRUSTED. Messages are strings typed by whoever
 * is on the page. They are length-limited and passed to Gemini as content,
 * never interpolated into the system instruction — the instruction is built
 * here from this repo's own dish list, so a message cannot rewrite it by
 * pretending to be one. What comes back is returned as data and rendered with
 * textContent at the other end.
 */

const MODEL = 'gemini-3.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

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
/*
 * HOW THIS THING IS MADE TO ANSWER.
 *
 * The wait was never generation. Against the streaming endpoint the first
 * token and the last are about a hundred milliseconds apart, so the model
 * writes the whole answer almost instantly. What varies is whether it starts
 * at all: asked four different models in a row, three answered 503 "currently
 * experiencing high demand" after seventeen to twenty-one seconds. The free
 * tier is oversubscribed, and a request that loses that draw is slow and then
 * useless.
 *
 * Two things follow. A refusal has to be retried rather than reported — the
 * old code hedged against slowness only, so a fast 503 came straight back as
 * an error when trying again would very likely have worked. And attempts
 * should overlap rather than queue, because waiting out one bad draw before
 * taking the next costs the reader the sum of both.
 *
 * So: a second attempt, started once the first has failed or has been quiet
 * for STAGGER_MS, and the first real answer wins — a 503, a 429 or a timeout
 * just loses its go.
 *
 * TWO, NOT MORE, AND THIS IS THE INTERESTING PART. Retrying costs quota, and
 * quota is the thing actually running out: firing three attempts each for
 * twelve questions in under a minute got every single one refused with 429,
 * where the same test at two attempts answered every time. Past a point the
 * cure is the disease, and on a free key that point is low.
 */
const STAGGER_MS = 2500
const MAX_ATTEMPTS = 2
const ATTEMPT_MS = 10000
const TIMEOUT_MS = 12000

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

/*
 * The anonymous taste, and why it is smaller than the signed-in allowance.
 *
 * Chat used to be free to everyone with no sign-in at all, and metering it
 * changes that. What decides the size of this number is not generosity, it is
 * that signing out has to be a worse deal than signing in — otherwise the
 * credits are decorative and the way to get free chat is to open a private
 * window.
 *
 * It is counted the same best-effort way as the burst limit above, in this
 * isolate's memory, with the same honest caveat: it stops the ordinary case
 * and it does not stop somebody spreading requests across isolates. Signed-in
 * users are counted in the database instead, where the count is real.
 */
const ANON_FREE_PER_DAY = 5
const anon = new Map<string, { n: number; day: string }>()

function anonOverDay(who: string): boolean {
  const day = new Date().toISOString().slice(0, 10)
  if (anon.size > 5000) {
    for (const [key, hit] of anon) if (hit.day !== day) anon.delete(key)
  }
  const hit = anon.get(who)
  if (!hit || hit.day !== day) {
    anon.set(who, { n: 1, day })
    return false
  }
  hit.n += 1
  return hit.n > ANON_FREE_PER_DAY
}

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

/*
 * Overlapping attempts, first real answer wins.
 *
 * Every attempt carries its own controller so the losers are cancelled as
 * soon as one succeeds — a request nobody is waiting for still costs money
 * and still counts against a quota that is evidently already strained.
 */
async function askGemini(key: string, body: string): Promise<Response | null> {
  const running: AbortController[] = []
  let winnerControl: AbortController | null = null
  let settled = false
  let lastStatus = 0

  // NEVER the winner's own controller. Aborting that cancels the response
  // whose body is about to be read, which looks exactly like the model
  // answering with nothing — a fast, repeatable "no_answer" that has nothing
  // to do with the model at all.
  const stopOthers = (keep?: AbortController) => {
    for (const c of running) if (c !== keep) c.abort()
  }

  const attempt = async (): Promise<Response> => {
    const control = new AbortController()
    running.push(control)
    const timer = setTimeout(() => control.abort(), ATTEMPT_MS)
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        signal: control.signal,
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body,
      })
      // A refusal is not an answer. Throwing here keeps it out of the race so
      // another attempt can still win, instead of this one "finishing" first
      // with a 503 and taking the whole request down with it.
      if (!res.ok) {
        lastStatus = res.status
        throw new Error('gemini ' + res.status)
      }
      settled = true
      winnerControl = control
      stopOthers(control)
      return res
    } finally {
      clearTimeout(timer)
    }
  }

  const tries: Promise<Response>[] = [attempt()]
  const winner = Promise.any(
    // Promise.any needs every entry up front, so the later attempts are
    // promises that wait their turn and then only bother if nobody has won.
    [
      tries[0],
      ...Array.from({ length: MAX_ATTEMPTS - 1 }, (_, i) =>
        new Promise<void>((r) => setTimeout(r, STAGGER_MS * (i + 1))).then(() => {
          if (settled) throw new Error('already answered')
          return attempt()
        }),
      ),
    ],
  )

  const capped = new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS))
  const result = await Promise.race([winner.catch(() => null), capped])
  // Same rule on the way out: tidy up the losers, leave the winner's body
  // alone so the caller can actually read it.
  stopOthers(winnerControl ?? undefined)
  if (!result) {
    console.error('chat: no attempt answered', lastStatus ? 'last status ' + lastStatus : 'timed out')
    return null
  }
  return result
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
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

        /*
         * Who is asking, and on whose tab.
         *
         * Premium is unlimited — it is the thing people already paid for, and
         * putting a second currency in front of it would be selling the same
         * access twice. Everyone else gets a daily allowance and then pays a
         * point a message.
         *
         * This costs two round trips to Whop before the model is called. That
         * is the price of knowing who is asking, and it is why the anonymous
         * path skips it entirely.
         */
        const { signedIn, hasAccess, user } = await checkProductAccess(PREMIUM_PRODUCT_ID)

        let credits: { how: string; remainingFree: number; balance: number } | null = null

        if (!signedIn || !user) {
          // metered() as well as the count: with credits switched off this
          // path has to behave exactly as it did before any of this existed,
          // which means the daily cap goes away too, not just the charging.
          if (metered() && anonOverDay(who)) {
            return json(
              { error: 'sign_in', freePerDay: FREE_PER_DAY.chat, anonFreePerDay: ANON_FREE_PER_DAY },
              402,
            )
          }
        } else if (!hasAccess) {
          const charged = await charge(user.sub, 'chat').catch((err: unknown) => {
            // The ledger being unreachable must not take the chat down with
            // it. Answering free is the wrong-but-harmless failure; refusing
            // an answer somebody may have paid for is the other kind.
            console.error('chat: could not charge credits', err)
            return null
          })
          if (charged && !charged.ok) {
            return json(
              {
                error: 'no_credits',
                balance: charged.balance,
                cost: COST.chat,
                freePerDay: FREE_PER_DAY.chat,
              },
              402,
            )
          }
          if (charged) {
            credits = { how: charged.how, remainingFree: charged.remainingFree, balance: charged.balance }
          }
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

        const answer = await askGemini(key, body)
        if (!answer) return json({ error: 'unavailable' }, 502)
        if (!answer.ok) {
          console.error('chat: gemini answered', answer.status)
          // 429 from Gemini is the account's own quota, not this visitor's —
          // told apart so the page can say which it was.
          return json({ error: answer.status === 429 ? 'busy' : 'unavailable' }, 502)
        }

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

        return json({ reply, credits })
      },
    },
  },
})
