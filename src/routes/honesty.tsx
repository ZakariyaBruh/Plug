import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { HONESTY_LINE, REFUSALS, TECHNIQUES } from '#/lib/honesty'
import { pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * The page that lists what this site is doing to you.
 *
 * See the long comment at the top of lib/honesty.ts for why it exists. The
 * short version: a site claiming to be honest is making the same claim a
 * dishonest one makes, and the only version of it that can be checked is a
 * specific list of the ways it is trying to influence you.
 *
 * Indexable, in the footer of every page, and written for somebody who
 * arrived here suspicious.
 */
export const Route = createFileRoute('/honesty')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/honesty',
      title: 'What this site does to you — morsels45',
      description:
        'Every persuasive technique used on this site, named, plus the four we will not use. Written down so it can be checked rather than believed.',
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
            Nothing up our sleeve
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">What this site does to you.</h1>
          <p className="mt-5 text-lg text-[var(--text-dim)]">
            This site is trying to persuade you. So is every other one, and most of them use
            roughly the list below. The difference here is that the list is written down, in the
            code and on this page, so you can check it against the pages it describes instead of
            taking anybody’s word for anything.
          </p>
          <p className="mt-4 text-[var(--text-dim)]">
            It is also a rule we have to live by: a technique that cannot be described plainly to
            the person it is used on does not go in the product. Two failed that test while this
            page was being written — a third price tier that would have existed only to make the
            middle one look better, and a pause before the answer to make the work look harder
            than it is. Neither would have been easy to write down here, which is how we knew.
          </p>
        </section>

        {/* The test first, because everything under it is judged by it. */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold">The three tests</h2>
            <p className="mt-3 text-[var(--text-dim)]">
              Persuasion and manipulation are not different techniques. They are the same
              techniques used with or without these three properties.
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

        <section className="border-t border-[var(--border)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold">What we use</h2>
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

        {/* The half of the page that is worth anything. Anybody can list
            what they do; the promises are the part that can be broken. */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold">What we will not use</h2>
            <p className="mt-3 max-w-xl text-[var(--text-dim)]">
              These four would probably work. They are worded precisely enough that doing any of
              them would make this page false rather than merely optimistic, which is the point of
              writing them down.
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

        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold">If you find one that is not on this page</h2>
          <p className="mt-3 text-[var(--text-dim)]">
            Then this page has a bug in it, which is worse than any of the techniques it lists.
            The same list lives in the repository as{' '}
            <code className="rounded bg-[var(--bg-raised)] px-1.5 py-0.5 text-sm">
              docs/persuasion.md
            </code>
            , with the evidence and the code it points at, and a test that fails if the four
            refusals stop matching.
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
