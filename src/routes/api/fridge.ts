import { createFileRoute } from '@tanstack/react-router'

import { aiRefusal, askJson } from '#/lib/ai'
import { allowedDishes, cleanRules, matchDish, menuText } from '#/lib/catalogue'
import { gate, json, readJson } from '#/lib/gate'
import { takeAllowance } from '#/lib/hub-store'

/*
 * /api/fridge — a photo of the fridge or the cupboard, and what dinner it
 * can make (Premium).
 *
 * The photo goes to the model once, to list what food it can see, and is not
 * kept anywhere — not here, not in the database, not in a log. The dishes
 * come back from the catalogue only, minus anything the person does not eat,
 * each with what it uses from the photo and what would still need buying.
 * Ten photos a day per account. The page shrinks the photo before sending it.
 */
const MAX_IMAGE_CHARS = 2_000_000 // base64, after the page has resized it
const MIME = /^image\/(jpeg|png|webp)$/

type Answer = {
  seen?: unknown
  dishes?: { name?: unknown; uses?: unknown; missing?: unknown; why?: unknown }[]
}

function words(raw: unknown, cap: number, each = 40): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((w): w is string => typeof w === 'string').map((w) => w.trim().slice(0, each)).filter(Boolean).slice(0, cap)
}

export const Route = createFileRoute('/api/fridge')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const body = await readJson<{ image?: unknown; mime?: unknown; rules?: unknown }>(request, MAX_IMAGE_CHARS + 4096)
        const image = typeof body?.image === 'string' ? body.image : ''
        const mime = typeof body?.mime === 'string' && MIME.test(body.mime) ? body.mime : ''
        if (!image || !mime || image.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(image)) {
          return json({ error: 'bad_image' }, 400)
        }
        if (!(await takeAllowance(who.userId, 'fridge', 10))) return json({ error: 'daily_limit' }, 429)

        const rules = cleanRules(body?.rules)
        const menu = allowedDishes(rules)
        const result = await askJson<Answer>(
          'fridge',
          [
            'You look at a photo of somebody’s fridge, cupboard or worktop and say what dinner it can make.',
            'First list the food you can actually see (ingredients, not containers or brands), at most 25 items.',
            'If the photo shows no food, return an empty list and no dishes.',
            'Then choose up to 6 dishes from this menu ONLY, spelled exactly, that use as much of what you see as possible',
            'and need the least extra shopping:',
            menuText(menu),
            'For each: which seen items it uses, what is still missing (assume salt, pepper, oil and water are in), and one short reason.',
            'Answer as JSON only: {"seen":["…"],"dishes":[{"name":"<exact menu name>","uses":["…"],"missing":["…"],"why":"…"}]}',
          ].join('\n'),
          [{ inlineData: { mimeType: mime, data: image } }, { text: 'What can I make with this?' }],
          { maxTokens: 1400, temperature: 0.4 },
        )
        if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))

        const seen = words(result.value.seen, 25)
        const dishes = (result.value.dishes ?? []).flatMap((d) => {
          const dish = matchDish(d?.name, rules)
          if (!dish) return []
          return [{
            name: dish.name,
            icon: dish.icon,
            uses: words(d.uses, 12),
            missing: words(d.missing, 10),
            why: typeof d.why === 'string' ? d.why.slice(0, 160) : '',
          }]
        }).filter((d, i, all) => all.findIndex((x) => x.name === d.name) === i).slice(0, 6)
        return json({ seen, dishes })
      },
    },
  },
})
