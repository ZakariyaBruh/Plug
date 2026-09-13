import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PageShell } from '#/components/PageShell'
import { loadViewer } from '#/lib/viewer'
import { PREMIUM_PLAN_ID } from '#/lib/products'
import { InstallApp } from '#/components/InstallApp'
import { JsonLd } from '#/components/JsonLd'
import {
  DISH_COUNT,
  OFFER,
  OFFER_SHORT,
  PRICE,
  PRICE_MONTHLY,
  PRICE_VALUE,
  PREMIUM_SECTIONS,
  SITE_CARD,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  STANDARD,
  TRIAL_DAYS,
  pageHead,
  track,
} from '#/lib/site'

export const Route = createFileRoute('/')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    }),
  component: HomePage,
})

// No rating is claimed here. There is no honest number to put in one yet, and
// an invented one is the sort of thing that gets structured data ignored.
/*
 * The site's own name.
 *
 * A result for this site showed "whop.site" where the name should be, because
 * that is the registrable domain and nothing here had ever said otherwise.
 * The name in a search result comes from WebSite structured data on the
 * homepage — a different entity from the WebApplication below, which describes
 * what the thing does rather than what the site is called.
 */
const SITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: 'morsels45 — what should you eat?',
  url: SITE_URL,
}

const APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  image: SITE_CARD,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript.',
  // A search result draws the little site icon from the favicon and the
  // organisation's logo from here. They are different slots and this one was
  // empty, so there was nothing to draw. Square PNG, as the guidance asks.
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'Standard',
      price: '0',
      priceCurrency: 'USD',
      description: `The Decide game, all ${DISH_COUNT} dishes, browse and search, XP and streaks.`,
    },
    {
      '@type': 'Offer',
      name: 'Premium',
      price: String(PRICE_VALUE),
      priceCurrency: 'USD',
      description: `Always avoid, the extra modes, cook mode, the shared browser, unlimited saves. ${OFFER}.`,
      url: `${SITE_URL}/premium`,
    },
  ],
}

function HomePage() {
  const viewer = Route.useLoaderData()

  useEffect(() => {
    track('view_content', { page: 'home' })
  }, [])

  return (
    <PageShell user={viewer.user}>
      <JsonLd data={SITE_SCHEMA} />
      <JsonLd data={APP_SCHEMA} />
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% -10%, #e0a34033, transparent 60%)',
            }}
          />
          <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 text-center fade-in-up sm:pt-24">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              morsels45
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] sm:text-6xl">
              You&rsquo;re hungry.
              <br />
              You don&rsquo;t know what you want.
              <br />
              <em className="font-semibold text-[var(--amber)]">That&rsquo;s alright — I might.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--text-dim)]">
              A few easy either-ors — sweet or savoury, hot or cold, hands or cutlery — and
              we&rsquo;ll work out what you actually feel like. Usually in about eight questions.
            </p>
            {/* "Play now", not "Decide for me".
                This page and the app's own opening screen looked like the same
                screen and said the same words: the same headline, the same
                either-ors paragraph, the same counts — and the same button. So
                the button here read as the thing that does the deciding, when
                it is a link to somewhere else that does it, and there was no
                way to tell from looking which of the two pages was the app.
                "Decide for me" still exists, once, on the screen where it is
                literally true. Here it is an invitation in, and says so. */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/decide/"
                className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
              >
                Play now
              </a>
              <Link
                to="/premium"
                className="inline-block rounded-full border border-[var(--border)] px-8 py-3 font-semibold hover:border-[var(--amber)]"
              >
                See Premium — {OFFER_SHORT}
              </Link>
            </div>
            <p className="mt-6 text-sm text-[var(--text-dim)]">No account. No email. Free to play. Premium is extra.</p>

            {/* Android or iOS only, decided in the browser — see InstallApp. */}
            <InstallApp />

            <ul className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4 text-center">
              {[
                [String(DISH_COUNT), 'dishes'],
                ['8', 'questions to an answer'],
                [PRICE, `a month, after ${TRIAL_DAYS} free days`],
              ].map(([n, label]) => (
                <li key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-5">
                  <b className="block text-2xl font-bold sm:text-3xl">{n}</b>
                  <span className="mt-1 block text-xs text-[var(--text-dim)] sm:text-sm">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">How it works</p>
            <h2 className="mt-2 text-3xl font-bold">Three beats. Dinner.</h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                ['01', 'Answer either-ors', 'There are no wrong ones. Skip with “either” if you honestly do not mind.'],
                ['02', 'Watch it narrow', 'The catalogue shrinks as you go. You can see it happening.'],
                ['03', 'Get one answer', 'And a way to actually get it — cook it, or find it nearby (Premium).'],
              ].map(([n, title, body]) => (
                <li key={n} className="rounded-2xl border border-[var(--border)] p-6">
                  <p className="text-sm font-semibold text-[var(--amber)]">{n}</p>
                  <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-dim)]">{body}</p>
                </li>
              ))}
            </ol>
            <Link to="/how-it-works" className="mt-8 inline-block text-sm text-[var(--amber)] underline underline-offset-4">
              The full walkthrough
            </Link>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">Play it as a game</p>
            <h2 className="mt-2 text-3xl font-bold">Six modes. Premium only.</h2>
            <p className="mt-3 max-w-xl text-[var(--text-dim)]">
              Standard is the questions. Premium is Knockout, Blitz, This or that, Shortlist,
              Together and Swipe &mdash; plus Always avoid, so the free game stops asking you about
              food you never eat.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['🥊', 'This or that', 'One champion, endless challengers. Winner stays on until something knocks it off.'],
                ['🏆', 'Knockout', '8 dishes enter a bracket. Round of 8, semifinal, final. One walks out dinner.'],
                ['⚡', 'Blitz', 'Thirty seconds, and rounds that keep changing the rules. However many picks you get through is the score.'],
                ['🎲', 'Shortlist', 'Eight dishes from what you like. One of them lands. No questions.'],
                ['👥', 'Together', 'Up to six of you, one phone. Five either-ors each, then one dish the whole table can live with.'],
                ['💘', 'Swipe', 'One dish at a time. Right for yes, left for no — and every no sharpens what comes next.'],
              ].map(([icon, name, hook]) => (
                <div key={name} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6">
                  <p className="text-2xl" aria-hidden="true">
                    {icon}
                  </p>
                  <h3 className="mt-3 font-semibold">{name}</h3>
                  <p className="mt-2 text-sm text-[var(--text-dim)]">{hook}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">Standard vs Premium</p>
            <h2 className="mt-2 text-3xl font-bold">Always avoid is not on Standard.</h2>
            <p className="mt-3 max-w-xl text-[var(--text-dim)]">
              The free game is the whole decide loop. Dietary bans, cook mode, saved dishes and the
              extra game modes stay behind Premium — they do not quietly run on a free profile.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--text-dim)]">Standard</p>
                <p className="mt-1 text-3xl font-bold">Free</p>
                <ul className="mt-6 space-y-3 text-sm text-[var(--text-dim)]">
                  {STANDARD.map((line) => (
                    <li key={line}>— {line}</li>
                  ))}
                </ul>
                <a
                  href="/decide/"
                  className="mt-8 inline-block rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:border-[var(--amber)]"
                >
                  Play free
                </a>
              </div>
              <div className="rounded-2xl border border-[var(--amber)] bg-[var(--amber-soft)] p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">Premium</p>
                <p className="mt-1 text-3xl font-bold">{OFFER_SHORT}</p>
                <p className="text-sm text-[var(--text-dim)]">then {PRICE_MONTHLY}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {PREMIUM_SECTIONS.map((section) => (
                    <li key={section.name}>
                      <span className="font-semibold">{section.name}.</span>{' '}
                      <span className="text-[var(--text-dim)]">
                        {section.items.map(([title]) => title).join(', ')}.
                      </span>
                    </li>
                  ))}
                </ul>
                {viewer.hasPremium ? (
                  <a
                    href="/decide/"
                    className="mt-8 inline-block rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-black hover:opacity-90"
                  >
                    Play now
                  </a>
                ) : (
                  <Link
                    to="/checkout/$planId"
                    params={{ planId: PREMIUM_PLAN_ID }}
                    onClick={() => track('add_to_cart', { value: PRICE_VALUE, currency: 'USD' })}
                    className="mt-8 inline-block rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-black hover:opacity-90"
                  >
                    Start {TRIAL_DAYS} days free
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-16 text-center">
          <div className="mx-auto max-w-3xl px-6 fade-in-up">
            <h2 className="text-3xl font-bold">Hungry. Undecided. Sorted.</h2>
            <p className="mt-3 text-[var(--text-dim)]">Twenty seconds. One answer. Then go eat it.</p>
            <a
              href="/decide/"
              className="mt-8 inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              Play now
            </a>
          </div>
        </section>
      </main>
    </PageShell>
  )
}
