import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { AFFILIATES_URL, SITE_URL, pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * The privacy page.
 *
 * WRITTEN FROM THE CODE, not from a template. Every claim below was checked
 * against what the app actually does before it was written down, because a
 * privacy policy that describes a different app is worse than no policy: it is
 * a promise nobody kept. If a data flow changes, this page changes with it —
 * the list of third parties in THIRD_PARTIES is the one to keep honest, since
 * that is the part a reader cannot verify for themselves.
 */
export const Route = createFileRoute('/privacy')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/privacy',
      title: 'Privacy — morsels45',
      description:
        'What morsels45 stores, what it does not, and every outside service it talks to. Your game is saved in your own browser.',
    }),
  component: PrivacyPage,
})

/** Last time the wording was reviewed against the code. */
const REVIEWED = '17 September 2026'

type Section = { heading: string; body: string[] }

const SECTIONS: Section[] = [
  {
    heading: 'The short version',
    body: [
      'You can play the whole game without an account, and nothing you do in it is sent to us. Your picks, ratings, streaks, XP, dietary rules and saved dishes are written to your own browser and stay there.',
      'You only hand over anything when you sign in with Whop to buy Premium, or when you use a feature that needs an outside service to work — the AI, the shared browser, or finding somewhere to eat nearby. Each of those is named below.',
    ],
  },
  {
    heading: 'What is stored in your browser',
    body: [
      'One entry in your browser’s local storage, called whatShouldIEat.v1. It holds everything the game knows about you: which dishes you have picked and rated, how often, your level, XP, streak and badges, any dietary rules you have set, dishes you have saved or struck off, and today’s five suggestions so a second visit does not have to fetch them again.',
      'It never leaves your device. We cannot read it, it is not backed up anywhere, and it is not tied to a name. Clearing your browser data for this site deletes it permanently — there is no copy to restore from, which is the trade for not having to make an account.',
    ],
  },
  {
    heading: 'If you sign in or subscribe',
    body: [
      'Signing in is handled by Whop. When you do, two cookies are set on this site — wa and wr — which hold the tokens that prove to this app that you are signed in and whether your subscription is active. They are how Premium follows you to another device instead of being locked to one browser.',
      'Payments happen on Whop, not here. This app never sees your card, and it does not store your email or your name — when it needs to know who you are or whether you have paid, it asks Whop and uses the answer.',
      'Signing out clears both cookies. Cancelling is done from your Whop account, and cancelling before the trial ends means you are not charged.',
    ],
  },
  {
    heading: 'The AI features',
    body: [
      'Ask anything, the menu builder and the five daily suggestions are answered by Google’s Gemini. What you type into the chat box, or the situation you describe to the menu builder, is sent to Google to be answered, along with a short list of dishes you have liked and avoided so the answer is worth having.',
      'Nothing identifying goes with it: no name, no email, no account number, no location. Google’s own terms govern what they do with it, and if that is not something you want, those three features are the only ones that use them — the decide game itself never calls out anywhere.',
    ],
  },
  {
    heading: 'Nearby, and your location',
    body: [
      'Nearby asks your browser for your location, and your browser asks you first. Say no and the feature simply does not run; nothing else in the app is affected.',
      'If you say yes, your coordinates are sent to the map services that can answer the question — OpenStreetMap’s Overpass and Nominatim, and Photon — to look up places around you. They are not sent to us, and they are not stored anywhere by this app.',
    ],
  },
  {
    heading: 'The shared browser',
    body: [
      'Order it together, cook along and shop the list together run a real browser on a service called Hyperbeam, which both of you drive. Anything you type in that browser — including anything you type into somebody else’s checkout — goes to Hyperbeam and to the site you are visiting, exactly as it would in a normal browser.',
      'Treat it as a shared screen, because that is what it is: whoever has the link can see what is on it.',
    ],
  },
  {
    heading: 'The news page',
    body: [
      'Headlines are fetched by this site’s own server, not by your browser. That means the publishers never see you: no request from your device reaches the Guardian, Eater, NYT Dining, The Kitchn, Smitten Kitchen, Saveur or King Arthur Baking unless you tap through to read the article, at which point you are on their site under their rules.',
    ],
  },
  {
    heading: 'Analytics, and what counts as one',
    body: [
      'This app is hosted by Whop, which adds its own analytics to every page it serves — that is the platform’s, not ours, and it is covered by Whop’s privacy policy. The one thing this app tells it directly is that somebody reached an answer and accepted it. No dish name, no profile, nothing about who.',
      'There is no Google Analytics here, no advertising pixel of our own, and nothing that follows you to other sites.',
    ],
  },
  {
    heading: 'Server logs',
    body: [
      'The AI features limit how often one person can call them, which means the server briefly holds the IP address your request arrived from. It is kept in memory only, for as long as the limit window lasts, and is never written to a database or attached to anything else about you.',
      'Ordinary request logs are handled by Cloudflare, which serves this site.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'This is a food app with no chat between users, no profiles, no public posts and nothing to upload. Buying Premium goes through Whop, whose own terms set the minimum age for having an account and paying.',
    ],
  },
  {
    heading: 'Getting your data, or getting rid of it',
    body: [
      'Everything the game knows about you is in your own browser, so deleting it is a matter of clearing this site’s data — or using "Wipe this profile" on the profile screen, which empties it from inside the app.',
      'For anything held by Whop — your account, your subscription, your payment history — ask Whop directly, since that is where it lives.',
    ],
  },
]

/*
 * Named rather than described, because "we may share data with partners" is
 * how a policy avoids saying anything. A reader should be able to check each
 * of these for themselves.
 */
const THIRD_PARTIES: [string, string][] = [
  ['Whop', 'Sign-in, payments, subscription status, and the analytics on every page it serves.'],
  ['Google (Gemini)', 'Answers the chat, the menu builder and the five daily suggestions.'],
  ['Hyperbeam', 'Runs the shared browser, when you open one.'],
  ['OpenStreetMap and Photon', 'Look up places near you, when you use Nearby and allow location.'],
  ['Cloudflare', 'Serves this site.'],
]

function PrivacyPage() {
  const viewer = Route.useLoaderData()

  return (
    <PageShell user={viewer.user}>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
          morsels45
        </p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Privacy</h1>
        <p className="mt-4 text-lg text-[var(--text-dim)]">
          What this app stores, what it does not, and every outside service it talks to. Written
          from what the code actually does, and checked against it on {REVIEWED}.
        </p>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold">{section.heading}</h2>
              {section.body.map((line) => (
                <p key={line.slice(0, 40)} className="mt-3 text-[var(--text-dim)]">
                  {line}
                </p>
              ))}
            </section>
          ))}

          <section>
            <h2 className="text-2xl font-bold">Everyone this app talks to</h2>
            <p className="mt-3 text-[var(--text-dim)]">
              The whole list. Nothing else is contacted on your behalf.
            </p>
            <ul className="mt-5 space-y-3">
              {THIRD_PARTIES.map(([name, why]) => (
                <li
                  key={name}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)] px-5 py-4"
                >
                  <b className="block">{name}</b>
                  <span className="mt-1 block text-sm text-[var(--text-dim)]">{why}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Asking about any of this</h2>
            <p className="mt-3 text-[var(--text-dim)]">
              Questions about your account, a payment or a refund go to Whop, where that
              information is held — reach it from the{' '}
              <a
                href={AFFILIATES_URL.replace('/affiliates', '')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--amber)] hover:underline"
              >
                morsels45 page on Whop
              </a>
              . Anything about the app itself can go there too.
            </p>
            <p className="mt-3 text-[var(--text-dim)]">
              If this page and the app ever disagree, the app is the bug — say so and it gets
              fixed.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          <a
            href={`${SITE_URL}/decide/`}
            className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
          >
            Play free
          </a>
          <Link
            to="/faq"
            className="inline-block rounded-full border border-[var(--border)] px-8 py-3 font-semibold hover:border-[var(--amber)]"
          >
            Read the FAQ
          </Link>
        </div>
      </main>
    </PageShell>
  )
}
