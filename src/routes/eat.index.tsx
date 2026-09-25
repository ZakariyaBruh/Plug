import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { PageShell } from '#/components/PageShell'
import { ALL_DISHES } from '#/lib/dishes'
import { DISH_COUNT, pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * /eat — every dish, on one page a crawler can actually walk.
 *
 * WHY THIS PAGE HAD TO EXIST. The dish pages were orphans: nothing on this
 * site linked to any of them. The game has a Dishes screen, but the game is a
 * static script that builds its list in the browser, so a crawler sees an empty
 * div. That left sitemap.xml as the only thing that knew those URLs existed —
 * and a URL a search engine only ever hears about from a sitemap is the
 * textbook shape of "Crawled – currently not indexed". Good content on a page
 * nothing links to is still a page nothing links to.
 *
 * So this is a hub. It is a real page for a reader — the whole menu, which is
 * a fair thing to want before playing — and it is the path by which every dish
 * page becomes reachable from the homepage in two clicks.
 */
const loadDishes = createServerFn({ method: 'GET' }).handler(() =>
  [...ALL_DISHES].sort((a, b) => a.name.localeCompare(b.name)),
)

// A few groups worth leading with. Not exhaustive on purpose: the full list
// below is what carries the links, and this is what makes the page usable.
const GROUPS: { tag: string; title: string; blurb: string }[] = [
  { tag: 'quick', title: 'Quick', blurb: 'On the table before you have changed your mind.' },
  { tag: 'comfort', title: 'Comfort', blurb: 'For the evenings that have not gone well.' },
  { tag: 'healthy', title: 'Healthy', blurb: 'Without being worthy about it.' },
  { tag: 'veg', title: 'Vegetarian', blurb: 'No meat, no seafood, no argument.' },
  { tag: 'breakfast', title: 'Breakfast', blurb: 'The meal most often skipped and most often regretted.' },
  { tag: 'spicy', title: 'Spicy', blurb: 'Somewhere between a warmth and a problem.' },
  { tag: 'sweet', title: 'Sweet', blurb: 'Dessert, or breakfast, depending how the day went.' },
  { tag: 'soupy', title: 'Soups and stews', blurb: 'One bowl, one spoon, minimal cleanup.' },
  { tag: 'handheld', title: 'Handheld', blurb: 'No plate required, and no apology for that.' },
  { tag: 'cheesy', title: 'Cheesy', blurb: 'The tag that explains itself.' },
  { tag: 'seafood', title: 'Seafood', blurb: 'From a river, a reef, or a tin — still counts.' },
  { tag: 'chicken', title: 'Chicken', blurb: 'The compromise nobody has to defend.' },
]

export const Route = createFileRoute('/eat/')({
  loader: async () => {
    const [viewer, dishes] = await Promise.all([loadViewer(), loadDishes()])
    return { viewer, dishes }
  },
  head: ({ loaderData }) => {
    // DISH_COUNT rather than a literal: the build fails if it and data.js
    // disagree, which is the only thing that has ever kept this number honest.
    const count = loaderData?.dishes.length ?? DISH_COUNT
    return pageHead({
      path: '/eat',
      title: `What to eat — all ${count} dishes, with recipes`,
      description: `Every dish morsels45 can land on, each with a recipe you can start tonight. Or answer a few either-ors and let it pick for you — 20 seconds, free, no sign-up.`,
    })
  },
  component: EatIndex,
})

function DishGrid({ dishes }: { dishes: typeof ALL_DISHES }) {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {dishes.map((dish) => (
        <li key={dish.slug}>
          <Link
            to="/eat/$dish"
            params={{ dish: dish.slug }}
            className="text-[var(--text-dim)] hover:text-[var(--amber)]"
          >
            <span aria-hidden="true">{dish.icon}</span> {dish.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function EatIndex() {
  const { viewer, dishes } = Route.useLoaderData()
  const navigate = useNavigate()

  /*
   * A second way to browse a list of 450: pick one at random and land on its
   * own page, recipe and all. The game already has this move ("Endless") for
   * somebody mid-decision; this is the same idea for somebody who is just
   * looking, with nothing to answer first.
   */
  function surpriseMe() {
    const dish = dishes[Math.floor(Math.random() * dishes.length)]
    navigate({ to: '/eat/$dish', params: { dish: dish.slug } })
  }

  return (
    <PageShell user={viewer.user}>
      <main className="px-6 py-16 fade-in-up sm:py-24">
        <div className="mx-auto max-w-3xl">
          <header className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              The whole menu
            </p>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">What to eat</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--text-dim)]">
              All {dishes.length} dishes, each with a recipe you can start tonight. If reading a
              list is the last thing you want to do right now, that is rather the point of the
              game — a handful of either-ors and it picks one for you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {/* A link into the app, so it is named for going there rather
                  than for the thing the app does — same reasoning as the
                  homepage. */}
              <a
                href="/decide/"
                className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
              >
                Play now
              </a>
              <button
                type="button"
                onClick={surpriseMe}
                className="inline-block rounded-full border border-[var(--border)] px-8 py-3 font-semibold hover:border-[var(--amber)]"
              >
                Surprise me
              </button>
            </div>
          </header>

          {GROUPS.map((group) => {
            const matching = dishes.filter((dish) => dish.tags.includes(group.tag))
            if (!matching.length) return null
            return (
              <section key={group.tag} className="mt-16">
                <h2 className="text-2xl font-bold">{group.title}</h2>
                <p className="mt-2 text-[var(--text-dim)]">{group.blurb}</p>
                <DishGrid dishes={matching} />
              </section>
            )
          })}

          <section className="mt-16">
            <h2 className="text-2xl font-bold">Everything, A to Z</h2>
            <p className="mt-2 text-[var(--text-dim)]">
              All {dishes.length} of them. Every one has its own page with the recipe on it.
            </p>
            <DishGrid dishes={dishes} />
          </section>
        </div>
      </main>
    </PageShell>
  )
}
