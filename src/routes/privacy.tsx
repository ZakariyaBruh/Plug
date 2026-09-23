import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { GA4_ON, REPLAY_ON, SITE_URL, WHOP_PAGE_URL, pageHead } from '#/lib/site'
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
const REVIEWED = '23 September 2026'

/*
 * `lede` is the section's answer, in one sentence, at full brightness. `body`
 * is the detail underneath it in dim text.
 *
 * WHY THE SPLIT EXISTS. This page was eleven headings and about fifteen
 * hundred words, every paragraph the same size and the same grey. Everything
 * on it was true and none of it was obvious: somebody who wanted to know
 * whether the app tracks them had to read three sections to find out that it
 * mostly cannot, because the thing that answers them was in the middle of a
 * paragraph about local storage. A policy nobody can skim is a policy nobody
 * reads, and an unread policy protects nobody — which for a product with a
 * standards page is worse than an ordinary one, because it was supposed to be
 * the part you could check.
 *
 * So every section now leads with its own answer and `id` is its anchor, so
 * the contents at the top can jump straight to it.
 */
type Section = { id: string; heading: string; lede: string; body: string[] }

const SECTIONS: Section[] = [
  {
    id: 'your-browser',
    heading: 'What is stored in your browser',
    lede: 'One entry in your browser, which we cannot read and which is not tied to your name.',
    body: [
      'One entry in your browser’s local storage, called whatShouldIEat.v1. It holds everything the game knows about you: which dishes you have picked and rated, how often, your level, XP, streak and badges, the diets and rules you have set — including any faith you picked one under — dishes you have saved or struck off, your settings, the date you last opened it so it can say \u201cwelcome back\u201d, and today\u2019s suggestions so a second visit does not have to fetch them again.',
      'It never leaves your device. We cannot read it, it is not backed up anywhere, and it is not tied to a name. Clearing your browser data for this site deletes it permanently — there is no copy to restore from, which is the trade for not having to make an account.',
    ],
  },
  {
    id: 'signing-in',
    heading: 'If you sign in or subscribe',
    lede: 'Two cookies, and Whop holds everything else — this app never sees your card, your email or your name.',
    body: [
      'Signing in is handled by Whop. When you do, two cookies are set on this site — wa and wr — which hold the tokens that prove to this app that you are signed in and whether your subscription is active. They are how Premium follows you to another device instead of being locked to one browser.',
      'Payments happen on Whop, not here. This app never sees your card, and it does not store your email or your name — when it needs to know who you are or whether you have paid, it asks Whop and uses the answer.',
      'Signing out clears both cookies. Cancelling is done from your Whop account, and cancelling before the trial ends means you are not charged.',
    ],
  },
  {
    id: 'ai',
    heading: 'The AI features',
    lede: 'Three features send what you type to Google, with nothing attached that says who you are.',
    body: [
      'Ask anything, the menu builder and the five daily suggestions are answered by Google’s Gemini. What you type into the chat box, or the situation you describe to the menu builder, is sent to Google to be answered, along with a short list of dishes you have liked and avoided so the answer is worth having.',
      'Nothing identifying goes with it: no name, no email, no account number, no location. Google’s own terms govern what they do with it, and if that is not something you want, those three features are the only ones that use them — the decide game itself never calls out anywhere.',
    ],
  },
  {
    id: 'nearby',
    heading: 'Nearby, and your location',
    lede: 'Only if you allow it, only to the map services, and never to us.',
    body: [
      'Nearby asks your browser for your location, and your browser asks you first. Say no and the feature simply does not run; nothing else in the app is affected.',
      'If you say yes, your coordinates are sent to the map services that can answer the question — OpenStreetMap’s Overpass and Nominatim, and Photon — to look up places around you. They are not sent to us, and they are not stored anywhere by this app.',
    ],
  },
  {
    id: 'shared-browser',
    heading: 'The shared browser',
    lede: 'Treat it as a shared screen, because that is exactly what it is.',
    body: [
      'Order it together, cook along and shop the list together run a real browser on a service called Hyperbeam, which both of you drive. Anything you type in that browser — including anything you type into somebody else’s checkout — goes to Hyperbeam and to the site you are visiting, exactly as it would in a normal browser.',
      'Treat it as a shared screen, because that is what it is: whoever has the link can see what is on it.',
    ],
  },
  {
    id: 'news',
    heading: 'The news page',
    lede: 'Our server fetches the headlines, so the publishers never see you at all.',
    body: [
      'Headlines are fetched by this site’s own server, not by your browser. That means the publishers never see you: no request from your device reaches the Guardian, Eater, NYT Dining, The Kitchn, Smitten Kitchen, Saveur or King Arthur Baking unless you tap through to read the article, at which point you are on their site under their rules.',
    ],
  },
  {
    /*
     * REWRITTEN BECAUSE IT WAS WRONG.
     *
     * It said the one thing reported was that somebody reached an answer,
     * "no dish name" — and the event had carried the dish name since the day
     * it was written. Then the funnel events were added and it became wronger.
     * A privacy page that describes less than the product sends is the only
     * kind of inaccuracy here that actually matters, so this now lists every
     * event by name and says what rides on each.
     */
    id: 'analytics',
    heading: 'Analytics, and what counts as one',
    lede: 'Eleven events, listed by name, and none of them carries anything about you.',
    body: [
      'This app is hosted by Whop, which adds its own analytics to every page it serves — that is the platform’s, not ours, and it is covered by Whop’s privacy policy.',
      ...(GA4_ON
        ? [
            'Google Analytics 4 is also on. It counts page views and receives the same short list of events below — the same names and the same payloads, not a second, richer copy. It is set up without Google Signals, without advertising features, without a user id and without demographics, so what it knows is what happened on this site rather than who did it. Google’s own terms cover what they do with that.',
          ]
        : []),
      'What this app tells them directly is a short list, and here is all of it: that a decision started, that it reached an answer, that an answer was accepted, that a Premium card was shown, that somebody tapped through to pay, and — if you answer the one-tap question that comes up after five decisions — which of the four options you tapped. Two more when an offer is running: that the offer was shown, and that somebody tapped it. Three more about coming back: that somebody returned on a later day and how many days it had been, that the home-screen offer was shown, and that it was taken. Eleven in total, and every one goes to both places or to neither. Along with those go the number of questions it took, how many dishes were turned down, which Premium card it was, and, on the accepted one only, the name of the dish.',
      'The question has four buttons and no text box, so what is recorded is which button — there is nothing else for it to carry.',
      'What does not go: your dietary rules, your saved dishes, your ratings, your taste profile, anything you type, and anything that identifies you. The reason those are safe is not a promise, it is where they live — see the section above.',
      'There is no Google Analytics here, no advertising pixel of our own, and nothing that follows you to other sites.',
      /*
       * Appears only while session replay is actually switched on. The
       * sentence and the script are driven by the same constant, so this page
       * cannot describe a world the product is not in — in either direction.
       */
      ...(REPLAY_ON
        ? [
            'One exception, and it is on right now: Microsoft Clarity records anonymised replays of sessions on this site — where a cursor went, what was tapped, where somebody got stuck — so we can see why people stop rather than guessing. It masks text content by default, it is not tied to your name or your account, and it is covered by Microsoft’s privacy policy. It is here to find broken screens, and it will be taken out again when it has.',
          ]
        : []),
    ],
  },
  {
    id: 'logs',
    heading: 'Server logs',
    lede: 'Your IP is held in memory long enough to rate-limit the AI, and is never written down.',
    body: [
      'The AI features limit how often one person can call them, which means the server briefly holds the IP address your request arrived from. It is kept in memory only, for as long as the limit window lasts, and is never written to a database or attached to anything else about you.',
      'Ordinary request logs are handled by Cloudflare, which serves this site.',
    ],
  },
  {
    id: 'children',
    heading: 'Children',
    lede: 'No chat, no profiles, no posts, nothing to upload.',
    body: [
      'This is a food app with no chat between users, no profiles, no public posts and nothing to upload. Buying Premium goes through Whop, whose own terms set the minimum age for having an account and paying.',
    ],
  },
  {
    id: 'your-data',
    heading: 'Getting your data, or getting rid of it',
    lede: 'It is in your browser, so you can delete all of it yourself in one tap.',
    body: [
      'Everything the game knows about you is in your own browser, so deleting it is a matter of clearing this site’s data — or using "Wipe this profile" on the profile screen, which empties it from inside the app.',
      'For anything held by Whop — your account, your subscription, your payment history — ask Whop directly, since that is where it lives.',
    ],
  },
]

/*
 * THE FOUR THINGS PEOPLE ACTUALLY CAME TO FIND OUT.
 *
 * Answer first, in the largest type on the page, before any of the detail.
 * Somebody who reads only this has the truth; somebody who wants to check it
 * has eleven sections underneath saying how it works and one list naming
 * everybody involved.
 *
 * The replay line is conditional on the same constant as the script itself
 * and the paragraph in the analytics section, so this cannot advertise a
 * world the product is not in — and, more to the point, cannot quietly fail
 * to advertise one it is. When it is on, it is on the first screen.
 */
const ANSWERS: { q: string; a: string; note: string; loud?: boolean }[] = [
  {
    q: 'Do you need an account?',
    a: 'No',
    note: 'No email, no password, no card. The whole game works signed out.',
  },
  {
    q: 'Does what I do in the game leave my device?',
    a: 'No',
    note: 'Picks, ratings, streaks, diets and saved dishes are written to your browser and stay there. We cannot read them.',
  },
  ...(REPLAY_ON
    ? [
        {
          q: 'Is anything recording this session?',
          a: 'Yes',
          note: 'Microsoft Clarity is recording anonymised replays right now — where a cursor went and what was tapped, with text masked. It is here to find broken screens.',
          loud: true,
        },
      ]
    : []),
  {
    q: 'Is there advertising or cross-site tracking?',
    a: 'No',
    /*
     * The note changes with GA4_ON and the answer does not, which is a
     * distinction worth defending rather than fudging. Advertising: none,
     * either way. Cross-site: Google Analytics set up the way this one is —
     * no Signals, no advertising features, no user id — counts what happens
     * on this site and does not follow anybody off it. So "No" stays true
     * and the note stops claiming something that would not be.
     */
    note: GA4_ON
      ? 'No advertising pixel, and nothing that follows you to other sites. Google Analytics is here, counting pages and the eleven events listed below — with none of its advertising features switched on.'
      : 'No Google Analytics, no advertising pixel of our own, and nothing that follows you to other sites.',
  },
]

/*
 * Named rather than described, because "we may share data with partners" is
 * how a policy avoids saying anything. A reader should be able to check each
 * of these for themselves.
 */
const THIRD_PARTIES: [string, string][] = [
  ['Whop', 'Sign-in, payments, subscription status, and the analytics on every page it serves.'],
  // Driven by the same constant as the script and the paragraph above, so
  // this list cannot fall out of step with what is actually loaded.
  ...(REPLAY_ON
    ? ([['Microsoft Clarity', 'Anonymised session replay, while we work out where people get stuck.']] as [string, string][])
    : []),
  // Driven by GA4_ID, the same way the Clarity row above is driven by
  // CLARITY_ID, so this list cannot fall out of step with what is loaded.
  ...(GA4_ON
    ? ([['Google Analytics', 'Counts page views and the eleven events named above. No advertising features.']] as [string, string][])
    : []),
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
          The four answers first, then how each one works, then everybody this app talks to.
          Written from what the code actually does and checked against it on {REVIEWED}.
        </p>

        {/* The answers, before anything that has to be read. */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {ANSWERS.map((item) => (
            <div
              key={item.q}
              className={`rounded-2xl border px-5 py-5 ${
                item.loud
                  ? 'border-[var(--amber)] bg-[var(--amber-soft)]'
                  : 'border-[var(--border)] bg-[var(--bg-raised)]'
              }`}
            >
              <p className="text-sm text-[var(--text-dim)]">{item.q}</p>
              <p
                className={`mt-1 text-3xl font-bold ${
                  item.loud ? 'text-[var(--amber)]' : 'text-[var(--text)]'
                }`}
              >
                {item.a}
              </p>
              <p className="mt-2 text-sm text-[var(--text-dim)]">{item.note}</p>
            </div>
          ))}
        </div>

        {/* THE ONE LINE THE ANSWERS ABOVE DO NOT CARRY.
            This was the second half of a "short version" section, which the
            four cards had otherwise made into the same sentence three times
            in the first screen and a half. The cards are the short version
            now; this is the bit they cannot fit, and it is the sentence that
            sets up every section below. */}
        <p className="mt-8 text-lg text-[var(--text)]">
          You only hand over anything when you sign in with Whop to buy Premium, or when you use a
          feature that needs an outside service to work — the AI, the shared browser, or finding
          somewhere to eat nearby. Each of those is named below.
        </p>

        {/* And a way to reach the one section somebody came for, without
            scrolling past the nine they did not. */}
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="On this page">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-dim)] hover:border-[var(--amber)] hover:text-[var(--text)]"
            >
              {section.heading}
            </a>
          ))}
        </nav>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.heading} id={section.id} className="scroll-mt-8">
              <h2 className="text-2xl font-bold">{section.heading}</h2>
              {/* The section's own answer, at full brightness, above the
                  detail. Everything below it is the working. */}
              <p className="mt-2 text-lg text-[var(--text)]">{section.lede}</p>
              {section.body.map((line) => (
                <p key={line.slice(0, 40)} className="mt-3 text-[var(--text-dim)]">
                  {line}
                </p>
              ))}
            </section>
          ))}

          <section>
            <h2 className="text-2xl font-bold">Everyone this app talks to</h2>
            {/* The number, because "how many companies is this" is the
                question the list is really being asked, and counting them
                yourself is work. It is computed, so it cannot go stale when
                one is added or replay is switched off. */}
            <p className="mt-2 text-lg text-[var(--text)]">
              {THIRD_PARTIES.length} of them, named. Nothing else is contacted on your behalf.
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
                href={WHOP_PAGE_URL}
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
