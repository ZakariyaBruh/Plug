import { createFileRoute } from '@tanstack/react-router'

import { gate, json, readJson, str } from '#/lib/gate'
import { takeAllowance } from '#/lib/hub-store'
import { fetchPage, readRecipe, safeUrl } from '#/lib/recipe-import'

/*
 * /api/recipe-import — paste the address of any recipe page, get the recipe
 * back without the page around it (Premium). See lib/recipe-import.ts for
 * how, and for the fence around the fetch. Thirty imports a day per account.
 *
 * It only reads; saving to the cookbook is a separate, deliberate tap.
 */
export const Route = createFileRoute('/api/recipe-import')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const body = await readJson<{ url?: unknown }>(request, 4 * 1024)
        const url = safeUrl(str(body?.url, 2000))
        if (!url) return json({ error: 'bad_url' }, 400)
        if (!(await takeAllowance(who.userId, 'recipe-import', 30))) return json({ error: 'daily_limit' }, 429)

        const page = await fetchPage(url)
        if ('error' in page) return json({ error: page.error }, 422)
        const recipe = readRecipe(page.html, page.url)
        if (!recipe) return json({ error: 'no_recipe' }, 422)
        return json({ recipe })
      },
    },
  },
})
