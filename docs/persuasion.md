# What this site does to you, and why

Every persuasive thing on morsels45 is written down here: what it is, the
evidence it rests on, where it lives in the code, and — for four of them — why
it was refused. If something in the product is trying to change your behaviour
and it is not in this file, that is a bug in this file.

This exists because the alternative is worse. A codebase that applies
behavioural science without saying so accumulates tricks: each one defensible
on its own, none of them ever reviewed together, and no way to tell the ones
that help somebody eat dinner from the ones that just extract a card number.
Writing them down means they can be argued with.

## The line

The research is unambiguous about where persuasion stops and manipulation
starts, and it is not about which technique you use. It is about three
properties of how you use it:

1. **Salience.** The influence is apparent. A default you can see and change is
   persuasion; one hidden under a collapsed section is not.
2. **Autonomy.** The person can still choose the other thing, at the same cost.
   An annual plan preselected next to a visible monthly option preserves
   autonomy. A cancellation that takes an email to support does not.
3. **Alignment.** It serves a goal the person actually has. Reminding somebody
   at 6pm that they have not decided what to eat serves their goal. A
   notification engineered to interrupt them serves ours.

The EU's Digital Services Act and Digital Markets Act (in force 2024–25) and
the FTC's amended Negative Option Rule now put legal weight behind roughly
this line — the DSA's first non-compliance decision, in December 2025, was a
€120m fine against X for deceptive design. But the line is not drawn here
because of the fines. It is drawn here because the techniques on the wrong
side of it stop working on anybody who notices, and everybody eventually
notices.

## Applied

### Default effect — the pricing picker
Most people take whatever option requires no action, and of the pricing levers
this is the one with the strongest replication support. Yearly is preselected
with monthly beside it, same size, one tap, printing its own price in the same
words. Nobody is walked past the option they came for. (There were two
switches here while a two-person household plan existed; it was withdrawn
having never had a member, and the second switch went with it.)
→ `src/components/PlanPicker.tsx`

### Anchoring against a real number
The reference price beside the yearly plan is $59.88 — what twelve monthly
payments actually cost on this product. It is not an invented "was" price; it
is the other thing on the same page. Precise numbers also read as calculated
rather than rounded-up, which is why the price is $29.99 and the anchor is
$59.88 and neither is softened.
→ `src/lib/site.ts` (`PRICE_ANNUAL_IF_MONTHLY`), `src/components/PlanPicker.tsx`

### NOT the decoy effect
A third tier existing only to make the middle one look good is the classic
pricing-page move and it has not replicated well. Every tier here is one
somebody actually buys.

### Peak–end rule — the reveal and the close
People judge a remembered experience by its most intense moment and its last
moment, not its average. So the two moments that get disproportionate care are
the reveal (the answer, arriving) and the close (banking the decision). The
middle is deliberately plain.
→ `public/decide/js/app.js`, `public/decide/styles.css`

### Power of Moments — elevation, insight, pride, connection
The Heaths' four families of defining moment, one each: elevation is the
reveal; insight is the line that tells you something about yourself you had
not said out loud; pride is the count of decisions you have actually made;
connection is Together and the shared browser. Insight is the one a piece of
software can deliver cheaply, because it already holds the evidence: sixty
decisions with timestamps, a count per dish, a yes/no tally per axis. Every
sentence it produces is counted, never inferred, and it says nothing at all
when the numbers do not carry one.
→ `public/decide/js/progress.js` (`noticing`)

### Goal-gradient — the shrinking count
Effort rises as a goal gets closer. The number of dishes still standing is on
screen through every question, in the same three phrasings the landing preview
uses. It is the real shortlist — the list the reveal picks from — not a
progress bar dressed as a count.
→ `public/decide/js/app.js` (`stillSaying`), `src/components/GamePreview.tsx`

### Endowed progress — a head start that was earned
Nunes and Drèze gave one group a ten-stamp loyalty card with two stamps
already filled and another an eight-stamp card with none. Same eight stamps to
go; 34% completion against 19%. The head start here is the onboarding: by the
time the first real question arrives you have already answered one, and the
profile says so. The difference from the car wash is that the stamps are real.
→ `public/decide/js/app.js`

### Implementation intentions — "when shall I ask you next?"
The strongest lever in this document: d = 0.65 across 94 studies, roughly a
doubling of follow-through, from binding a behaviour to a specific cue in an
if-then plan. It is also the one most obviously on the user's side, since the
plan is theirs and the cue is one they name. The only reminder it can
honestly offer is a calendar file: a web app cannot schedule a notification
for tomorrow evening without an account, a push subscription and a backend
that knows when you eat, and a `.ics` needs none of those and is deleted by
its owner without asking us. Otherwise the plan is read back on the landing
screen at the hour they named, and nowhere else.
→ `public/decide/js/progress.js` (`PLAN_CUES`, `planIsDue`), `public/decide/js/app.js` (`paintPlan`, `planIcs`)

### Fogg's B = MAP — prompt at the moment of maximum ability
Behaviour happens when motivation, ability and a prompt coincide. Motivation
for this is already at its peak (you are hungry), so everything here goes into
ability: one tap to an answer, no account, no typing, nothing to set up.

### Hick's law and choice overload — progressive disclosure, not deletion
Iyengar and Lepper's jam stall: 24 flavours drew a bigger crowd and 6 flavours
sold ten times as much. Nothing has been removed from this product — the six
modes, the news, the shelf are all still there — but each screen now offers
one obvious next thing and puts the rest behind a disclosure.

### Reciprocity — the gift, said out loud
Give first, then ask. The whole decide game, all the dishes, every recipe and
every dietary rule are free and permanently free. That was already true and
nowhere stated near the ask, which is reciprocity with the receipt thrown
away.

### Moment of desire — the offer where the want is
An offer made at the moment somebody has demonstrated they want the thing
converts far better than the same offer made on a rotation. Tapping a locked
feature used to fire a toast and open the Whop checkout in the same gesture;
it now opens a card naming the feature, with the trial, the price and the exit
on it, and a "not now" the same size as the yes. It spends no prompt budget
and is not counted as one of the rotating pitches, because it is not one —
somebody asked for it. The permanent "not interested" is hidden on this card:
that switch silences unprompted pitches, and offering it to somebody who just
asked a question would be offering to turn off the answer.
→ `public/decide/js/app.js` (`goPremium`, `openAd`)

### Reverse trial — Premium on for the first five decisions
The diagnosis this answers: people were plainly enjoying the app and then not
seeing a reason to pay for it. That is not a pricing problem or a copy problem.
Somebody who has never used a paid feature is being asked to buy a description
of one, and a description loses to the free thing that already worked.

So the gate is inverted. Five decisions run with Premium on — announced on the
first screen, no card, no account, nothing to cancel — and the accept that
spends the fifth one shows what was actually used and what stops.

Three findings stack here and they stack in this order:

1. **Endowment** (Thaler 1980; Kahneman, Knetsch & Thaler 1990). People value
   a thing more once it is theirs than before. A feature that has already
   saved you four dishes is not the same object as a bullet point about
   saving dishes.
2. **Loss aversion** (~2×). Once it is theirs, naming what stops is worth
   roughly twice what naming what they would gain is worth — and it is the
   same sentence, so the honest version is free.
3. **IKEA effect.** The five decisions are not a demo running past them: the
   profile they build during it is theirs and it is still there afterwards,
   which is also why nothing done during the preview is taken away.

The constraints this is held to:

- **Announced at the start, not discovered at the end.** A trial somebody did
  not know they were in is a bait, and the end screen would read as a bill.
- **Counted, not argued.** The end screen reads the real profile. Somebody who
  used none of it is told that, in those words, and is the person least worth
  pressing. A pitch that has to be true of the reader stops working on the
  people it would not suit, which is the correct behaviour and the only reason
  this is allowed to use loss framing at all.
- **Shown once.** "That was the last of your five" is true on exactly one
  screen. Repeating it after its own deadline is what people mean by nagging,
  so it is marked seen when it is shown, whether or not it was answered.
- **Never retroactive, never repeated.** Granted only to a profile with no
  decisions and no subscription, so an existing player does not get one for
  free and nobody gets a second.
- **Deciding never gated, before or after.** The free tier does not shrink
  when the preview ends; it returns to exactly what it was.
- **Three features stay outside it** — new-dish suggestions, finding somewhere
  nearby, cooking from your cupboard. Each costs money per call. Giving them
  away to every first-time visitor is a bill, not a trial, and pretending
  otherwise would show up as a decision to withdraw them later. The split is
  enforced by `scripts/preview-test.mjs`, which fails the build if a gated
  feature is in neither list, in both, or names something that no longer
  exists. A card refused during the preview says which kind it is and why,
  because a reader who was just told Premium is on has no other way to tell
  that from a lie.
- **The metered ones stay metered.** The chat's three free questions, the
  menu's one every couple of days and its three changes a course are counted
  rather than locked, so they are allowed during the preview at exactly the
  free-tier allowance rather than becoming unlimited. Those read `isPaid()`
  too: an unlimited model bill for somebody who has not paid is the failure
  mode this split exists to prevent.

→ `public/decide/js/progress.js` (`startPreview`, `spendPreview`,
`previewUsed`, `unlocked`), `public/decide/js/app.js` (`isPlus`/`isPaid`,
`PREVIEW_COVERS`, `paintPreviewBanner`, `paintPreviewOver`)

Two gates hold it up. `scripts/preview-test.mjs` runs with the rest of
`bun run test` and enforces the split from the source. `bun run drive` plays
the whole thing in a browser, five decisions from the first screen to the last,
and is the one that found both bugs this shipped with: `saveLimit()` asking
`isPlus()` instead of `unlocked()`, so the app unlocked "Save it" and the
profile then refused it with "your saved list is full" over an empty list; and
the ending screen quoting `FREE_SAVES`, which is 0, to tell people their saved
list would "stop growing past 0". Neither is visible in the source.

### Loss aversion — framed on what is already yours
Losing is felt about twice as strongly as gaining. Applied only where
something is genuinely at stake and genuinely yours: at the end of a trial, a
plain list of what you used and will stop being able to use. Not applied as
invented countdowns or expiring "offers".

### Psychological ownership and the IKEA effect
Effort makes a thing feel more valuable and more yours. The profile is
something you build — rules, tastes, the dishes you struck off — so the app
shows it as a built thing with a count, rather than as settings.

### The Ovsiankina effect — resuming an interrupted decision
The memory half of the Zeigarnik effect did not survive the 2025
meta-analysis; the resumption half did — people pulled away from a task show a
strong tendency to go back and finish it. Four answers given and a phone call
arriving is exactly that, and the only thing previously on offer afterwards
was the first question again, which is not a resumption but a punishment for
being interrupted. Costs nothing to keep: the same two-characters-per-answer
packing the Together links use, in a profile already written on every answer.
It expires at six hours, and the expiry is the honest part — stale answers
handed back as though they still counted would make the app confidently wrong
rather than merely forgetful.
→ `public/decide/js/app.js` (`saveResume`, `liveResume`, `resumeGame`)

### Commitment and consistency — the small yes first
A playable preview on the landing page is a fifteen-second yes before the ask.
It is not a teaser: it uses the real questions, the real wording and real
dishes, and hands over the real thing at the end.

### Unity and connection — two people, one answer
Shared identity is the strongest of Cialdini's principles and the hardest to
fake. The honest version here is that this argument happens *between two
people*, and both of them are in the room. That was briefly sold as a
two-person subscription; it never had a buyer, and the reason is probably that
the thing people wanted was the feature — Together, and the shared browser —
rather than a second seat on a bill. Both are in the one Premium plan.

### Cognitive fluency
Easily processed claims are judged more likely to be true. Short sentences,
concrete nouns, no jargon. This is also just good writing.

## Refused

Four things that would probably work and are not here.

**Fabricated social proof.** No invented user counts, no "1,284 people decided
today", no testimonials from nobody, no review stars in structured data
without reviews. When there is real usage worth quoting it will be quoted and
it will be real.

**Fake scarcity and urgency.** No countdown that resets on reload, no "3 seats
left", no limited-time price that is the permanent price. This is the
technique most likely to be actionable under both the DSA and the FTC Act, and
it is also the one that most insults the reader.

**Variable-ratio reward.** Unpredictable payoffs are the most powerful
engagement mechanic known and they are the mechanism of gambling. The reveal
here is a deterministic function of the answers given. Somebody who wants a
different answer can steer, which is a lever they control.

**Streak-loss guilt.** A streak counts up. It does not beg, it does not warn
you it is about to die, and nothing is taken away for missing a night. A
product for people who are tired and hungry should not add a thing to feel bad
about at 7pm.

## The public copy, and what belongs in it

`src/lib/honesty.ts` and `/honesty` are the public half. They are NOT this
document with the citations removed, and the first draft's mistake was
treating them that way.

That draft was headed "What this site does to you" and led with the
techniques. It was rewritten after one note, which was right: honesty is a
policy, oversharing is a commercial mistake, and the two are not the same
thing. A page telling a hungry stranger how they are being persuaded hands
them a job they did not come for, and makes them suspicious of things they had
not noticed and would not have minded. The same page headed "What we won't do"
gives them something to rely on, which is what anybody who goes looking for a
page like that actually wants.

So the split is by audience, not by detail level:

- **Published**: the four refusals, in plain words, first. The three tests.
  Then the design choices a reader could work out by looking anyway — a
  preselected plan, a struck-through comparison price, a reminder they asked
  for — said out loud so the promises have something to be checked against.
- **Here only**: the effect names, the evidence, the replication arguments
  and the reasoning about where the line sits. Useful to whoever is editing
  this. Not useful to somebody deciding what to eat.

`scripts/honesty-test.mjs` fails the build if any of the four refusals stops
being named in both files — the drift that actually happens is not a typo, it
is somebody quietly dropping one on the way to shipping it.

Writing the page is still a forcing function: a choice that cannot be
described plainly to the person it affects should not be in the product. Two
were dropped on that test — a decoy price tier (already refused above on
replication grounds, and refused twice over once it had to be described to a
reader), and an artificial pause before the reveal, a labour illusion, which
is indefensible in a product whose entire pitch is that this takes twenty
seconds.

## How to add to this file

If you are adding something persuasive: name the effect, cite what it rests
on, point at the code, and check it against the three properties at the top.
If it fails one of them, it does not go in the product. If you cannot tell
whether it fails one of them, write down why you cannot tell — that entry is
worth more than a confident one.
