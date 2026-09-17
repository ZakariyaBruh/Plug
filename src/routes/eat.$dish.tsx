import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'

import { JsonLd } from '#/components/JsonLd'
import { PageShell } from '#/components/PageShell'
import { dishBySlug, relatedTo } from '#/lib/dishes'
import { isoDuration, quickest, recipesFor, type Recipe } from '#/lib/recipes'
import { DISH_COUNT, SITE_NAME, SITE_URL, pageHead, track } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * /eat/<dish> — where a shared answer lands, and the only page here a search
 * engine has any reason to want.
 *
 * IT WAS TWO PAGES' WORTH OF JOB IN ONE PAGE'S WORTH OF CONTENT. As a thing to
 * receive it was right: somebody sent you "morsels45 said Ramen", and this
 * names the dish in its own card and offers you a go. As a thing to find, it
 * was eighty-four words — a name, a one-line blurb and a button — repeated
 * across 112 URLs. Thin near-duplicates like that are what Google calls
 * doorway pages: it crawls them and declines to index them, which is why this
 * site had 117 pages in its sitemap and no organic traffic at all.
 *
 * The fix was not to write anything new. The recipes already existed, in
 * public/decide/js/recipes.js, rendered by the game after you have already
 * decided — which is the one moment a search engine never sees. Putting them
 * on the page turns a stub into the thing somebody searching for the dish was
 * actually looking for, and the answer stays honest because it is the same
 * recipe the app itself gives you.
 */
const loadDish = createServerFn({ method: 'GET' })
  .inputValidator((input: { slug: string }) => input)
  .handler(({ data }) => {
    const dish = dishBySlug(data.slug)
    if (!dish) return null
    return {
      ...dish,
      recipes: recipesFor(dish.name),
      quickest: quickest(dish.name),
      related: relatedTo(dish),
    }
  })

export const Route = createFileRoute('/eat/$dish')({
  loader: async ({ params }) => {
    const [viewer, dish] = await Promise.all([
      loadViewer(),
      loadDish({ data: { slug: params.dish } }),
    ])
    return { viewer, dish }
  },
  head: ({ loaderData }) => {
    const dish = loaderData?.dish
    if (!dish) {
      return pageHead({
        title: 'morsels45 — what should you eat?',
        description:
          `A handful of either-or questions and you have an answer. ${DISH_COUNT} dishes, no sign-up.`,
        noindex: true,
      })
    }

    /*
     * The title is built from the recipes rather than written, so it can only
     * ever promise what the page actually has. "Ramen — morsels45" was a title
     * for a search nobody performs; "Ramen recipes — 2 ways, from 20 minutes"
     * leads with the words somebody types and is checkable against the page.
     */
    const count = dish.recipes.length
    const fastest = dish.quickest?.time
    const title = count
      ? `${dish.name} recipes — ${count === 1 ? 'one way' : `${count} ways`}` +
        (fastest ? `, from ${fastest} minutes` : '')
      : `${dish.name} — ${SITE_NAME}`

    const description = count
      ? `${count === 1 ? 'One way' : `${count} ways`} to make ${dish.name.toLowerCase()} at home` +
        (fastest ? `, the quickest in ${fastest} minutes` : '') +
        `. ${dish.blurb} Free, no sign-up.`
      : `${dish.blurb} Play the 20-second food-decision game and get your own answer — free, no sign-up.`

    return pageHead({
      path: `/eat/${dish.slug}`,
      title,
      description,
      // The share card keeps its old voice: this is still what lands in a
      // message, and "morsels45 said: Ramen" is the right thing to arrive.
      ogTitle: `morsels45 said: ${dish.name}`,
      ogDescription: `${dish.blurb} A handful of either-ors and you have your own answer.`,
    })
  },
  component: EatPage,
})

/*
 * Recipe schema, and the one thing deliberately left out of it.
 *
 * Every field here is read off the recipe the app itself serves, so the markup
 * and the page cannot disagree — which is the actual rule, not a style choice:
 * structured data that describes something the reader cannot see is a manual
 * penalty waiting to happen.
 *
 * There is no `image`, because there are no photographs of these dishes. Google
 * wants one for a recipe rich result, so leaving it out means no card with a
 * picture — and putting the site's own share card there instead would be
 * claiming a photograph of ramen that is not a photograph of ramen. Valid
 * markup with a missing optional beats a rich result built on a small lie.
 */
function recipeSchema(dish: { name: string; blurb: string; slug: string }, recipe: Recipe) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: `${dish.name} — ${recipe.name}`,
    description: dish.blurb,
    url: `${SITE_URL}/eat/${dish.slug}`,
    totalTime: isoDuration(recipe.time),
    recipeYield: `${recipe.serves} ${recipe.serves === 1 ? 'serving' : 'servings'}`,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step) => ({ '@type': 'HowToStep', text: step })),
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  }
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] p-6 text-left sm:p-8">
      <h3 className="text-xl font-bold">{recipe.name}</h3>
      <p className="mt-2 text-sm text-[var(--text-dim)]">
        {recipe.time} minutes · serves {recipe.serves} · {recipe.level}
      </p>

      <h4 className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--text-dim)]">
        What you need
      </h4>
      <ul className="mt-3 space-y-1.5">
        {recipe.ingredients.map((line) => (
          <li key={line} className="text-[var(--text-dim)]">
            {line}
          </li>
        ))}
      </ul>

      <h4 className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--text-dim)]">
        What you do
      </h4>
      <ol className="mt-3 space-y-3">
        {recipe.steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="shrink-0 font-semibold text-[var(--amber)]">{i + 1}</span>
            <span className="text-[var(--text-dim)]">{step}</span>
          </li>
        ))}
      </ol>
    </article>
  )
}

function EatPage() {
  const { viewer, dish } = Route.useLoaderData()

  useEffect(() => {
    track('view_content', { page: 'share-landing', dish: dish?.slug ?? 'unknown' })
  }, [dish])

  return (
    <PageShell user={viewer.user}>
      <main className="px-6 py-16 fade-in-up sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          {dish ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
                morsels45 said
              </p>
              <div className="mt-6 text-7xl leading-none" aria-hidden="true">
                {dish.icon}
              </div>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">{dish.name}</h1>
              <p className="mt-4 text-lg text-[var(--text-dim)]">{dish.blurb}</p>
              <p className="mx-auto mt-10 max-w-md text-[var(--text-dim)]">
                That was somebody else’s answer. Yours takes about twenty seconds: a handful of
                either-ors, then one dish.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold sm:text-5xl">That one is not on the menu</h1>
              <p className="mx-auto mt-4 max-w-md text-lg text-[var(--text-dim)]">
                There are {DISH_COUNT} dishes in here, though, and about twenty seconds between you and one
                of them.
              </p>
            </>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/decide/"
              className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              Play morsels45
            </a>
            <Link
              to="/how-it-works"
              className="text-sm text-[var(--amber)] underline underline-offset-4"
            >
              How it works
            </Link>
          </div>

          <p className="mt-6 text-sm text-[var(--text-dim)]">
            Free, no sign-up, and an answer in about twenty seconds.
          </p>
        </div>

        {dish && dish.recipes.length ? (
          <div className="mx-auto mt-20 max-w-2xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              How to make {dish.name.toLowerCase()}
            </h2>
            <p className="mt-3 text-center text-[var(--text-dim)]">
              {dish.recipes.length === 1
                ? 'One way to do it'
                : `${dish.recipes.length} genuinely different takes — a classic, and a faster or lighter route`}
              . The same ones the app hands you once you have decided.
            </p>

            <div className="mt-10 space-y-8">
              {dish.recipes.map((recipe) => (
                <RecipeCard key={recipe.name} recipe={recipe} />
              ))}
            </div>

            {dish.quickest ? <JsonLd data={recipeSchema(dish, dish.quickest)} /> : null}
          </div>
        ) : null}

        {dish && dish.related.length ? (
          <nav className="mx-auto mt-20 max-w-2xl text-center" aria-label="Similar dishes">
            <h2 className="text-2xl font-bold">If you fancy something like it</h2>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {dish.related.map((other) => (
                <li key={other.slug}>
                  <Link
                    to="/eat/$dish"
                    params={{ dish: other.slug }}
                    className="inline-block rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-dim)] hover:border-[var(--amber)] hover:text-[var(--text)]"
                  >
                    <span aria-hidden="true">{other.icon}</span> {other.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm">
              <Link to="/eat" className="text-[var(--amber)] underline underline-offset-4">
                See all {DISH_COUNT} dishes
              </Link>
            </p>
          </nav>
        ) : null}
      </main>
    </PageShell>
  )
}
