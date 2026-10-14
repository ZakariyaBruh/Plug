import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PageShell } from '#/components/PageShell'
import { PlanPicker } from '#/components/PlanPicker'
import { loadViewer } from '#/lib/viewer'
import {
  DIET_FREE,
  DIET_FREE_WHY,
  OFFER,
  OFFER_SHORT,
  PRICE_MONTHLY,
  PRICE_VALUE,
  PREMIUM_HEADLINES,
  PREMIUM_SECTIONS,
  ACCOUNT,
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
        `Premium switches on the rest of the food hub: a shopping list, nutrition and budget for your planned week, a dinner-party planner, your own recipes and recipes from any website, a food scanner that says how healthy something is, dinner from a fridge photo, hands-free cook mode, a daily AI food briefing and the shared browser. ${OFFER}.`,
      ogTitle: `morsels45 Premium — ${OFFER_SHORT}`,
      ogDescription:
        `Shopping list, nutrition and budget for your week. Your own recipes, recipes from any website, a food scanner that tells you how healthy it is, and dinner from a photo of your fridge. Hands-free cook mode, a daily AI food briefing, and a browser two of you drive at once. ${OFFER}.`,
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
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">The whole food hub</h1>
            <p className="mt-2 text-lg font-semibold">{OFFER_SHORT}</p>
            {/* No price here. There are four of them now, and the picker
                below is the only thing that knows which one is selected — a
                line naming two of them sat above a control showing a third. */}
            <p className="mt-4 text-[var(--text-dim)]">
              Deciding is free, and so is telling it what you do not eat. A free account adds the
              meal calendar, food TV and radio. Premium is everything else: a shopping list,
              nutrition and a budget for your week, a dinner-party planner, your own recipes (even
              copied from a photo of a handwritten card), recipes from any website, a food scanner
              that tells you how healthy something is, dinner from a photo of your fridge,
              hands-free cook mode, a daily AI food briefing, and a real browser two people drive at
              once. Nothing is charged for {TRIAL_DAYS} days.
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
                  Open morsels45
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

        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              The shared browser
            </p>
            <h2 className="mt-2 text-3xl font-bold">A browser two people drive at once &mdash; and where you&rsquo;ll find it.</h2>
            <p className="mt-4 text-[var(--text-dim)]">
              A real web browser running in the cloud. You open it from one of the buttons below,
              send the other person a link, and you each get a cursor in the same window, from your
              own phones. Nothing to install, nobody passing a phone round the table.
            </p>
            <ol className="mt-6 list-decimal space-y-3 pl-5 text-[var(--text-dim)]">
              <li>
                <strong className="text-[var(--text)]">Order it together</strong> &mdash; on the answer
                screen, once you accept a dish. Opens a delivery site on it; you fill one basket.
              </li>
              <li>
                <strong className="text-[var(--text)]">Order from here</strong> &mdash; in Nearby, on any
                restaurant. Opens that place&rsquo;s own ordering page.
              </li>
              <li>
                <strong className="text-[var(--text)]">Cook along</strong> &mdash; in cook mode, on any
                recipe. One cooking video, in step, in two kitchens.
              </li>
              <li>
                <strong className="text-[var(--text)]">Shop it together</strong> &mdash; on any shopping
                list, a recipe&rsquo;s or your whole week&rsquo;s in the Planner. One supermarket basket.
              </li>
            </ol>
            <p className="mt-4 text-sm text-[var(--text-dim)]">
              Every one of those buttons has a &ldquo;What&rsquo;s this?&rdquo; beside it in the app. It is
              part of Premium because it is a real computer running for you while it is open.
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
                <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-[var(--text-dim)]">
                  Free with an account
                </p>
                <ul className="mt-3 space-y-3 text-sm text-[var(--text-dim)]">
                  {ACCOUNT.map((line) => (
                    <li key={line}>— {line}</li>
                  ))}
                </ul>
                <a
                  href="/decide/"
                  className="mt-8 inline-block rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:border-[var(--amber)]"
                >
                  Open it free
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
                    Open morsels45
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
