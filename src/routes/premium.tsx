import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PageShell } from '#/components/PageShell'
import { PlanPicker } from '#/components/PlanPicker'
import { loadViewer } from '#/lib/viewer'
import {
  DIET_FREE,
  HOUSEHOLD_FACTS,
  HOUSEHOLD_SEATS,
  HOUSEHOLD_STEPS,
  DIET_FREE_WHY,
  OFFER,
  OFFER_SHORT,
  PRICE_HOUSEHOLD_MONTHLY,
  PRICE_HOUSEHOLD_YEARLY,
  PRICE_MONTHLY,
  PRICE_VALUE,
  PREMIUM_HEADLINES,
  PREMIUM_SECTIONS,
  STANDARD,
  THE_GIFT,
  TRIAL_DAYS,
  TAX_NOTE,
  pageHead,
  track,
} from '#/lib/site'

export const Route = createFileRoute('/premium')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/premium',
      title: `Premium — morsels45 · ${OFFER_SHORT}, then ${PRICE_MONTHLY}`,
      description:
        `Premium stops it repeating itself, gets you as far as the table with cook mode and a shopping list, and covers the person you eat with on one subscription. ${OFFER}. What you do not eat is free on every profile.`,
      ogTitle: `morsels45 Premium — ${OFFER_SHORT}`,
      ogDescription:
        `It learns what you like and stops offering the same thing twice. Cook mode, a shopping list, and somewhere near you that serves it. Household covers two of you on one subscription, with a browser you both drive. ${OFFER}.`,
    }),
  component: PremiumPage,
})

function PremiumPage() {
  const viewer = Route.useLoaderData()

  useEffect(() => {
    track('view_content', { page: 'premium', value: PRICE_VALUE, currency: 'USD' })
  }, [])

  return (
    <PageShell user={viewer.user}>
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(ellipse 70% 50% at 50% -10%, #e0a34033, transparent 60%)',
            }}
          />
          <div className="relative mx-auto max-w-3xl px-6 pt-16 pb-14 text-center fade-in-up sm:pt-24">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              morsels45 Premium
            </p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{OFFER_SHORT}</h1>
            {/* No price here. There are four of them now, and the picker
                below is the only thing that knows which one is selected — a
                line naming two of them sat above a control showing a third. */}
            <p className="mt-4 text-[var(--text-dim)]">
              The decide game is free, and so is telling it what you do not eat. Premium is the
              part that remembers: it learns what you actually like, stops offering the same thing
              twice in a week, and opens a real browser two people can order in at once, with a
              cursor each. Nothing is charged for {TRIAL_DAYS} days.
            </p>
            {/* Said next to the promise rather than three pages away in the
                FAQ, which is where it was. "It remembers you" and "sign in
                anywhere and it is on" are both true and sat side by side, and
                together they read as a third thing that is not: that what it
                has learned follows you about. Premium is on your Whop
                account; the profile is in this browser. */}
            <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--text-dim)]">
              Sign in with the same Whop account and Premium is on wherever you sign in. What it
              has learned about you stays in the browser you played in — a new device starts
              that part fresh. Carrying it across is not built yet, and this page will say so
              when it is.
            </p>
            {viewer.hasPremium ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="/decide/"
                  className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
                >
                  Play now
                </a>
                <Link to="/account" className="text-sm text-[var(--text-dim)] underline underline-offset-4">
                  Manage your account
                </Link>
              </div>
            ) : (
              <>
                {/* THE GIFT, IMMEDIATELY BEFORE THE ASK.
                    Reciprocity is give-then-ask, and the giving here is large
                    and permanent — and was stated nowhere near the price,
                    which is reciprocity with the receipt thrown away. Nobody
                    feels given-to by something they were never told they were
                    given. It sits above the picker rather than below it
                    because the order is the mechanism. */}
                <p className="mx-auto mt-10 max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-5 py-4 text-sm text-[var(--text-dim)]">
                  <b className="text-[var(--text)]">You already have the main thing. </b>
                  {THE_GIFT}
                </p>
                <div className="mt-8 flex justify-center">
                  {/* The h1 above is already "7 days free". */}
                  <PlanPicker heading={false} />
                </div>
              </>
            )}
            {/* The picker now carries how to leave, right under its own
                button, so this said the same thing a second time a hand's
                width below it. What is left is the part the picker does not
                say: what happens if you cancel after the trial, and tax. */}
            <p className="mt-4 text-sm text-[var(--text-dim)]">
              Cancel after the trial and you keep Premium until the period you already paid for
              runs out. {TAX_NOTE}
            </p>
          </div>
        </section>

        {/* Three outcomes before thirty features. Somebody who is still
            deciding reads this and stops; somebody who has decided scrolls
            past it to "What you get", which is where the detail belongs. */}
        <section className="border-t border-[var(--border)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold">What changes when you pay</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {PREMIUM_HEADLINES.map((headline) => (
                <div key={headline.name}>
                  <h3 className="font-semibold">{headline.name}</h3>
                  <p className="mt-2 text-sm text-[var(--text-dim)]">{headline.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOUSEHOLD, EXPLAINED, because it was buyable and nowhere
            described. It sat behind one toggle on the plan picker with a
            two-line blurb, so the only way to find out what you were buying
            was to buy it. It has an id so the picker and the FAQ can point
            straight at it. */}
        <section className="border-t border-[var(--border)] py-14" id="household">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              For two
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              Household: {HOUSEHOLD_SEATS} people, one subscription.
            </h2>
            <p className="mt-4 text-[var(--text-dim)]">
              {PRICE_HOUSEHOLD_MONTHLY} or {PRICE_HOUSEHOLD_YEARLY} — about three dollars a month
              more than paying for yourself. The argument this whole thing is built to settle
              happens between two people, so a subscription covering one of them answers half
              of it.
            </p>

            <h3 className="mt-10 text-xl font-bold">How the second seat gets to them</h3>
            <ol className="mt-6 space-y-6">
              {HOUSEHOLD_STEPS.map((step, at) => (
                <li key={step.name} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--amber)] text-sm font-bold text-black">
                    {at + 1}
                  </span>
                  <span>
                    <b className="block">{step.name}</b>
                    <span className="mt-1 block text-sm text-[var(--text-dim)]">{step.blurb}</span>
                  </span>
                </li>
              ))}
            </ol>

            <h3 className="mt-12 text-xl font-bold">What people ask before they buy it</h3>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {HOUSEHOLD_FACTS.map((fact) => (
                <div key={fact.name}>
                  <dt className="font-semibold">{fact.name}</dt>
                  <dd className="mt-1 text-sm text-[var(--text-dim)]">{fact.blurb}</dd>
                </div>
              ))}
            </dl>

            {viewer.hasPremium ? (
              <p className="mt-10 text-sm text-[var(--text-dim)]">
                Already subscribed? If you are on a Household plan, the invitation button is on{' '}
                <Link to="/account" className="text-[var(--amber)] underline underline-offset-4">
                  your account page
                </Link>
                .
              </p>
            ) : (
              <div className="mt-10">
                <PlanPicker opensOn="household" />
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              The reason most people pay
            </p>
            <h2 className="mt-2 text-3xl font-bold">A browser two people drive at once.</h2>
            <p className="mt-4 text-[var(--text-dim)]">
              A real browser, running somewhere else, with a cursor each. Order the dish you landed
              on from one basket. Cook along to the same video from two kitchens, where “wait, go
              back” means the same frame for both of you. Fill one shopping list together. It is the
              part of this that costs real money to run, and it is the part a subscription actually
              pays for.
            </p>
            <p className="mt-4 text-[var(--text-dim)]">
              <strong className="text-[var(--text)]">{DIET_FREE}</strong> {DIET_FREE_WHY}
            </p>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold">What you get</h2>
            <p className="mt-3 text-[var(--text-dim)]">
              Every line below is Premium. None of it runs on a free profile.
            </p>
            <div className="mt-10 space-y-12">
              {PREMIUM_SECTIONS.map((section, si) => (
                <div key={section.name} className="fade-in-up" style={{ animationDelay: `${si * 60}ms` }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold">{section.name}</h3>
                    <span className="rounded-full border border-[var(--amber)] bg-[var(--amber-soft)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--amber)]">
                      Premium
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-dim)]">{section.blurb}</p>
                  <dl className="mt-5 space-y-5 border-l-2 border-[var(--amber)] pl-5">
                    {section.items.map(([title, body]) => (
                      <div key={title}>
                        <dt className="font-semibold">{title}</dt>
                        <dd className="mt-1 text-sm text-[var(--text-dim)]">{body}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl font-bold">Standard stays free. Premium is extra.</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--text-dim)]">
                  Standard
                </p>
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
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
                  Premium
                </p>
                {/* The price lives in the picker below, which is the only
                    thing on this card that knows which plan is selected. */}
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
                  <div className="mt-8">
                    <PlanPicker size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  )
}
