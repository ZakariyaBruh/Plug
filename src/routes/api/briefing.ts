import { createFileRoute } from '@tanstack/react-router'

import { aiRefusal, askJson } from '#/lib/ai'
import { allowedDishes, matchDish, menuText } from '#/lib/catalogue'
import { today } from '#/lib/allowance'
import { gate, json } from '#/lib/gate'
import { cacheGet, cachePut } from '#/lib/hub-store'
import { latestStories } from '#/lib/news'

/*
 * /api/briefing — today's food news in a minute (Premium).
 *
 * The same stories the News section lists, read by the model once a morning
 * and boiled down to the five worth knowing, each linked back to the
 * publisher's own article, plus one thing to cook because of them. One
 * briefing a day for everybody — it is the same news whoever asks — so it is
 * written by whoever opens it first and kept until the day turns (UTC).
 *
 * Every link in it is checked against the stories it was given; the model
 * cannot invent a source.
 */
type Briefing = {
  day: string
  headline: string
  items: { text: string; source: string; link: string }[]
  cook: { name: string; icon: string; why: string } | null
}

export const Route = createFileRoute('/api/briefing')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const day = today()
        const key = `brief:v1:${day}`
        const cached = await cacheGet<Briefing>(key)
        if (cached) return json({ briefing: cached }, 200, 'private, max-age=600')

        const stories = (await latestStories()).slice(0, 30)
        if (!stories.length) return json({ error: 'no_news' }, 502)
        const numbered = stories.map((s, i) => `[${i + 1}] ${s.source}: ${s.title}${s.summary ? ' — ' + s.summary.slice(0, 220) : ''}`)
        const result = await askJson<{ headline?: unknown; items?: { text?: unknown; story?: unknown }[]; cook?: { name?: unknown; why?: unknown } }>(
          'briefing',
          [
            'You write a short morning briefing of food news for home cooks, from the numbered stories given.',
            'Pick the five most interesting or useful. For each, one or two plain sentences in your own words, and the',
            'number of the story it comes from. Then a one-line headline for the day. Then one dish to cook today',
            'inspired by the news, from this menu ONLY, spelled exactly:',
            menuText(allowedDishes([])),
            'Answer as JSON only: {"headline":"…","items":[{"text":"…","story":1}],"cook":{"name":"<exact menu name>","why":"…"}}',
          ].join('\n'),
          [{ text: numbered.join('\n') }],
          { maxTokens: 1200, temperature: 0.5 },
        )
        if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))

        const items = (result.value.items ?? []).flatMap((it) => {
          const story = stories[Math.round(Number(it?.story)) - 1]
          if (!story || typeof it?.text !== 'string') return []
          return [{ text: it.text.slice(0, 400), source: story.source, link: story.link }]
        }).slice(0, 5)
        if (!items.length) return json({ error: 'no_answer' }, 502)
        const dish = matchDish(result.value.cook?.name)
        const briefing: Briefing = {
          day,
          headline: typeof result.value.headline === 'string' ? result.value.headline.slice(0, 140) : 'Today in food',
          items,
          cook: dish ? { name: dish.name, icon: dish.icon, why: typeof result.value.cook?.why === 'string' ? result.value.cook.why.slice(0, 160) : '' } : null,
        }
        await cachePut(key, briefing, 26 * 3600 * 1000)
        return json({ briefing }, 200, 'private, max-age=600')
      },
    },
  },
})
