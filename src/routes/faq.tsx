import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { JsonLd } from '#/components/JsonLd'
import { OFFER, pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

export const Route = createFileRoute('/faq')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/faq',
      title: 'FAQ — morsels45',
      description: 'What is free, what Premium adds, how Always avoid works, and how to cancel.',
    }),
  component: FaqPage,
})

const FAQS: [string, string][] = [
  [
    'Is it actually free?',
    'Yes. The Decide game, the whole 112-dish catalogue, browse, Tonight’s pick, how many plates, XP, streaks and badges are free. You do not need an account to play.',
  ],
  [
    'What does Premium add?',
    `Always avoid, Knockout, Blitz, This or that, Shortlist, Together, Swipe, order it together, cook along, shop the list together, meal slot, heat dial, mix-it-up, a side with that, don’t repeat this week, guest at the table, cook mode, unlimited saved dishes, cook-from-your-kitchen, a planned week, extra palettes, and picks that follow what you have actually liked. ${OFFER}, cancel any time.`,
  ],
  [
    'Does Always avoid work on Standard?',
    'No. Always avoid is Premium. On a free profile the buttons are visible so you can see the feature, but they do not ban anything and they do not change the questions. Pay, and they apply to every decision from then on.',
  ],
  [
    'Do I need an account?',
    'Not to play. Sign in with Whop when you want Premium to follow you to another device — it is bound to the Whop account you pay with, not to a licence key or this browser.',
  ],
  [
    'I paid. Why is it still locked?',
    'Sign in with the same Whop account you used at checkout, then come back to the game. Premium is checked from that session. There is nothing to paste and nothing to redeem.',
  ],
  [
    'How do I cancel?',
    'Account → Manage or cancel your subscription, or the same link on the Premium strip inside the game. You keep Premium until the period you already paid for runs out.',
  ],
  [
    'Is my progress on this phone only?',
    'XP, streaks, saved dishes and ratings live in this browser. Premium itself is on your Whop account, so signing in elsewhere unlocks the features — it does not copy the local stats.',
  ],
  [
    'Can I play without Premium forever?',
    'Yes. Standard is the product. Premium is extra modes and extra control, not a wall in front of dinner.',
  ],
]

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
}

function FaqPage() {
  const viewer = Route.useLoaderData()

  return (
    <PageShell user={viewer.user}>
      <JsonLd data={FAQ_SCHEMA} />
      <main className="fade-in-up">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">FAQ</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Straight answers</h1>
          <p className="mt-4 text-[var(--text-dim)]">
            If it is not here, sign in and write from your account — we will see it on this same
            Whop business.
          </p>
        </section>
        <section className="border-t border-[var(--border)] py-12">
          <dl className="mx-auto max-w-3xl space-y-8 px-6">
            {FAQS.map(([q, a]) => (
              <div key={q}>
                <dt className="text-lg font-semibold">{q}</dt>
                <dd className="mt-2 text-[var(--text-dim)]">{a}</dd>
              </div>
            ))}
          </dl>
          <div className="mx-auto mt-12 max-w-3xl px-6">
            <Link
              to="/premium"
              className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              See Premium
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  )
}
