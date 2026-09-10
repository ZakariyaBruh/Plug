import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'

import { PageShell } from '#/components/PageShell'
import { dishBySlug } from '#/lib/dishes'
import { pageHead, track } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * /eat/<dish> — where a shared answer lands.
 *
 * The share button hands out a link, and until now that link was /decide/:
 * a good page, but one that says nothing about why it arrived. Somebody sent
 * you "morsels45 says eat Ramen" and the preview underneath it was a bare URL.
 *
 * This page is the other half of that message. It names the dish in its own
 * card, so the link previews as the answer somebody actually got, and offers
 * the one thing a reader of that message wants: a go of their own.
 *
 * The slug is looked up in the real catalogue rather than prettified back into
 * words. /eat/anything-at-all would otherwise render whatever text a stranger
 * put in the URL into a card carrying this site's name.
 */
const loadDish = createServerFn({ method: 'GET' })
  .inputValidator((input: { slug: string }) => input)
  .handler(({ data }) => dishBySlug(data.slug))

export const Route = createFileRoute('/eat/$dish')({
  loader: async ({ params }) => {
    const [viewer, dish] = await Promise.all([loadViewer(), loadDish({ data: { slug: params.dish } })])
    return { viewer, dish }
  },
  head: ({ loaderData }) => {
    const dish = loaderData?.dish
    if (!dish) {
      return pageHead({
        title: 'morsels45 — what should you eat?',
        description: 'A handful of either-or questions and you have an answer. 112 dishes, no sign-up.',
        noindex: true,
      })
    }
    return pageHead({
      path: `/eat/${dish.slug}`,
      title: `${dish.name} — morsels45`,
      description: `${dish.blurb} Play the 20-second food-decision game and get your own answer — free, no sign-up.`,
      ogTitle: `morsels45 said: ${dish.name}`,
      ogDescription: `${dish.blurb} A handful of either-ors and you have your own answer.`,
    })
  },
  component: EatPage,
})

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
                There are 112 dishes in here, though, and about twenty seconds between you and one
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
            <Link to="/how-it-works" className="text-sm text-[var(--amber)] underline underline-offset-4">
              How it works
            </Link>
          </div>

          <p className="mt-6 text-sm text-[var(--text-dim)]">
            Free, no sign-up, and it works with no signal.
          </p>
        </div>
      </main>
    </PageShell>
  )
}
