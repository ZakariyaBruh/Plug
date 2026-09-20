/*
 * THE PUBLIC VERSION OF docs/persuasion.md.
 *
 * That file is for whoever is editing this codebase: it carries the evidence,
 * the code pointers and the arguments. This one is for the person the
 * techniques are being used on, which is a different reader with a different
 * question — not "is this well sourced" but "what is being done to me, and can
 * I trust the answer".
 *
 * WHY PUBLISH IT AT ALL. Three reasons, in increasing order of how much they
 * actually matter.
 *
 * It is a differentiator, and a cheap one: every site in this category uses
 * most of this list and none of them will print it.
 *
 * It is a forcing function. A technique that cannot be described plainly to
 * the person it is used on is a technique that should not be in the product,
 * and having to write the sentence is the fastest way to find out. Two failed
 * that test while this page was being written: a decoy price tier, and an
 * artificial pause before the reveal to make the engine look busier than it
 * is. Both were on the plan; neither survived being written down.
 *
 * And it is the only version of "trust us" that means anything. A site can
 * say it is honest, which costs nothing and is what a dishonest site says
 * too. Listing the specific ways it is trying to influence you is a claim
 * that can be checked against the pages it describes, and a reader who checks
 * one and finds it accurate has a reason to believe the next one.
 *
 * KEEP THIS AND docs/persuasion.md IN STEP. The refusals especially: a
 * promise made here and not kept there is the worst kind of thing this file
 * could become. scripts/honesty-test.mjs checks that the four refusals appear
 * in both, which catches the case that actually happens — somebody quietly
 * shipping one of them.
 */

export type Technique = {
  name: string
  /** What the effect is, said in one sentence to somebody who has not met it. */
  what: string
  /** What this product does with it, specifically enough to be checked. */
  here: string
}

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
    name: 'Defaults',
    what: 'Most people take whatever option needs no action. It is the single most powerful thing on any page that offers a choice.',
    here: 'The yearly plan and the single-person plan are preselected on the pricing switch. Monthly and Household sit beside them, same size, one tap, each printing its own price.',
  },
  {
    name: 'Anchoring',
    what: 'A price is judged against whatever number you saw first, so the number next to it does a lot of the arguing.',
    here: 'The yearly price is shown against $59.88 — twelve payments at this product’s own monthly price, struck through. That is a real alternative you can take on the same screen, not an invented “was”. There is no third tier that exists only to flatter the second.',
  },
  {
    name: 'Reciprocity',
    what: 'Being given something first makes an ask afterwards much harder to refuse.',
    here: 'The decide game, every dish, every recipe and every dietary rule are free and permanently free. We now say so immediately above the price, which is exactly where it works hardest.',
  },
  {
    name: 'The peak and the end',
    what: 'You remember an experience by its most intense moment and its last moment, not by its average.',
    here: 'Disproportionate care goes into the reveal and into the screen after you accept. The middle is deliberately plain.',
  },
  {
    name: 'The goal gradient',
    what: 'Effort towards a goal rises as the goal gets closer, so a number falling is more motivating than a number rising.',
    here: 'Every question prints how many dishes are still standing. It is the real shortlist the answer comes out of, not a progress bar dressed up as one.',
  },
  {
    name: 'Implementation intentions',
    what: 'Binding a thing you mean to do to a cue that already happens — “when I get in, I’ll sort dinner” — roughly doubles the chance you do it. It is the best-evidenced idea in this list by a distance.',
    here: 'After a couple of decisions you can name the moment you usually need this. We then read it back to you on the front screen at that hour, and nowhere else. No notification, no email, no account. If you want a real reminder you can take a calendar file, which your phone owns and we never see.',
  },
  {
    name: 'Psychological ownership',
    what: 'People value what they have put effort into far beyond what the effort was worth.',
    here: 'Your profile page counts what you have told it and says how many dishes that takes off the table. Both numbers are counted against the real catalogue with the same filter the game uses.',
  },
  {
    name: 'Loss framing',
    what: 'Losing something is felt about twice as strongly as gaining the same thing.',
    here: 'Used only where something is genuinely yours and genuinely at stake — what you would stop being able to use if a subscription ended. Never as an invented deadline.',
  },
  {
    name: 'Offers at the moment you reach for something',
    what: 'An offer made when you have just shown you want a thing lands far better than the same offer made at random.',
    here: 'Tapping something marked Premium opens a card naming the thing you tapped, with the price, the trial and how to cancel on it — and a “not now” the same size as the yes. It used to send you straight to a payment page in the same gesture, which converted worse and was not a choice.',
  },
  {
    name: 'Fewer choices',
    what: 'Past a handful of options, people take longer and buy less. The famous version is a jam stall: twenty-four flavours drew the bigger crowd and six flavours sold ten times as much.',
    here: 'Each screen offers one obvious next thing. Nothing has been removed to achieve that — every mode, every list and every setting is still here, just not all shouting at once.',
  },
  {
    name: 'Unfinished business',
    what: 'A task you were pulled away from nags at you, and people show a strong pull to go back and finish one.',
    here: 'If you get four questions in and something interrupts you, the front screen offers to pick up where you left off instead of making you start again. It expires after six hours, because what you felt like at lunchtime is not what you feel like at eight and handing those answers back as though they still counted would be worse than losing them.',
  },
  {
    name: 'A small yes first',
    what: 'Somebody who has already done a small version of a thing is far more likely to do the larger one.',
    here: 'The playable preview on the front page. It is not a teaser: it uses the real questions, the real wording and real dishes, and hands you the real thing at the end.',
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
