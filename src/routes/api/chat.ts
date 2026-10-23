import { createFileRoute } from '@tanstack/react-router'

import { ALL_DISHES } from '#/lib/dishes'
import { askGemini } from '#/lib/gemini'
import { askFree } from '#/lib/free-ai'
import { localAnswer } from '#/lib/free-local'
import { langLine } from '#/lib/lang'
import { BONUS_CLAIMS_PER_DAY, BONUS_PER_CLAIM, premiumFor, spendOnStanding, standing, type Standing } from '#/lib/allowance'

// What the page needs to offer a sponsor page, and to say how many are left of it.
const bonusOffer = (s: Standing) => ({ per: BONUS_PER_CLAIM, claimsLeft: Math.max(0, BONUS_CLAIMS_PER_DAY - s.claims) })

/*
 * /api/chat — the food assistant, in two tiers.
 *
 * STANDARD answers on free providers, routed and health-checked (lib/free-ai.ts: LLM7 and Pollinations, plus any keyed free tier
 * whose secret is set), then, only if every one of them fails, on the cheapest Gemini model, capped; and when even that does not
 * answer, a plain pick from the app's own menu (lib/free-local.ts), said to be what it is and not
 * counted: three questions a day per free Whop account, counted in the database, and what a
 * Premium member can switch to for a quick answer. ADVANCED is Gemini, on this
 * app's own key, for Premium only, and ONLY Gemini: when Gemini is slow it is asked again on other Gemini models, and when
 * it still cannot answer the member is told so, never handed to a free provider. It knows your taste profile, can read a
 * photo, can look things up on the web, suggests where to take the
 * conversation next, answers with cards you can keep (a week's plan, a shopping list, meal prep,
 * a nutrition estimate, a dinner for guests, a recipe) and has room to answer properly. The tier is asked for by
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
  swap: 'They are missing or avoiding an ingredient: say what to use instead, in what quantity, and what changes about the dish, and if nothing really replaces it, say so and offer the nearest dish that does without.',
  scale: 'They want a recipe made for a different number of people: give the new quantities for that number, rounded to things a person can measure, then a short shopping list of only what they would need to buy.',
  budget: 'They are cooking on a budget: keep to cheap staples, give a rough cost per portion in the currency they used (or say the cost is approximate and name no currency), and say where the saving comes from.',
  leftovers: 'They have leftovers or odd ingredients: give two or three ideas ranked by effort, using what they have named and as little else as possible, and say how long each takes.',
  pair: 'They want something to go with what they are having: a drink, a side and a pudding if it fits, one pick each, with the reason in a line.',
  // The ones below answer with a card (see CARD_SKILLS): the thing to keep, with a line or two of reply over it.
  week: 'They want a week of meals. Put it in the card: one section per day (the days of the week, starting tomorrow unless they say otherwise), each item a meal with a few words on why it fits. Vary the cuisines and the effort, put the quick dinners on the busy days, and reuse ingredients across days so the shopping stays short. Ask nothing first: pick, and say in the reply what you assumed.',
  shop: 'They want a shopping list. Put it in the card: one section per part of the shop (Fruit and veg, Meat and fish, Dairy and eggs, Tins and dry goods, Bakery, Frozen, Other), each item with its quantity, combined across everything they named so nothing is listed twice, and leave out basics nobody runs out of unless the recipe needs a lot of them.',
  prep: 'They want to meal prep. Put it in the card: a section "Cook once" (what to cook, in what order, with timings so the oven and hob overlap), a section "Containers" (what goes in which, and how many portions), and a section "Keep and reheat" (how long each keeps in the fridge or freezer and how to reheat it so it is not sad). Say in the reply how long the whole session takes.',
  macros: 'They want to know what is in it. Put it in the card: a section "Per serving" with calories, protein, carbohydrate, fat, fibre and salt as rounded estimates (say "about"), and a section "Notes" with the two biggest things moving the numbers and one easy change that improves them. These are estimates from typical quantities: say so in the reply, in one clause, and never present them as exact or as medical advice.',
  diet: 'They want a dish made to fit a way of eating (vegan, vegetarian, gluten-free, dairy-free, halal, kosher, low-carb, nut-free, or what they name). Say first whether it can be done well and what changes, then give the full recipe in the recipe object with every substitution built into the quantities. For halal and kosher, name the ingredients that need checking on the label (gelatine, alcohol, stock, rennet, meat source) instead of saying it is fine.',
  host: 'They are having people over. Put it in the card: a section "Menu" (starter, main, side, pudding, drink: one pick each that works together and that can mostly be done ahead), a section "Quantities" (for the number of guests they gave, or six if they gave none, in things a person can buy), and a section "Timeline" (working backwards from when they want to eat: the day before, the morning, then every 15 to 30 minutes of the last two hours). Ask about allergies and what they will not eat only if they have not said.',
  teach: 'They want to understand a technique or the reason behind something in cooking. Explain it the way a good cook would at the counter: the principle in one or two sentences, the three or four things that decide whether it works, the mistake nearly everybody makes, and a quick way to practise it with something cheap.',
  look: 'They have attached a photo. Work out what it is and answer for that: a fridge or cupboard (what you can see, then two or three things to cook from it, ranked by effort, saying what you would need to buy), a menu (the two best orders for them given their rules and taste, and the one to avoid, with a line each), a packet or label (read the ingredients and say plainly anything that conflicts with their food rules, allergens and E-numbers worth knowing, and whether it is something they would want), or a dish (what it is, and how to make it). Say when something in the photo is too small or blurry to read, rather than guessing.',
}

// Skills whose answer is a thing to keep, so the model is asked for the card object as well.
const CARD_SKILLS = new Set(['week', 'shop', 'prep', 'macros', 'host'])

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
  else {
    lines.push('', 'After the answer, offer two or three short follow-ups they might actually tap next (under 45 characters each, written as what the person would say).')
    lines.push('When, and only when, you are giving them ONE complete recipe to cook, also fill in the recipe object (name, serves, minutes, every ingredient with its quantity, every step) so the app can offer to save it. For anything else leave it out.')
    lines.push('When the answer is a list or a plan to keep (a week of meals, a shopping list, a prep plan, nutrition figures, a plan for guests), fill in the card object (title, optional note, and sections each with a heading and short items) and keep the reply to a line or two that says what is in it and what you assumed. Do not repeat the card in the reply. For anything else leave the card out.')
  }
  return lines.join('\n')
}

type Recipe = { name: string; serves: number; minutes: number | null; ingredients: string[]; steps: string[] }
type Card = { title: string; note: string; sections: { heading: string; items: string[] }[] }
type Reply = { reply: string; followups: string[]; sources: { title: string; url: string }[]; recipe?: Recipe; card?: Card }

function cleanRecipe(raw: unknown): Recipe | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const text = (v: unknown, n: number) => String(typeof v === 'string' ? v : '').replace(/[\r\n]+/g, ' ').trim().slice(0, n)
  const list = (v: unknown, cap: number, each: number) => (Array.isArray(v) ? v.map((x) => text(x, each)).filter(Boolean).slice(0, cap) : [])
  const name = text(r.name, 120)
  const ingredients = list(r.ingredients, 40, 160)
  const steps = list(r.steps, 30, 500)
  if (!name || ingredients.length < 2 || steps.length < 2) return undefined
  const serves = Math.round(Number(r.serves))
  const minutes = Math.round(Number(r.minutes))
  return {
    name,
    serves: Number.isFinite(serves) && serves > 0 ? Math.min(serves, 50) : 2,
    minutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(minutes, 1440) : null,
    ingredients,
    steps,
  }
}

function cleanCard(raw: unknown): Card | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const text = (v: unknown, n: number) => String(typeof v === 'string' ? v : '').replace(/[\r\n]+/g, ' ').trim().slice(0, n)
  const title = text(r.title, 100)
  const sections = (Array.isArray(r.sections) ? r.sections : [])
    .map((x) => {
      const sec = (x ?? {}) as Record<string, unknown>
      const items = (Array.isArray(sec.items) ? sec.items : []).map((i) => text(i, 220)).filter(Boolean).slice(0, 40)
      return { heading: text(sec.heading, 60), items }
    })
    .filter((x) => x.items.length)
    .slice(0, 14)
  if (!title || !sections.length) return undefined
  return { title, note: text(r.note, 300), sections }
}

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
    const parsed = JSON.parse(text) as { reply?: unknown; followups?: unknown; recipe?: unknown; card?: unknown }
    const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : ''
    const followups = (Array.isArray(parsed.followups) ? parsed.followups : [])
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 3)
    if (reply) return { reply, followups, sources, recipe: cleanRecipe(parsed.recipe), card: cleanCard(parsed.card) }
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
        return json({ left: mine.left, limit: mine.limit, account: mine.who === 'account', bonus: bonusOffer(mine) })
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
          const asked = typeof sent.skill === 'string' && sent.skill in SKILLS ? sent.skill : 'chat'
          // "Read a photo" with no photo is just a question.
          const skill = asked === 'look' && !image ? 'chat' : asked
          const search = sent.search === true && !image
          const contents = turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] as Record<string, unknown>[] }))
          if (image) contents[contents.length - 1].parts.push({ inlineData: image })

          const body = JSON.stringify({
            systemInstruction: { parts: [{ text: advancedInstruction(profile, skill, search) + langLine(want) }] },
            contents,
            ...(search ? { tools: [{ google_search: {} }] } : {}),
            generationConfig: {
              maxOutputTokens: CARD_SKILLS.has(skill) ? 4000 : 2400,
              temperature: 0.8,
              thinkingConfig: { thinkingLevel: ['plan', 'compare', 'week', 'prep', 'host', 'diet', 'macros'].includes(skill) ? 'medium' : 'low' },
              ...(search
                ? {}
                : {
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: 'OBJECT',
                      properties: {
                        reply: { type: 'STRING' },
                        followups: { type: 'ARRAY', items: { type: 'STRING' } },
                        recipe: {
                          type: 'OBJECT',
                          properties: {
                            name: { type: 'STRING' },
                            serves: { type: 'INTEGER' },
                            minutes: { type: 'INTEGER' },
                            ingredients: { type: 'ARRAY', items: { type: 'STRING' } },
                            steps: { type: 'ARRAY', items: { type: 'STRING' } },
                          },
                          required: ['name', 'ingredients', 'steps'],
                        },
                        card: {
                          type: 'OBJECT',
                          properties: {
                            title: { type: 'STRING' },
                            note: { type: 'STRING' },
                            sections: {
                              type: 'ARRAY',
                              items: {
                                type: 'OBJECT',
                                properties: { heading: { type: 'STRING' }, items: { type: 'ARRAY', items: { type: 'STRING' } } },
                                required: ['heading', 'items'],
                              },
                            },
                          },
                          required: ['title', 'sections'],
                        },
                      },
                      required: ['reply'],
                    },
                  }),
            },
          })

          // GEMINI AND NOTHING ELSE. First the main model with the quick one overlapped behind it; if neither answered
          // (overloaded, rate-limited, timed out) one more round on the other Gemini models. A refusal that asking again
          // cannot change (a bad key, a bad request) is not asked twice. The free providers are never in this path.
          const main = process.env.GEMINI_ADVANCED_MODEL?.trim() || 'gemini-3.5-flash'
          let ask = await askGemini(key, body, 'chat-advanced', {
            models: [main, 'gemini-3.5-flash-lite'],
            staggerMs: 6000,
            attemptMs: 18000,
            timeoutMs: 20000,
          })
          if (!ask.res && (ask.lastStatus === 0 || ask.lastStatus === 429 || ask.lastStatus >= 500)) {
            ask = await askGemini(key, body, 'chat-advanced-2', {
              models: ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'],
              staggerMs: 2500,
              attemptMs: 10000,
              timeoutMs: 12000,
            })
          }
          const { res, lastStatus } = ask
          const out = res ? readGemini(await res.json().catch(() => null), !search) : null
          if (!out) {
            if (res) console.error('chat: advanced answer had no text')
            return json({ error: res ? 'no_answer' : lastStatus === 429 ? 'busy' : 'unavailable' }, 502)
          }
          return json({ ...out, mode: 'advanced', left: null, limit: mine.limit })
        }

        // STANDARD: three a day for a free account, nothing to count for Premium.
        const outOfFree = mine.used !== null && mine.used >= mine.limit
        const prem = outOfFree ? await premiumFor(request, mine) : false
        const metered = !(outOfFree && prem)
        if (metered && mine.left === 0) return json({ error: 'limit', left: 0, limit: mine.limit, bonus: bonusOffer(mine) }, 402)

        const system = instruction() + langLine(want)
        // The free providers, then (askFree does this itself) one capped call to the cheapest Gemini model. If nothing
        // answers, the question is not counted and the visitor asks again.
        // The free model is terse when left alone ("Pizza."); a pick with a reason is the answer.
        const free = await askFree(system + '\nAlways answer in at least two complete sentences, and give the reason for a pick.', turns)
        const reply = free?.text ?? ''
        if (!reply) {
          // No free model answered. A question that is plainly about what to eat (or about this
          // app) is answered from the app's own menu and fact list instead, and said to be: the
          // page marks it, and it is not counted, because it is not the assistant. Anything else
          // is still "busy", because a menu has nothing to say to it.
          const last = turns[turns.length - 1]?.text ?? ''
          const local = localAnswer(last)
          if (local) return json({ reply: local.text, left: mine.left, limit: mine.limit, mode: 'standard', degraded: local.kind, bonus: bonusOffer(mine) })
          return json({ error: 'busy' }, 502)
        }

        // Counted only now that there is an answer to give: a question the
        // model never answered is not one the visitor got.
        let left: number | null = null
        if (metered) {
          const used = await spendOnStanding(mine)
          if (used !== null) left = Math.max(0, mine.limit - used)
        }
        return json({ reply, left, limit: mine.limit, mode: 'standard' })
      },
    },
  },
})
