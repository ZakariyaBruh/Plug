import { createFileRoute } from '@tanstack/react-router'

import { aiRefusal, askJson } from '#/lib/ai'
import { allowedDishes, cleanRules, matchDish, menuText } from '#/lib/catalogue'
import { gate, json, readJson, str } from '#/lib/gate'
import { takeAllowance } from '#/lib/hub-store'

/*
 * /api/party — a dinner party, planned (Premium).
 *
 * Give it the guests and what each of them does not eat, when you want to
 * sit down and how many courses, and it comes back with a menu everybody at
 * the table can eat and a cooking timeline that works backwards from the
 * time you serve.
 *
 * Everybody can eat it because the rules are applied before the model is
 * asked anything: the menu it chooses from is the catalogue minus every
 * dish that breaks ANY guest's rules, and every dish it names is checked
 * against that again on the way out. Ten plans a day per account.
 */
type Guest = { name: string; rules: string[] }
const COURSES = ['Nibbles', 'Starter', 'Main', 'Side', 'Pudding'] as const

function guests(raw: unknown): Guest[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 16).map((g, i) => {
    const r = (g ?? {}) as Record<string, unknown>
    return { name: str(r.name, 40) || `Guest ${i + 1}`, rules: cleanRules(r.rules) }
  })
}

export const Route = createFileRoute('/api/party')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const body = await readJson<{ guests?: unknown; courses?: unknown; style?: unknown; hostRules?: unknown }>(request, 16 * 1024)
        const list = guests(body?.guests)
        const hostRules = cleanRules(body?.hostRules)
        if (!list.length) return json({ error: 'no_guests' }, 400)
        const wanted = (Array.isArray(body?.courses) ? body.courses : ['Starter', 'Main', 'Pudding'])
          .filter((c): c is (typeof COURSES)[number] => (COURSES as readonly string[]).includes(c as string))
        const courses = wanted.length ? [...new Set(wanted)] : ['Starter', 'Main', 'Pudding']
        const style = str(body?.style, 160)
        if (!(await takeAllowance(who.userId, 'party', 10))) return json({ error: 'daily_limit' }, 429)

        const everyone = [...new Set([...hostRules, ...list.flatMap((g) => g.rules)])]
        const menu = allowedDishes(everyone)
        if (menu.length < courses.length) return json({ error: 'too_restrictive' }, 422)

        const result = await askJson<{
          menu?: { course?: unknown; name?: unknown; why?: unknown }[]
          timeline?: { minutesBefore?: unknown; task?: unknown }[]
          tips?: unknown
        }>(
          'party',
          [
            'You plan a dinner party menu that belongs together as one meal, and the cooking timeline for it.',
            `Courses wanted, in order: ${courses.join(', ')}. One dish per course.`,
            'Choose ONLY from this menu, spelled exactly — every dish on it is safe for every guest:',
            menuText(menu),
            style ? `The host says: "${style}"` : '',
            'Then a timeline for one home cook working backwards from the moment everybody sits down:',
            'minutesBefore is how many minutes before sitting down each task starts (0 = at the table, may be negative',
            'for tasks during the meal, e.g. -40 to put pudding in). 8 to 16 tasks, each a short imperative line.',
            'Plus two or three hosting tips specific to this menu.',
            'Answer as JSON only: {"menu":[{"course":"Starter","name":"<exact menu name>","why":"…"}],"timeline":[{"minutesBefore":180,"task":"…"}],"tips":["…"]}',
          ].filter(Boolean).join('\n'),
          [{ text: `${list.length} guests.` }],
          { maxTokens: 1800, temperature: 0.7 },
        )
        if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))

        const used = new Set<string>()
        const plan = (result.value.menu ?? []).flatMap((m) => {
          const course = typeof m?.course === 'string' && (COURSES as readonly string[]).includes(m.course) ? m.course : null
          const dish = matchDish(m?.name, everyone)
          if (!course || !dish || used.has(dish.name)) return []
          used.add(dish.name)
          return [{ course, name: dish.name, icon: dish.icon, why: typeof m.why === 'string' ? m.why.slice(0, 160) : '' }]
        })
        const timeline = (result.value.timeline ?? []).flatMap((t) => {
          const at = Math.round(Number(t?.minutesBefore))
          if (!Number.isFinite(at) || at > 72 * 60 || at < -240 || typeof t?.task !== 'string') return []
          return [{ minutesBefore: at, task: t.task.slice(0, 200) }]
        }).sort((a, b) => b.minutesBefore - a.minutesBefore).slice(0, 18)
        const tips = Array.isArray(result.value.tips) ? result.value.tips.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 200)).slice(0, 3) : []
        if (!plan.length) return json({ error: 'no_answer' }, 502)
        return json({ menu: plan, timeline, tips, guests: list.map((g) => g.name), ruledOut: everyone })
      },
    },
  },
})
