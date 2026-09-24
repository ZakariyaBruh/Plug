import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PageShell } from '#/components/PageShell'
import { loadViewer } from '#/lib/viewer'
import { GamePreview } from '#/components/GamePreview'
import { PlanPicker } from '#/components/PlanPicker'
import { InstallApp } from '#/components/InstallApp'
import { JsonLd } from '#/components/JsonLd'
import {
  DISH_COUNT,
  OFFER,
  OFFER_SHORT,
  PRICE_VALUE,
  PREMIUM_HEADLINES,
  SITE_CARD,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  STANDARD,
  THE_GIFT,
  THE_INSIGHT,
  THE_JOBS,
  WHAT_IT_IS,
  pageHead,
  track,
} from '#/lib/site'

export const Route = createFileRoute('/info')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/info',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    }),
  component: InfoPage,
})

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
      description: `The extra modes, cook mode, the shared browser, unlimited saves. ${OFFER}. What you do not eat is free.`,
      url: `${SITE_URL}/premium`,
    },
  ],
}

function InfoPage() {
  const viewer = Route.useLoaderData()

  useEffect(() => {
    track('view_content', { page: 'info' })
  }, [])

  return (
    <PageShell user={viewer.user}>
      <JsonLd data={SITE_SCHEMA} />
      <JsonLd data={APP_SCHEMA} />
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
          <div className="relative mx-auto max-w-5xl px-6 pt-8 pb-20 text-center fade-in-up sm:pt-12">
            <a
              href="/decide/?go=tonight"
              onClick={() => track('skip_to_answer', { from: 'info' })}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--amber)] bg-[var(--amber-soft)] px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              <span aria-hidden="true">⚡</span> Just want an answer? Pick for me — no questions
              <span aria-hidden="true">→</span>
            </a>
            <p className="mt-10 text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              morsels45
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] sm:text-6xl">
              You&rsquo;re hungry.
              <br />
              You don&rsquo;t know what you want.
              <br />
              <em className="font-semibold text-[var(--amber)]">That&rsquo;s what I&rsquo;m for.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--text-dim)]">
              A few easy either-ors — sweet or savoury, hot or cold. Then one answer, with the
              recipe behind it. Close but not quite? Point me lighter, spicier, sooner, and I
              answer again that way.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/decide/"
                className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
              >
                Play free
              </a>
              <Link
                to="/premium"
                className="inline-block rounded-full border border-[var(--border)] px-8 py-3 font-semibold hover:border-[var(--amber)]"
              >
                See Premium — {OFFER_SHORT}
              </Link>
            </div>
            <p className="mt-6 text-sm text-[var(--text-dim)]">No account. No email. Free to play. Premium is extra.</p>
            <a href="#try-it" className="mt-3 inline-block text-sm text-[var(--amber)] underline underline-offset-4">
              Or try five questions right here ↓
            </a>

            <InstallApp />

            <ul className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4 text-center">
              {[
                [String(DISH_COUNT), 'dishes'],
                ['8', 'questions to an answer'],
                ['20s', 'from hungry to decided'],
              ].map(([n, label]) => (
                <li key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-5">
                  <b className="block text-2xl font-bold sm:text-3xl">{n}</b>
                  <span className="mt-1 block text-xs text-[var(--text-dim)] sm:text-sm">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <GamePreview />

        <section className="border-t border-[var(--border)] py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              {THE_INSIGHT.eyebrow}
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">{THE_INSIGHT.heading}</h2>
            <p className="mt-5 max-w-2xl text-lg text-[var(--text-dim)]">{THE_INSIGHT.body}</p>
            <p className="mt-4 max-w-2xl text-lg">
              <b>{THE_INSIGHT.kicker}</b>
            </p>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              What it&rsquo;s for
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-bold">{WHAT_IT_IS}</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {THE_JOBS.map((job) => (
                <div key={job.name}>
                  <h3 className="text-xl font-semibold">{job.name}</h3>
                  <p className="mt-2 text-sm text-[var(--text-dim)]">{job.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">How it works</p>
            <h2 className="mt-2 text-3xl font-bold">Three beats. Dinner.</h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                ['01', 'Answer either-ors', 'There are no wrong ones. Skip with "either" if you honestly do not mind. The catalogue shrinks as you go and you can watch it happen.'],
                ['02', 'Get one answer', 'One dish — not a shortlist of nine, which is the problem you came here with.'],
                ['03', 'Point it, if it is close', 'Lighter. Spicier. Sooner. It answers again in that direction instead of starting over — then hands you the recipe, the shopping list, or somewhere nearby that serves it.'],
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
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              When the questions are not the mood
            </p>
            <h2 className="mt-2 text-3xl font-bold">Six other ways to decide.</h2>
            <p className="mt-3 max-w-xl text-[var(--text-dim)]">
              Same catalogue, same rules, same one answer at the end — a different road to it.
              All six are Premium; the questions are free and always will be.
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
            <h2 className="mt-2 text-3xl font-bold">Free answers the question. Premium remembers the answer.</h2>
            <p className="mt-3 max-w-xl text-[var(--text-dim)]">
              {THE_GIFT} It learns what you like, stops offering it twice, gets you as far as the
              table, and covers the person you eat with.
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
                <ul className="mt-6 space-y-4 text-sm">
                  {PREMIUM_HEADLINES.map((headline) => (
                    <li key={headline.name}>
                      <span className="font-semibold">{headline.name}.</span>{' '}
                      <span className="text-[var(--text-dim)]">{headline.blurb}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/premium"
                  className="mt-4 inline-block text-sm text-[var(--amber)] underline underline-offset-4"
                >
                  Everything in it
                </Link>
                <p className="mt-4 text-xs text-[var(--text-dim)]">
                  No countdowns, no invented numbers, no guilt for leaving.{' '}
                  <Link to="/honesty" className="underline underline-offset-4 hover:text-[var(--text)]">
                    What we won&rsquo;t do
                  </Link>
                </p>
                {viewer.hasPremium ? (
                  <a
                    href="/decide/"
                    className="mt-8 inline-block rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-black hover:opacity-90"
                  >
                    Play now
                  </a>
                ) : (
                  <div className="mt-8">
                    <PlanPicker size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-16 text-center">
          <div className="mx-auto max-w-3xl px-6 fade-in-up">
            <h2 className="text-3xl font-bold">Hungry. Undecided. Sorted.</h2>
            <p className="mt-3 text-[var(--text-dim)]">
              Twenty seconds. One answer. Point it until it&rsquo;s right, then go eat it.
            </p>
            <a
              href="/decide/"
              className="mt-8 inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              Play free
            </a>
          </div>
        </section>
      </main>
    </PageShell>
  )
}
