import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PageShell } from '#/components/PageShell'
import { PREMIUM_PLAN_ID } from '#/lib/products'
import { loadViewer } from '#/lib/viewer'
import {
  OFFER,
  OFFER_SHORT,
  PRICE_MONTHLY,
  PRICE_VALUE,
  PREMIUM_SECTIONS,
  STANDARD,
  TRIAL_DAYS,
  TAX_NOTE,
  TRIAL_TERMS,
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
        `Always avoid, Knockout, Blitz, Shortlist, Together, Swipe, order it together, meal slot, heat dial, cook mode, and saved dishes. ${OFFER}. Always avoid does not run on Standard.`,
      ogTitle: `morsels45 Premium — ${OFFER_SHORT}`,
      ogDescription:
        `Ban foods you never eat. Play Knockout, Blitz, This or that, Shortlist, Together and Swipe, then order it together in one shared browser. Cook mode and unlimited saves. ${OFFER}.`,
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
            <p className="mt-2 text-lg text-[var(--text-dim)]">then {PRICE_MONTHLY}</p>
            <p className="mt-4 text-[var(--text-dim)]">
              Standard is the decide game, Tonight’s pick, and how many plates. Premium is the
              control: Always avoid, four extra modes, meal slot, heat, mix-it-up, cook mode, and
              saves. Start here — nothing is charged for three days. Sign in with the same Whop
              account and it is already on.
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
              <Link
                to="/checkout/$planId"
                params={{ planId: PREMIUM_PLAN_ID }}
                onClick={() => track('add_to_cart', { value: PRICE_VALUE, currency: 'USD' })}
                className="mt-8 inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
              >
                Start {TRIAL_DAYS} days free
              </Link>
            )}
            <p className="mt-4 text-sm text-[var(--text-dim)]">
              {TRIAL_TERMS} After that, cancel any time and keep it until the period you paid for
              ends.
            </p>
            <p className="mt-2 text-sm text-[var(--text-dim)]">{TAX_NOTE}</p>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              The reason most people pay
            </p>
            <h2 className="mt-2 text-3xl font-bold">Always avoid is Premium. It does not run on Standard.</h2>
            <p className="mt-4 text-[var(--text-dim)]">
              Ban meat, seafood, cheese, spice, fried food, caffeine — once. Every future decision
              skips those dishes and never asks the matching question. On a free profile the buttons
              are visible so you can see the feature. They do not filter the catalogue. They do not
              change the questions. Checkout is what turns them on.
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
                  <li>— Always avoid does not apply</li>
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
      </main>
    </PageShell>
  )
}
