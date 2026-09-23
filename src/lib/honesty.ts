/*
 * THE PUBLIC STANDARDS PAGE.
 *
 * This started life as a confession — "what this site does to you", every
 * persuasive technique named, leading with the ones we use. It was rewritten
 * because that framing gets the order and the audience wrong, and the note
 * that caused the rewrite is worth keeping: honesty is a policy, oversharing
 * is a commercial mistake, and they are not the same thing.
 *
 * The distinction is who the page is for. A page headed "here is how we are
 * persuading you" invites a reader to audit the product; nobody arrives at a
 * food app wanting that job, and handing it to them makes a stranger
 * suspicious of things they had not noticed and would not have minded. A page
 * headed "here is what we will not do" gives the same reader something to
 * rely on, which is what they actually came for.
 *
 * The content underneath is largely the same and that is the point: the
 * refusals are the valuable half, they were buried at the bottom, and the
 * techniques they constrain are what makes them mean anything. A promise not
 * to use fake scarcity is worth something precisely because the page admits
 * there are levers here at all.
 *
 * WHAT IS PUBLISHED AND WHAT IS NOT. The four refusals, the three tests, and
 * a plain account of the choices a reader could work out for themselves by
 * looking — a preselected plan, a struck-through comparison price, a reminder
 * they asked for. What is NOT here is the reasoning, the citations and the
 * arguments about where the line sits; that is developer material and it
 * lives in docs/persuasion.md, where it is useful and where it is not asking
 * a hungry stranger to think about behavioural science.
 *
 * KEEP THE REFUSALS IN STEP with that file. scripts/honesty-test.mjs fails
 * the build if any of the four stops being named in both, which catches the
 * case that actually happens: somebody quietly shipping one.
 */

export type Technique = {
  name: string
  /** The choice, in the reader's terms, not in the literature's. */
  what: string
  /** Why it is that way, specifically enough to be checked against the page. */
  here: string
}

/*
 * The test each of the choices below has to pass. Stated first on the page,
 * because a list of design decisions is only worth reading next to the
 * standard they were held to.
 */
export const HONESTY_LINE = [
  {
    name: 'You can see it',
    blurb:
      'Nothing on this site influences you from behind a collapsed section or in wording designed not to be read. If a default is set, it is set in front of you and the other option is next to it.',
  },
  {
    name: 'You can still take the other one',
    blurb:
      'At the same cost, in the same number of taps. A preselected yearly plan beside a one-tap monthly plan is a suggestion. A cancellation that takes an email to support is not.',
  },
  {
    name: 'It serves something you already want',
    blurb:
      'Being reminded at seven that you have not sorted dinner serves your evening. Being interrupted at nine to keep a number going serves ours. Only the first kind is in here.',
  },
]

export const TECHNIQUES: Technique[] = [
  {
    name: 'Premium is already on when you arrive',
    what:
      'Your first five decisions run with everything unlocked \u2014 no card, no account, nothing to cancel \u2014 and when the fifth one lands we count up what you did with it and name what stops.',
    here:
      'It is the plainest thing we do and it is still a technique, so: people value what they have used more than what they have read about, and a loss is felt harder than the same thing offered. The count is taken off your own device, so it is true of you specifically and says nothing when you used none of it. The offer appears once, because by the sixth decision \u201cthat was your last one\u201d is no longer true. Three things stay outside it \u2014 new-dish suggestions, places near you and cooking from your cupboard \u2014 because each one costs us money every time it runs, and giving those away by default would be a bill rather than a trial. Anything else with a counted allowance keeps that allowance during the five rather than becoming unlimited. If you tap one of the three, the card says so and says why.',
  },
  {
    name: 'The plan that is already selected',
    what: 'The yearly plan is preselected, because it is the cheaper of the two per month and the one most people want.',
    here: 'Monthly sits on the same switch, the same size, one tap away, printing its own price in the same words. Nothing is preselected that is only in our interest.',
  },
  {
    name: 'The struck-through price',
    what: 'The yearly plan is shown against $59.88, which is twelve payments at our own monthly price.',
    here: 'It is a real alternative you can take on the same screen, not an invented “was”. Both numbers are computed from the two live prices, so the comparison cannot drift. There is no third tier that exists only to make another look better.',
  },
  {
    name: 'What is free is free permanently',
    what: 'The decide game, every dish, every recipe and every dietary rule. No account, no card, no expiry.',
    here: 'We say so directly above the price rather than three pages away, because a reader deciding whether to pay should know what they already have.',
  },
  {
    name: 'Where the effort went',
    what: 'The moment the answer lands and the moment you accept it get most of the design attention. The middle is deliberately plain.',
    here: 'People remember the best moment and the last one, so those are the two worth making good. Nothing is added to the middle to pad it out.',
  },
  {
    name: 'The count that falls',
    what: 'Every question prints how many dishes are still standing.',
    here: 'It is the real shortlist the answer comes out of, recomputed each time — not a progress bar dressed up as a number. Watching it fall is satisfying and it is also true.',
  },
  {
    name: 'The plan you write yourself',
    what: 'After a couple of decisions you can name the moment you usually need this — “when I get in”. Tying a thing to something that already happens is roughly twice as likely to stick as a time on a clock.',
    here: 'We read it back on the front screen at that hour and nowhere else. No notification, no email, no account, and it never leaves your device. If you want a real reminder you can take a calendar file, which your phone owns and we never see.',
  },
  {
    name: 'What your profile is worth',
    what: 'The profile page counts what you have told it and says how many dishes that takes off the table.',
    here: 'Both numbers are counted against the real catalogue with the same filter the game uses, so the panel cannot claim a rule the app does not apply.',
  },
  {
    name: 'What you would lose',
    what: 'If a subscription is ending we will tell you plainly what stops working.',
    here: 'Only where something is genuinely yours and genuinely at stake. Never as an invented deadline, and never as a reason to hurry.',
  },
  {
    name: 'When we mention the price',
    what: 'Tapping something marked Premium opens a card naming the thing you tapped, with the price, the trial and how to cancel on it.',
    here: 'And a “not now” the same size as the yes. It used to send you straight to a payment page in the same gesture, which was not a choice.',
  },
  {
    name: 'One obvious next thing',
    what: 'Each screen offers one loud action and puts the rest quietly underneath.',
    here: 'Nothing was removed to achieve it — every mode, every list and every setting is still here. Past a handful of equally loud options, people stop choosing at all.',
  },
  {
    name: 'Half a decision, kept',
    what: 'If you get four questions in and something interrupts you, the front screen offers to pick up where you left off.',
    here: 'It expires after six hours — what you felt like at lunchtime is not what you feel like at eight, and handing stale answers back as though they still counted would be worse than losing them.',
  },
  {
    name: 'The preview is the real thing',
    what: 'The playable version on the front page uses the real questions, the real wording and real dishes.',
    here: 'It is a trailer rather than a mock-up, and the build fails if any dish in it stops matching the catalogue. Fifteen seconds is a fairer test of this than a paragraph about it.',
  },
]

export type Refusal = { name: string; blurb: string }

/*
 * The four. Worded so that shipping one of them would make this page
 * demonstrably false rather than merely a bit optimistic — that is the whole
 * point of writing them down, and it is the reason these sentences are more
 * specific than the ones above.
 */
export const REFUSALS: Refusal[] = [
  {
    name: 'Made-up social proof',
    blurb:
      'No invented user counts, no “1,284 people decided today”, no testimonials from people who do not exist, no review stars in the search listing without reviews behind them. When there is real usage worth quoting it will be quoted and it will be real.',
  },
  {
    name: 'Fake scarcity and urgency',
    blurb:
      'No countdown that resets when you reload, no “3 seats left”, no limited-time price that is simply the price. This is also the technique most likely to be illegal, but it is on this list because it insults the reader.',
  },
  {
    name: 'Unpredictable rewards',
    blurb:
      'Payoffs you cannot predict are the most powerful engagement mechanic known and they are the mechanism of a slot machine. The answer you get is a plain function of the answers you gave. If it is wrong you can push it, which is a lever you control.',
  },
  {
    name: 'Making you feel bad for leaving',
    blurb:
      'The streak counts up. It does not beg, it does not warn you it is about to die, and nothing is taken away for missing a night. Something used by tired, hungry people at seven in the evening should not add a thing to feel guilty about.',
  },
]
