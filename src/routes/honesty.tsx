import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { HONESTY_LINE, REFUSALS, TECHNIQUES } from '#/lib/honesty'
import { pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * THE STANDARDS PAGE.
 *
 * It was written first as a confession — "What this site does to you",
 * "nothing up our sleeve", every technique named, the promises at the bottom.
 * That was the wrong way round and the note that said so was right: honesty
 * is a policy, oversharing is a commercial mistake, and a page headed "here
 * is how we are persuading you" hands a hungry stranger a job they did not
 * come here to do. It makes them suspicious of things they had not noticed
 * and would not have minded.
 *
 * What people actually want from a page like this is something to rely on.
 * So the four refusals lead, because they are commitments rather than
 * disclosures and they are the half a competitor cannot cheaply copy. The
 * design choices follow, in the reader's own terms — a preselected plan, a
 * struck-through comparison, a reminder you asked for — all of them things
 * you could work out by looking. The behavioural-science reasoning behind
 * them is not here; that is developer material and it lives in
 * docs/persuasion.md.
 *
 * Still indexable and still linked from the footer, under a name that says
 * what it is for.
 */
export const Route = createFileRoute('/honesty')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/honesty',
      title: 'What we won\u2019t do \u2014 morsels45',
      description:
        'No fake countdowns, no invented user numbers, no rewards designed to keep you playing, and no guilt for leaving. Four promises, and the design choices behind them.',
    }),
  component: HonestyPage,
})

function HonestyPage() {
  const viewer = Route.useLoaderData()

  return (
    <PageShell user={viewer.user}>
      <main className="fade-in-up">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
            Our standards
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">What we won’t do.</h1>
          <p className="mt-5 text-lg text-[var(--text-dim)]">
            Four promises about how this app treats you, written specifically enough that breaking
            one would make this page false rather than merely optimistic. Then the design choices
            behind them, so you can check the promises against the product instead of taking our
            word for it.
          </p>
        </section>

        {/* First, because it is the half worth anything. Anybody can list
            what they do; a promise is the part that can be broken. */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold">The four promises</h2>
            <p className="mt-3 max-w-xl text-[var(--text-dim)]">
              All four of these would probably sell more subscriptions. They are common enough
              that you have met every one of them this week somewhere else.
            </p>
            <dl className="mt-8 space-y-8">
              {REFUSALS.map((refusal) => (
                <div key={refusal.name}>
                  <dt className="text-lg font-semibold">{refusal.name}</dt>
                  <dd className="mt-2 text-sm text-[var(--text-dim)]">{refusal.blurb}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-[var(--border)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold">The three tests</h2>
            <p className="mt-3 text-[var(--text-dim)]">
              Every design choice in this product has to pass these before it ships. They are the
              difference between a shop arranging its shelves well and a shop moving the exit.
            </p>
            <ol className="mt-8 space-y-6">
              {HONESTY_LINE.map((test, at) => (
                <li key={test.name} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--amber)] text-sm font-bold text-black">
                    {at + 1}
                  </span>
                  <span>
                    <b className="block">{test.name}</b>
                    <span className="mt-1 block text-sm text-[var(--text-dim)]">{test.blurb}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold">How the thing is built</h2>
            <p className="mt-3 max-w-xl text-[var(--text-dim)]">
              Choices a reader could work out by looking, said out loud so the promises above have
              something to be checked against.
            </p>
            <dl className="mt-8 space-y-8">
              {TECHNIQUES.map((technique) => (
                <div key={technique.name}>
                  <dt className="text-lg font-semibold">{technique.name}</dt>
                  <dd className="mt-2 text-sm text-[var(--text-dim)]">{technique.what}</dd>
                  <dd className="mt-2 border-l-2 border-[var(--amber)] pl-4 text-sm">
                    {technique.here}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold">If we break one of these</h2>
          <p className="mt-3 text-[var(--text-dim)]">
            Then this page is wrong, which is worse than anything it describes. The four promises
            are also written into the repository, in{' '}
            <code className="rounded bg-[var(--bg-raised)] px-1.5 py-0.5 text-sm">
              docs/persuasion.md
            </code>
            , and a test fails the build if they stop matching what is published here. That is not
            a guarantee. It is one more thing that would have to be deliberately switched off.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/decide/"
              className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              Play free
            </a>
            <Link
              to="/premium"
              className="inline-block rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:border-[var(--amber)]"
            >
              See what the money buys
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  )
}
