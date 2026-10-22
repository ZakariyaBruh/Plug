import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AdSlot } from '#/components/AdSlot'
import { PageShell } from '#/components/PageShell'
import { loadViewer } from '#/lib/viewer'
import { JsonLd } from '#/components/JsonLd'
import { DISH_COUNT, OFFER, SITE_NAME, SITE_TITLE, SITE_META_DESCRIPTION, SITE_URL, pageHead, track } from '#/lib/site'

export const Route = createFileRoute('/')({
  loader: () => loadViewer(),
  head: () => ({
    ...pageHead({
      path: '/',
      title: SITE_TITLE,
      description: SITE_META_DESCRIPTION,
    }),
    meta: [
      ...(pageHead({
        path: '/',
        title: SITE_TITLE,
        description: SITE_META_DESCRIPTION,
      }).meta || []),
      {
        name: '8c05a9c7e728a9bdcd859b116fa7b4d7c713ac2c',
        content: '8c05a9c7e728a9bdcd859b116fa7b4d7c713ac2c',
      },
    ],
  }),
  component: HomePage,
})

/*
 * The site and who is behind it. Organization with a logo is what search
 * engines use for the name and icon beside results from this site.
 */
const SITE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
  },
]

const HOME_TIERS: { name: string; note: string; premium?: boolean; items: [string, string][] }[] = [
  {
    name: 'Free',
    note: 'No sign-up.',
    items: [
      ['Decide', 'answer a few either-ors, get one dish; seven ways to play'],
      [`${DISH_COUNT} dishes`, 'with recipes and shopping lists'],
      ['Your food rules', 'halal, kosher, vegetarian, an allergy — never offered again'],
      ['Ask the AI', 'three food questions a day'],
      ['Food news', 'the day’s headlines from eight publishers'],
      ['Nearby', 'somewhere close that actually serves it'],
    ],
  },
  {
    name: 'Free with an account',
    note: 'Just sign in with Whop — same on every device.',
    items: [
      ['Meal-prep calendar', 'plan the week; its AI fills the gaps and plans your prep'],
      ['TV to cook and eat to', 'one group free every day (food shows, music, comedy, travel and more); every group with Premium'],
      ['Radio to cook and eat to', 'one group free every day (food and dining, jazz, classical, oldies and more); every group with Premium'],
      ['Kitchen timers & converter', 'several timers at once; cups, ounces, gas marks'],
      ['In season', 'what is good this month, and what to cook with it'],
      ['The daily three', 'a mood, one good thing, a food question'],
    ],
  },
  {
    name: 'Premium',
    note: `${OFFER}.`,
    premium: true,
    items: [
      ['Shopping list', 'your whole week, merged and sorted by aisle'],
      ['Nutrition & budget', 'your week counted and costed, with cheaper swaps'],
      ['Dinner party planner', 'a menu every guest can eat, and a timeline'],
      ['Your own recipes', 'type them, photograph them, or paste them in'],
      ['Recipes from websites', 'just the recipe, from almost any site'],
      ['Scan food', 'how healthy is it? a plain answer and a score'],
      ['Fridge photo', 'snap the fridge, get dinner'],
      ['Hands-free cook mode', 'steps read aloud; say “next”'],
      ['Daily AI briefing', 'the food news in a minute'],
      ['Shared browser', 'order, shop or cook along together, a cursor each'],
      ['Learns your taste', 'stops repeating itself; six more ways to play'],
    ],
  },
]

function HomePage() {
  const viewer = Route.useLoaderData()

  useEffect(() => {
    track('view_content', { page: 'home' })
  }, [])

  return (
    <PageShell user={viewer.user}>
      <JsonLd data={SITE_SCHEMA} />
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% -10%, #e0a34014, transparent 60%)',
            }}
          />
          <div className="relative mx-auto max-w-3xl px-6 pt-16 pb-24 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              morsels45
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">
              Everything food,
              <br />
              <em className="font-semibold text-[var(--amber)]">in one place.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--text-dim)]">
              Decide what to eat in a few taps. Plan the week and let AI fill the gaps. Shop it,
              cook it hands-free, and catch up on food news, TV and radio &mdash; all built around
              what you do and don&rsquo;t eat.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/decide/"
                onClick={() => track('go_to_game', { from: 'home' })}
                className="rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
              >
                Open morsels45
              </a>
              <Link
                to="/info"
                className="text-sm text-[var(--amber)] underline underline-offset-4 hover:text-[var(--amber-dark)]"
              >
                See everything in it
              </Link>
            </div>
          </div>
        </section>

        {/*
          WHAT IT IS, BY WHAT IT COSTS YOU.
          The homepage sold one thing — a game that decides dinner — and the
          price next to it read as $3.45 a month for a questionnaire. What is
          actually here is a food hub, and the honest way to show a hub is all
          of it at once, sorted by what each part asks of you: nothing, a
          sign-in, or Premium. Short lines; /info and /premium have the detail.
        */}
        <section className="border-t border-[var(--border)] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold">What&rsquo;s inside</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {HOME_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={
                    'rounded-2xl border p-7 ' +
                    (tier.premium ? 'border-[var(--amber)] bg-[var(--amber-soft)]' : 'border-[var(--border)]')
                  }
                >
                  <p className={'text-sm font-semibold uppercase tracking-widest ' + (tier.premium ? 'text-[var(--amber)]' : 'text-[var(--text-dim)]')}>
                    {tier.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-dim)]">{tier.note}</p>
                  <ul className="mt-5 space-y-3 text-sm">
                    {tier.items.map(([title, line]) => (
                      <li key={title}>
                        <span className="font-semibold">{title}</span>{' '}
                        <span className="text-[var(--text-dim)]">&mdash; {line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <Link
                to="/premium"
                className="rounded-full border border-[var(--amber)] px-6 py-3 text-sm font-semibold text-[var(--amber)] hover:bg-[var(--amber-soft)]"
              >
                See Premium &mdash; {OFFER}
              </Link>
              <p className="text-xs text-[var(--text-dim)]">Deciding and your food rules stay free, whatever you choose.</p>
            </div>
          </div>
        </section>
        <AdSlot placement="end" premium={viewer.hasPremium} className="mx-auto max-w-3xl px-6 pb-12" />
      </main>
    </PageShell>
  )
}
