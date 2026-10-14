import { createFileRoute } from '@tanstack/react-router'

import { aiRefusal, askJson } from '#/lib/ai'
import { gate, json, readJson, str } from '#/lib/gate'
import { takeAllowance } from '#/lib/hub-store'
import { type ReadMethod, type ReadRecipe, fetchPage, pageText, plausible, readRecipe, safeUrl } from '#/lib/recipe-import'

/*
 * /api/recipe-import — a recipe from anywhere, ready for your cookbook
 * (Premium). Three ways in:
 *
 *   {url}            a recipe page on a website. Read by the readers in
 *                    lib/recipe-import.ts, best first — the site's own recipe
 *                    card, then the page's own markup, then the recipe
 *                    plugins food blogs use, then "Ingredients" and "Method"
 *                    headings — and only if none of those finds a recipe, by
 *                    the AI from the page's words.
 *   {text}           a recipe pasted in: from an email, a message, a note.
 *   {image, mime}    a photo of a recipe: a cookbook page, a magazine, a
 *                    handwritten card. Read once and not kept.
 *
 * It only reads; saving to the cookbook is a separate, deliberate tap. The
 * answer says how it was read, so the page can say "read by AI — check the
 * amounts" when that is what happened. Thirty web reads and fifteen AI reads
 * a day per account.
 */
const MAX_TEXT = 12000
const MAX_IMAGE_CHARS = 2_000_000
const MIME = /^image\/(jpeg|png|webp)$/

type AiRecipe = { none?: unknown; name?: unknown; serves?: unknown; time?: unknown; ingredients?: unknown; steps?: unknown; notes?: unknown }

const INSTRUCTION = [
  'You turn a recipe into clean structured data. Keep the cook’s own words and amounts; do not invent,',
  'improve, convert or add anything. Each ingredient is one line with its amount ("200g plain flour").',
  'Each step is one instruction. If a recipe has parts ("For the sauce"), keep that as the start of the',
  'first ingredient or step of the part. If there is no recipe at all, answer {"none": true}.',
  'Answer as JSON only: {"name":"…","serves":4,"time":45,"ingredients":["…"],"steps":["…"],"notes":"…"}',
  'serves and time (total minutes) are numbers, or null when not stated.',
].join('\n')

function lines(raw: unknown, cap: number, each: number): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((l): l is string => typeof l === 'string').map((l) => l.trim().slice(0, each)).filter(Boolean).slice(0, cap)
}

function fromAi(v: AiRecipe, source: string): ReadRecipe | null {
  if (v.none) return null
  const name = typeof v.name === 'string' ? v.name.trim().slice(0, 120) : ''
  const ingredients = lines(v.ingredients, 60, 200)
  const steps = lines(v.steps, 40, 1200)
  if (!ingredients.length || !steps.length) return null
  const serves = Math.round(Number(v.serves))
  const time = Math.round(Number(v.time))
  return {
    name: name || 'My recipe',
    serves: Number.isFinite(serves) && serves > 0 ? Math.min(serves, 50) : 2,
    time: Number.isFinite(time) && time > 0 ? Math.min(time, 1440) : null,
    ingredients,
    steps,
    source,
    image: '',
    notes: typeof v.notes === 'string' ? v.notes.trim().slice(0, 400) : '',
  }
}

export const Route = createFileRoute('/api/recipe-import')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await gate(request, 'premium')
        if ('refuse' in who) return who.refuse
        const body = await readJson<{ url?: unknown; text?: unknown; image?: unknown; mime?: unknown }>(request, MAX_IMAGE_CHARS + 16 * 1024)
        if (!body) return json({ error: 'bad_request' }, 400)

        /* ---- a photo of a recipe */
        if (typeof body.image === 'string') {
          const mime = typeof body.mime === 'string' && MIME.test(body.mime) ? body.mime : ''
          if (!mime || body.image.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(body.image)) return json({ error: 'bad_image' }, 400)
          if (!(await takeAllowance(who.userId, 'recipe-ai', 15))) return json({ error: 'daily_limit' }, 429)
          const result = await askJson<AiRecipe>(
            'recipe-photo',
            INSTRUCTION + '\nThe recipe is in the photo: a cookbook or magazine page, a printout, or a handwritten card. Read handwriting carefully.',
            [{ inlineData: { mimeType: mime, data: body.image } }, { text: 'Read this recipe.' }],
            { maxTokens: 2000, temperature: 0.1 },
          )
          if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))
          const recipe = fromAi(result.value, '')
          return recipe ? json({ recipe, method: 'ai' as ReadMethod, origin: 'photo' }) : json({ error: 'no_recipe_photo' }, 422)
        }

        /* ---- pasted text */
        if (typeof body.text === 'string') {
          const text = str(body.text, MAX_TEXT)
          if (text.length < 30) return json({ error: 'too_short' }, 400)
          if (!(await takeAllowance(who.userId, 'recipe-ai', 15))) return json({ error: 'daily_limit' }, 429)
          const result = await askJson<AiRecipe>('recipe-text', INSTRUCTION, [{ text }], { maxTokens: 2000, temperature: 0.1 })
          if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))
          const recipe = fromAi(result.value, '')
          return recipe ? json({ recipe, method: 'ai' as ReadMethod, origin: 'text' }) : json({ error: 'no_recipe_text' }, 422)
        }

        /* ---- a web page */
        const url = safeUrl(str(body.url, 2000))
        if (!url) return json({ error: 'bad_url' }, 400)
        if (!(await takeAllowance(who.userId, 'recipe-import', 30))) return json({ error: 'daily_limit' }, 429)
        const page = await fetchPage(url)
        if ('error' in page) return json({ error: page.error }, 422)
        const read = readRecipe(page.html, page.url)
        if (read) return json({ recipe: read.recipe, method: read.method, origin: 'web' })

        // Nothing structured on the page: the last resort is the AI reading its words.
        const words = pageText(page.html)
        if (words.length < 200) return json({ error: 'no_recipe' }, 422)
        if (!(await takeAllowance(who.userId, 'recipe-ai', 15))) return json({ error: 'daily_limit' }, 429)
        const result = await askJson<AiRecipe>('recipe-page', INSTRUCTION + '\nThe text below is a web page; ignore menus, adverts and comments.', [{ text: words }], { maxTokens: 2000, temperature: 0.1 })
        if (!result.ok) return json({ error: result.error }, aiRefusal(result.error))
        const recipe = fromAi(result.value, page.url)
        if (!recipe || !plausible(recipe.ingredients)) return json({ error: 'no_recipe' }, 422)
        return json({ recipe, method: 'ai' as ReadMethod, origin: 'web' })
      },
    },
  },
})
