import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { DIET_FREE, DISH_COUNT, pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

export const Route = createFileRoute('/how-it-works')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/how-it-works',
      title: 'How it works — morsels45',
      description:
        'How morsels45 turns “what should I eat” into a handful of either-ors, then one dish you can push lighter, spicier or sooner until it is right — and what Premium adds on top.',
    }),
  component: HowItWorks,
})

const STEPS = [
  {
    n: '01',
    title: 'Hit Decide for me',
    body: `No account. No email. The catalogue is already loaded — ${DISH_COUNT} dishes, from a bowl of ramen to a banana and peanut butter on toast.`,
  },
  {
    n: '02',
    title: 'Answer the either-ors',
    body: 'Sweet or savoury. Hot or cold. Hands or cutlery. Skip with “either” if you honestly do not mind. Undo if you misspoke. There are no wrong ones.',
  },
  {
    n: '03',
    title: 'Watch the list shrink',
    body: 'Every answer reweights the catalogue. The meter on the screen is not decoration — it is how close the engine is to a single dish.',
  },
  {
    n: '04',
    title: 'Get one answer',
    body: 'Not a list of ten. One. If nothing could meet everything you asked for, it says which preference it had to let go of, instead of quietly handing you something that argues with you.',
  },
  /*
   * This step used to be called "Take it or leave it", and that was the honest
   * name for what the app did: accept, or press a button that meant no and hope
   * the next one landed. Refusing is not steering. What replaced it is the whole
   * reason this page needed rewriting.
   */
  {
    n: '05',
    title: 'Point it, if it is close',
    body: 'Under the answer are two or three directions that would actually move it — lighter, spicier, something hot, quicker. Tap one and it decides again with that added to what you already said. Nothing resets, nothing is asked twice, and the dish you just turned down does not come back. There is still a plain “just something else” for the nights when nothing about it was right.',
  },
  {
    n: '06',
    title: 'Then eat it',
    body: '“That’s the one” banks the decision and the XP. Behind every dish is a recipe, a shopping list and a cook mode that reads the steps out one at a time. Premium can also save it, snooze it for a fortnight, or strike it off for good.',
  },
]

export function HowItWorks() {
  const viewer = Route.useLoaderData()

  return (
    <PageShell user={viewer.user}>
      <main className="fade-in-up">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">How it works</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">A few questions. One dinner.</h1>
          <p className="mt-4 text-[var(--text-dim)]">
            morsels45 is a decide-for-me game, not a recipe blog. You do not have to know what you
            want — you only have to answer easy either-ors, and then say which way to lean if the
            answer is close. The free loop is the whole product for most people. Premium is for the
            nights you already know what you never want, and the nights you want to play it as a
            game.
          </p>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-14">
          <ol className="mx-auto max-w-3xl space-y-10 px-6">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-5">
                <span className="mt-1 w-10 shrink-0 text-sm font-semibold text-[var(--amber)]">{step.n}</span>
                <div>
                  <h2 className="text-xl font-semibold">{step.title}</h2>
                  <p className="mt-2 text-[var(--text-dim)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-3xl px-6 pt-16">
          <h2 className="text-2xl font-bold">What it already knows not to offer you</h2>
          <p className="mt-3 text-[var(--text-dim)]">{DIET_FREE}</p>
          <p className="mt-3 text-sm text-[var(--text-dim)]">
            It holds for every decision, every mode and every list &mdash; the questionnaire,
            Tonight&rsquo;s pick, the shortlist, the week plan and the daily shelf. Set it on the
            way in, or under <em>You</em> at any point after.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold">What Premium changes</h2>
          <dl className="mt-8 space-y-6">
            <div>
              <dt className="font-semibold">Knockout, Blitz, This or that, Shortlist, Together, Swipe</dt>
              <dd className="mt-1 text-sm text-[var(--text-dim)]">
                Six other ways to land on dinner when you are bored of questions. Locked on
                Standard, live the moment Premium is on the same Whop account.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">The shared browser</dt>
              <dd className="mt-1 text-sm text-[var(--text-dim)]">
                A real browser running somewhere else that two people drive at once, with a cursor
                each &mdash; to order the dish, cook along to one video from two kitchens, or fill a
                single shopping basket together.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Cook mode and the cupboard</dt>
              <dd className="mt-1 text-sm text-[var(--text-dim)]">
                One step at a time, with a timer for the steps that name one. Or name what is
                already in the kitchen and get the recipes you can start without a shop run.
              </dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/decide/"
              className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              Play now
            </a>
            <Link to="/premium" className="inline-block rounded-full border border-[var(--border)] px-8 py-3 font-semibold hover:border-[var(--amber)]">
              See Premium
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  )
}
