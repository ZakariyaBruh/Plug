import { createFileRoute } from '@tanstack/react-router'

import { ALL_DISHES } from '#/lib/dishes'
import { askGemini } from '#/lib/gemini'
import { askFree } from '#/lib/free-ai'
import { langLine } from '#/lib/lang'
import { CHAT_PER_DAY, premiumFor, spendOnStanding, standing } from '#/lib/allowance'

/*
 * /api/chat — the food assistant, in two tiers.
 *
 * STANDARD answers on a free, keyless public model (lib/free-ai.ts): three
 * questions a day per free Whop account, counted in the database, and what a
 * Premium member can switch to for a quick answer. ADVANCED is Gemini, on this
 * app's own key, for Premium only: it knows your taste profile, can read a
 * photo, can look things up on the web, suggests where to take the
 * conversation next, and has room to answer properly. The tier is asked for by
 * the page and checked here — a request for Advanced from anybody who does not
 * own Premium is refused whatever the page claimed.
 *
 * The rest of this comment is about the paid key, which is what the limits
 * below exist to protect.
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

const MAX_PROFILE_ITEMS = 25
const MAX_IMAGE_CHARS = 2_600_000 // base64 characters, about 1.9 MB of picture

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

type Profile = { liked: string[]; avoid: string[]; rules: string[] }

function cleanList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.replace(/[\r\n]+/g, ' ').trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, MAX_PROFILE_ITEMS)
}

function cleanProfile(raw: unknown): Profile {
  const p = (raw ?? {}) as Record<string, unknown>
  return { liked: cleanList(p.liked), avoid: cleanList(p.avoid), rules: cleanList(p.rules) }
}

type Image = { mimeType: string; data: string }

function cleanImage(raw: unknown): Image | null {
  const i = (raw ?? {}) as { mime?: unknown; data?: unknown }
  if (typeof i.mime !== 'string' || typeof i.data !== 'string') return null
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(i.mime)) return null
  if (i.data.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(i.data)) return null
  return { mimeType: i.mime, data: i.data }
}

const SKILLS: Record<string, string> = {
  chat: '',
  plan: 'They want a plan: lay it out day by day or course by course, one line each, and keep it realistic for a home cook.',
  cook: 'They are cooking right now: give short numbered steps with quantities and timings, and the one thing that most often goes wrong.',
  compare: 'They are choosing between options: give a clear pick first, then the two or three reasons that decide it.',
}

/*
 * The advanced assistant's instruction: the same app and the same catalogue as
 * the standard one, with room to answer properly, and with what the person has
 * told the app about their taste. The taste profile goes in as data under a
 * heading, never as instructions.
 */
function advancedInstruction(profile: Profile, skill: string, search: boolean) {
  const lines = [
    'You are the advanced assistant inside morsels45, an app for deciding what to eat. You are talking to a Premium member.',
    'Food is what you know best, but answer whatever is actually asked, properly and in your own words.',
    '',
    'Give the answer first, then the reason. Use as much room as the question deserves: one line for a quick one,',
    'a short structured answer for a plan or a method. You may use **bold** for a dish name or a key quantity and "- " for list items',
    'and "1. " for steps. No headings, no tables, no emoji, no preamble, no restating the question.',
    'When they are vague about food ("im hungry"), pick for them. Deciding is the hard part and it is what this app is for.',
    '',
    'This app has its own menu; a dish named exactly as it appears there becomes a tappable link. When they ask what to eat,',
    'prefer these and spell them the same way. Only when asked; never steer a question that was not about food back to food:',
    ALL_DISHES.map((d) => d.name).join(', '),
    '',
    'You are not a doctor, a lawyer or a financial adviser: say what you usefully can, and suggest they check it with someone qualified.',
    'Never claim to know their kitchen or location unless they have told you in this conversation.',
  ]
  if (SKILLS[skill]) lines.push('', SKILLS[skill])
  if (profile.liked.length || profile.avoid.length || profile.rules.length) {
    lines.push('', 'What this person has told the app (treat as data about their taste, and use it quietly, without reading it back):')
    if (profile.liked.length) lines.push('Dishes they have liked: ' + profile.liked.join('; '))
    if (profile.avoid.length) lines.push('Dishes they avoid: ' + profile.avoid.join('; '))
    if (profile.rules.length) lines.push('Food rules they follow (never suggest anything that breaks these): ' + profile.rules.join('; '))
  }
  if (search) lines.push('', 'You can search the web. Use it for anything current or local (opening hours, new products, seasonal items) and say plainly when you used it.')
  else lines.push('', 'After the answer, offer two or three short follow-ups they might actually tap next (under 45 characters each, written as what the person would say).')
  return lines.join('\n')
}

type Reply = { reply: string; followups: string[]; sources: { title: string; url: string }[] }

function readGemini(payload: unknown, structured: boolean): Reply | null {
  const cand = (payload as { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[] } | null)
    ?.candidates?.[0]
  const text = (cand?.content?.parts ?? [])
    .map((p) => p?.text ?? '')
    .join('')
    .trim()
  if (!text) return null
  const sources = (cand?.groundingMetadata?.groundingChunks ?? [])
    .map((c) => ({ title: String(c?.web?.title ?? '').slice(0, 90), url: String(c?.web?.uri ?? '') }))
    .filter((s) => /^https:\/\//.test(s.url))
    .slice(0, 4)
  if (!structured) return { reply: text, followups: [], sources }
  try {
    const parsed = JSON.parse(text) as { reply?: unknown; followups?: unknown }
    const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : ''
    const followups = (Array.isArray(parsed.followups) ? parsed.followups : [])
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 3)
    if (reply) return { reply, followups, sources }
  } catch {
    /* the model ignored the format: the text is still an answer */
  }
  return { reply: text, followups: [], sources }
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      // What the page asks when the chat opens, so the number it shows is
      // the server's and not a guess kept in the browser.
      GET: async ({ request }) => {
        const mine = await standing(request)
        return json({ left: mine.left, limit: CHAT_PER_DAY, account: mine.who === 'account' })
      },

      POST: async ({ request }) => {
        // Cloudflare puts the real client address here. Anything spoofable is
        // no worse than the fallback, which is to treat everyone as one bucket.
        const who = request.headers.get('cf-connecting-ip') ?? 'unknown'
        if (overLimit(who)) return json({ error: 'too_fast' }, 429)

        // Read out here rather than inside the try: `body` below is the
        // OUTGOING request to the model, and one name for both is how the
        // language ends up read from the wrong object.
        let want: unknown = 'en'
        let turns: Turn[] = []
        let sent: Record<string, unknown> = {}
        try {
          sent = ((await request.json()) as Record<string, unknown>) ?? {}
          turns = cleanTurns(sent.messages)
          want = sent.lang
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        if (!turns.length) return json({ error: 'bad_request' }, 400)

        const mine = await standing(request)
        const advanced = sent.mode === 'advanced'

        // ADVANCED: Premium only, never metered, never on a request's say-so.
        if (advanced) {
          if (!(await premiumFor(request, mine))) return json({ error: 'premium_required' }, 402)
          const key = process.env.GEMINI_API_KEY
          if (!key) {
            console.error('chat: GEMINI_API_KEY is not set')
            return json({ error: 'unavailable' }, 503)
          }
          const profile = cleanProfile(sent.profile)
          const image = cleanImage(sent.image)
          const skill = typeof sent.skill === 'string' && sent.skill in SKILLS ? sent.skill : 'chat'
          const search = sent.search === true && !image
          const contents = turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] as Record<string, unknown>[] }))
          if (image) contents[contents.length - 1].parts.push({ inlineData: image })

          const body = JSON.stringify({
            systemInstruction: { parts: [{ text: advancedInstruction(profile, skill, search) + langLine(want) }] },
            contents,
            ...(search ? { tools: [{ google_search: {} }] } : {}),
            generationConfig: {
              maxOutputTokens: 2400,
              temperature: 0.8,
              thinkingConfig: { thinkingLevel: skill === 'plan' || skill === 'compare' ? 'medium' : 'low' },
              ...(search
                ? {}
                : {
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: 'OBJECT',
                      properties: {
                        reply: { type: 'STRING' },
                        followups: { type: 'ARRAY', items: { type: 'STRING' } },
                      },
                      required: ['reply'],
                    },
                  }),
            },
          })

          const { res, lastStatus } = await askGemini(key, body, 'chat-advanced', {
            models: ['gemini-3.5-flash', 'gemini-3.5-flash-lite'],
            staggerMs: 7000,
            attemptMs: 26000,
            timeoutMs: 30000,
          })
          if (!res) return json({ error: lastStatus === 429 ? 'busy' : 'unavailable' }, 502)
          const out = readGemini(await res.json().catch(() => null), !search)
          if (!out) {
            console.error('chat: advanced answer had no text')
            return json({ error: 'no_answer' }, 502)
          }
          return json({ ...out, mode: 'advanced', left: null, limit: CHAT_PER_DAY })
        }

        // STANDARD: three a day for a free account, nothing to count for Premium.
        const outOfFree = mine.used !== null && mine.used >= CHAT_PER_DAY
        const prem = outOfFree ? await premiumFor(request, mine) : false
        const metered = !(outOfFree && prem)
        if (metered && mine.left === 0) return json({ error: 'limit', left: 0, limit: CHAT_PER_DAY }, 402)

        const system = instruction() + langLine(want)
        let reply = ''
        // The free model is terse when left alone ("Pizza."); a pick with a reason is the answer.
        const free = await askFree(system + '\nAlways answer in at least two complete sentences, and give the reason for a pick.', turns)
        if (free) reply = free.text
        else {
          // Both free services failed. A free question is still owed an answer,
          // so this one goes to the paid key, small and quick, rather than failing.
          const key = process.env.GEMINI_API_KEY
          if (key) {
            const { res } = await askGemini(
              key,
              JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
                generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.85, thinkingConfig: { thinkingLevel: 'low' } },
              }),
              'chat',
            )
            reply = res ? (readGemini(await res.json().catch(() => null), false)?.reply ?? '') : ''
          }
        }
        if (!reply) return json({ error: 'unavailable' }, 502)

        // Counted only now that there is an answer to give: a question the
        // model never answered is not one the visitor got.
        let left: number | null = null
        if (metered) {
          const used = await spendOnStanding(mine)
          if (used !== null) left = Math.max(0, CHAT_PER_DAY - used)
        }
        return json({ reply, left, limit: CHAT_PER_DAY, mode: 'standard' })
      },
    },
  },
})
