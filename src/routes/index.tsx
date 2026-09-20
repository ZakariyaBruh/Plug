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
      description: `The extra modes, cook mode, the shared browser, unlimited saves. ${OFFER}. What you do not eat is free.`,
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
              {/* This used to end "That's alright — I might", a claim to know
                  what somebody wants before they do. A lovely line and the
                  wrong promise: nothing can keep it, and while it stood, every
                  new feature could be justified as one more way of guessing.
                  An assistant does not guess. It asks. */}
              <em className="font-semibold text-[var(--amber)]">That&rsquo;s what I&rsquo;m for.</em>
            </h1>
            {/* The second half of this used to end at "one answer with the
                recipe behind it", which is where the old app ended too: take it
                or leave it. Leaving it was the only thing you could say, and a
                stranger reading that has to believe the first answer will be
                right. Now the promise is the recovery, not the guess. */}
            <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--text-dim)]">
              A few easy either-ors — sweet or savoury, hot or cold. Then one answer, with the
              recipe behind it. Close but not quite? Point me lighter, spicier, sooner, and I
              answer again that way.
            </p>
            {/* "Play free", not "Decide for me".
                This page and the app's own opening screen looked like the same
                screen and said the same words: the same headline, the same
                either-ors paragraph, the same counts — and the same button. So
                the button here read as the thing that does the deciding, when
                it is a link to somewhere else that does it, and there was no
                way to tell from looking which of the two pages was the app.
                "Decide for me" still exists, once, on the screen where it is
                literally true. Here it is an invitation in, and says so — and
                says the price, because the whole decide game really is free and
                a stranger has no way of knowing that from a page with a
                Premium button next to it. */}
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

            {/* Android or iOS only, decided in the browser — see InstallApp. */}
            <InstallApp />

            <ul className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4 text-center">
              {/* The third of these was the price, which put the ask above
                  the gift — the wrong way round, and the one ordering
                  mistake that reliably costs you the reader. Time to an
                  answer is the actual promise, it is measured rather than
                  claimed, and the price is two lines up on its own button
                  and four sections down in full. */}
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

        {/* Before the section that explains the mechanic, because fifteen
            seconds of playing it explains it better than three paragraphs
            about three beats — and anybody who has just had an answer out of
            it reads those three paragraphs differently. */}
        <GamePreview />

        {/* THE INSIGHT BEAT, and it sits here on purpose.
            Somebody who has just been handed an answer by five either-ors has
            the evidence for this paragraph in their hands; the same paragraph
            three screens earlier is a claim they have no way to check. The
            Heaths' four families of defining moment are elevation, insight,
            pride and connection — this page had elevation and nothing else. */}
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

        {/* WHAT THIS IS, before how it works. The page went straight from the
            mechanic to six extra game modes, so a stranger read about Knockout
            before they read about dietary rules or recipes — and left with no
            idea what the thing was FOR. Three jobs, in the order they happen.
            Everything further down is one of them, or it is an extra. */}
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
                ['01', 'Answer either-ors', 'There are no wrong ones. Skip with “either” if you honestly do not mind. The catalogue shrinks as you go and you can watch it happen.'],
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
            {/* Demoted from a pillar to an extra, which is what it is: six more
                ways to do the first job, not a fourth job. */}
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
            {/* This read "The free game is the whole game." It was honest and
                it was an argument against paying: somebody who believes it has
                no reason to read the column on the right. What is true and
                worth saying instead is that the free game proves the thing
                works, and that what you pay for is it remembering you — which
                is the one thing a profile that saves nothing can never do. */}
            <h2 className="mt-2 text-3xl font-bold">Free answers the question. Premium remembers the answer.</h2>
            {/* RECIPROCITY, WITH THE RECEIPT KEPT.
                Give first and then ask — but the giving only counts if the
                person knows it happened, and this product gives a great deal
                and used to mention it three screens away from the price. */}
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
                {/* The price is in the picker at the foot of this card, which
                    is the only part that knows whether yearly or monthly is
                    selected. Printing one here as well would mean printing the
                    wrong one half the time. */}
                {/* Three, not thirty. The full list is on /premium, which is
                    where somebody who has already decided goes looking; this
                    card is read by somebody who has not. */}
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
                {/* At the moment of the ask, not buried in the footer.
                    Somebody deciding whether to hand over a card is exactly
                    the reader that page is for. */}
                <p className="mt-4 text-xs text-[var(--text-dim)]">
                  <Link to="/honesty" className="underline underline-offset-4 hover:text-[var(--text)]">
                    Every persuasive trick on this page, listed
                  </Link>{' '}
                  — including the four we will not use.
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
            {/* Same words as the button at the top of this page. Two buttons
                doing the same thing on one page should not disagree about what
                the thing costs. The Premium column above keeps "Play now",
                because somebody who has paid is not playing free. */}
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
