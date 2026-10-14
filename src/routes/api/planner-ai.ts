import { createFileRoute } from '@tanstack/react-router'

import { aiRefusal, askJson } from '#/lib/ai'
import { allowedDishes, cleanRules, dishNames, matchDish, menuText } from '#/lib/catalogue'
import { gate, json, readJson } from '#/lib/gate'
import { takeAllowance } from '#/lib/hub-store'

/*
 * /api/planner-ai — the calendar's assistant, and nothing but.
 *
 * Free with an account, and STRICTLY FOR THE CALENDAR: there is no question
 * box. It does three things to the week on screen and only those —
 *
 *   fill     put a dish in the empty slots you picked
 *   prep     turn the week's dishes into a batch-cooking session
 *   balance  read the week back and suggest a few swaps
 *
 * — so it cannot be turned into a general chatbot, by design and by
 * construction: the action is a fixed word, the rest of the input is the
 * plan, and the answer is checked against the catalogue and your rules
 * before any of it reaches the page. Fifteen requests a day per account.
 */
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_NAME: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const PER_DAY = 15

type Body = { action?: unknown; slots?: unknown; fill?: unknown; rules?: unknown; liked?: unknown }

function slotKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const [day, meal] = value.split('-')
  return (DAYS as readonly string[]).includes(day) && (MEALS as readonly string[]).includes(meal) ? `${day}-${meal}` : null
}

/** The week as "Monday dinner: Lasagne" lines, catalogue dishes only. */
function readSlots(raw: unknown): { lines: string[]; dishes: string[]; filled: Set<string> } {
  const lines: string[] = []
  const dishes: string[] = []
  const filled = new Set<string>()
  if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const slot = slotKey(key)
      if (!slot) continue
      const names = dishNames(value, 3)
      if (!names.length) continue
      filled.add(slot)
      const [day, meal] = slot.split('-')
      lines.push(`${DAY_NAME[day]} ${meal}: ${names.join(' + ')}`)
      for (const n of names) if (!dishes.includes(n)) dishes.push(n)
    }
  }
  return { lines, dishes, filled }
}

const SCOPE =
  'You are the assistant inside a meal-prep calendar app. You only ever plan meals for the week shown. ' +
  'You do not answer questions, chat, or write anything that is not about this week of meals.'

export const Route = createFileRoute('/api/planner-ai')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await gate(request, 'account')
        if ('refuse' in who) return who.refuse
        const body = await readJson<Body>(request, 32 * 1024)
        if (!body) return json({ error: 'bad_request' }, 400)
        const action = body.action
        if (action !== 'fill' && action !== 'prep' && action !== 'balance') return json({ error: 'bad_request' }, 400)

        const rules = cleanRules(body.rules)
        const liked = dishNames(body.liked, 20)
        const week = readSlots(body.slots)

        if (action === 'fill') {
          const wanted = (Array.isArray(body.fill) ? body.fill : []).map(slotKey).filter((s): s is string => !!s && !week.filled.has(s))
          const slots = [...new Set(wanted)].slice(0, 28)
          if (!slots.length) return json({ error: 'nothing_to_fill' }, 400)
          if (!(await takeAllowance(who.userId, 'planner-ai', PER_DAY))) return json({ error: 'daily_limit' }, 429)

          const menu = allowedDishes(rules)
          const result = await askJson<{ fills?: { slot?: unknown; name?: unknown; why?: unknown }[] }>(
            'planner-ai fill',
            [
              SCOPE,
              'Fill the empty slots listed by the user with dishes from this menu ONLY, spelled exactly as written:',
              menuText(menu),
              '',
              'Breakfast slots get breakfast food. Snack slots get something small or sweet. Lunch is lighter than dinner.',
              'Vary the week: no dish twice, not the same kind of dish two nights running, at least one quick dinner midweek.',
              week.lines.length ? 'Already planned this week:\n' + week.lines.join('\n') : 'Nothing is planned yet this week.',
              liked.length ? 'They have enjoyed: ' + liked.join(', ') : '',
              'Answer as JSON only: {"fills":[{"slot":"<slot id as given>","name":"<exact menu name>","why":"<under 12 words>"}]}',
            ]
              .filter(Boolean)
              .join('\n'),
            [{ text: 'Empty slots to fill: ' + slots.join(', ') }],
            { maxTokens: 1600, temperature: 0.8 },
          )
          if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))

          const used = new Set(week.dishes)
          const fills: { slot: string; name: string; icon: string; why: string }[] = []
          for (const f of result.value.fills ?? []) {
            const slot = slotKey(f?.slot)
            const dish = matchDish(f?.name, rules)
            if (!slot || !slots.includes(slot) || !dish || used.has(dish.name) || fills.some((x) => x.slot === slot)) continue
            used.add(dish.name)
            fills.push({ slot, name: dish.name, icon: dish.icon, why: typeof f.why === 'string' ? f.why.slice(0, 120) : '' })
          }
          if (!fills.length) return json({ error: 'no_answer' }, 502)
          return json({ fills })
        }

        if (!week.dishes.length) return json({ error: 'empty_week' }, 400)
        if (!(await takeAllowance(who.userId, 'planner-ai', PER_DAY))) return json({ error: 'daily_limit' }, 429)

        if (action === 'prep') {
          const result = await askJson<{
            sessions?: { title?: unknown; minutes?: unknown; tasks?: unknown }[]
            keeps?: unknown
          }>(
            'planner-ai prep',
            [
              SCOPE,
              'Turn this week of meals into a batch-cooking plan: one or two prep sessions (usually Sunday, maybe a',
              'short Wednesday top-up) that do the chopping, sauces, grains and marinades ahead, so each day is quick.',
              'Be specific to these dishes. Each task one short imperative line naming the dish it is for.',
              'Also say what keeps how long in the fridge.',
              'Answer as JSON only: {"sessions":[{"title":"Sunday","minutes":90,"tasks":["…"]}],"keeps":["…"]}',
            ].join('\n'),
            [{ text: 'This week:\n' + week.lines.join('\n') }],
            { maxTokens: 1400, temperature: 0.5 },
          )
          if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))
          const sessions = (result.value.sessions ?? []).slice(0, 3).flatMap((s) => {
            const tasks = Array.isArray(s?.tasks) ? s.tasks.filter((t): t is string => typeof t === 'string').map((t) => t.slice(0, 160)).slice(0, 14) : []
            if (!tasks.length) return []
            const minutes = Number(s?.minutes)
            return [{ title: typeof s?.title === 'string' ? s.title.slice(0, 40) : 'Prep', minutes: Number.isFinite(minutes) ? Math.max(10, Math.min(300, Math.round(minutes))) : null, tasks }]
          })
          const keeps = Array.isArray(result.value.keeps) ? result.value.keeps.filter((k): k is string => typeof k === 'string').map((k) => k.slice(0, 140)).slice(0, 8) : []
          if (!sessions.length) return json({ error: 'no_answer' }, 502)
          return json({ sessions, keeps })
        }

        // balance
        const menu = allowedDishes(rules)
        const result = await askJson<{ notes?: unknown; swaps?: { slot?: unknown; to?: unknown; why?: unknown }[] }>(
          'planner-ai balance',
          [
            SCOPE,
            'Read this week back and judge its balance: variety, vegetables, how heavy it is, repeats, how much',
            'cooking it asks on weeknights. Give two to four short notes, then up to three swaps. A swap replaces',
            'what is in one slot with a dish from this menu ONLY, spelled exactly:',
            menuText(menu),
            'Answer as JSON only: {"notes":["…"],"swaps":[{"slot":"<day-meal, e.g. tue-dinner>","to":"<exact menu name>","why":"<under 14 words>"}]}',
          ].join('\n'),
          [{ text: 'This week (slot ids are day-meal, mon…sun, breakfast/lunch/dinner/snack):\n' + week.lines.join('\n') }],
          { maxTokens: 1000, temperature: 0.6 },
        )
        if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))
        const notes = Array.isArray(result.value.notes) ? result.value.notes.filter((n): n is string => typeof n === 'string').map((n) => n.slice(0, 180)).slice(0, 4) : []
        const swaps = (result.value.swaps ?? []).flatMap((s) => {
          const slot = slotKey(s?.slot)
          const dish = matchDish(s?.to, rules)
          if (!slot || !week.filled.has(slot) || !dish || week.dishes.includes(dish.name)) return []
          return [{ slot, name: dish.name, icon: dish.icon, why: typeof s.why === 'string' ? s.why.slice(0, 120) : '' }]
        }).slice(0, 3)
        if (!notes.length && !swaps.length) return json({ error: 'no_answer' }, 502)
        return json({ notes, swaps })
      },
    },
  },
})
