import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'

import { JsonLd } from '#/components/JsonLd'
import { PageShell } from '#/components/PageShell'
import { dishBySlug, relatedTo } from '#/lib/dishes'
import { photoFor, photoPath } from '#/lib/dish-photos'
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
 * across every dish URL. Thin near-duplicates like that are what Google calls
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
    const photo = photoFor(dish.slug)
    return {
      ...dish,
      recipes: recipesFor(dish.name),
      quickest: quickest(dish.name),
      related: relatedTo(dish),
      photo: photo
        ? {
            ...photo,
            path: photoPath(dish.slug, photo),
            // Phones get a lighter copy; Google and shared links get the full one.
            srcSet: photo.src.includes('/1280px-')
              ? `${photoPath(dish.slug, photo, 500)} 500w, ${photoPath(dish.slug, photo, 960)} 960w, ${photoPath(dish.slug, photo)} 1280w`
              : undefined,
          }
        : null,
    }
  })

export const Route = createFileRoute('/eat/$dish')({
  loader: async ({ params }) => {
    const [viewer, dish] = await Promise.all([
      loadViewer(),
      loadDish({ data: { slug: params.dish } }),
    ])
    /*
     * A dish that does not exist is a 404, not a page saying so with a 200.
     * Google calls the second a "soft 404" and lists it as an error in Search
     * Console; it also had to be told noindex on every one of them.
     */
    if (!dish) throw notFound()
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
      // The dish's own photograph on a shared link, where there is one.
      image: dish.photo
        ? { url: `${SITE_URL}${dish.photo.path}`, width: dish.photo.width, height: dish.photo.height, alt: dish.name }
        : undefined,
    })
  },
  component: EatPage,
  notFoundComponent: DishNotFound,
})

function DishNotFound() {
  return (
    <PageShell user={null}>
      <main className="px-6 py-16 text-center fade-in-up sm:py-24">
        <h1 className="text-4xl font-bold sm:text-5xl">That one is not on the menu</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-[var(--text-dim)]">
          There are {DISH_COUNT} dishes in here, though, and about twenty seconds between you and one of them.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href="/decide/" className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90">
            Play morsels45
          </a>
          <Link to="/eat" className="text-sm text-[var(--amber)] underline underline-offset-4">
            See all {DISH_COUNT} dishes
          </Link>
        </div>
      </main>
    </PageShell>
  )
}

/*
 * Recipe schema.
 *
 * Every field here is read off the recipe the app itself serves, so the markup
 * and the page cannot disagree — which is the actual rule, not a style choice:
 * structured data that describes something the reader cannot see is a manual
 * penalty waiting to happen.
 *
 * `image` is the photograph shown at the top of the page: a real photo of the
 * dish from Wikimedia Commons, credited under it (scripts/dish-photos.mjs).
 * It used to be left out, because the only picture to hand was the site's own
 * share card, and that is not a photograph of ramen. Without it Google will
 * not show a recipe as a rich result, so a dish with no photo still has none.
 * The cuisine is the one Wikipedia's article names; the category is read off
 * the dish's own tags.
 */
type SchemaDish = { name: string; blurb: string; slug: string; tags: string[]; photo: { path: string; cuisine: string | null } | null }

function recipeCategory(tags: string[]) {
  if (tags.includes('drink')) return 'Drink'
  if (tags.includes('breakfast')) return 'Breakfast'
  if (tags.includes('sweet') && !tags.includes('meat')) return 'Dessert'
  if (tags.includes('soupy')) return 'Soup'
  return 'Main course'
}

const KEYWORD_TAGS: Record<string, string> = { quick: 'quick', healthy: 'healthy', spicy: 'spicy', comfort: 'comfort food', cheap: 'budget', handheld: 'street food' }

function recipeSchema(dish: SchemaDish, recipe: Recipe) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: `${dish.name} — ${recipe.name}`,
    description: dish.blurb,
    url: `${SITE_URL}/eat/${dish.slug}`,
    ...(dish.photo ? { image: [`${SITE_URL}${dish.photo.path}`] } : {}),
    totalTime: isoDuration(recipe.time),
    recipeYield: `${recipe.serves} ${recipe.serves === 1 ? 'serving' : 'servings'}`,
    recipeCategory: recipeCategory(dish.tags),
    ...(dish.photo?.cuisine ? { recipeCuisine: dish.photo.cuisine } : {}),
    keywords: [dish.name.toLowerCase(), ...dish.tags.filter((t) => KEYWORD_TAGS[t]).map((t) => KEYWORD_TAGS[t])].join(', '),
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step) => ({ '@type': 'HowToStep', text: step })),
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  }
}

// Home › All dishes › this one, as search results show it under the title.
function breadcrumbSchema(dish: { name: string; slug: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'All dishes', item: `${SITE_URL}/eat` },
      { '@type': 'ListItem', position: 3, name: dish.name, item: `${SITE_URL}/eat/${dish.slug}` },
    ],
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
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
                <span aria-hidden="true">{dish.icon} </span>
                {dish.name}
              </h1>
              <p className="mt-4 text-lg text-[var(--text-dim)]">{dish.blurb}</p>
              {dish.photo ? (
                <figure className="mt-8">
                  <img
                    src={dish.photo.path}
                    srcSet={dish.photo.srcSet}
                    sizes="(max-width: 720px) 100vw, 672px"
                    width={dish.photo.width}
                    height={dish.photo.height}
                    alt={dish.name}
                    fetchPriority="high"
                    className="mx-auto h-auto w-full rounded-2xl object-cover"
                    style={{ aspectRatio: `${dish.photo.width} / ${dish.photo.height}` }}
                  />
                  {/* The credit each photo's licence asks for. */}
                  <figcaption className="mt-2 text-xs text-[var(--text-dim)]">
                    Photo:{' '}
                    <a href={dish.photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {dish.photo.credit}
                    </a>
                    {', '}
                    {dish.photo.licenseUrl ? (
                      <a href={dish.photo.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2">
                        {dish.photo.license}
                      </a>
                    ) : (
                      dish.photo.license
                    )}
                    , via Wikimedia Commons. A photo of the dish, not of these exact recipes.
                  </figcaption>
                </figure>
              ) : (
                <div className="mt-6 text-7xl leading-none" aria-hidden="true">
                  {dish.icon}
                </div>
              )}
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
            <JsonLd data={breadcrumbSchema(dish)} />
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
