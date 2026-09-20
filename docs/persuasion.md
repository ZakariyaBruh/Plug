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
and Just me is preselected; monthly and household sit beside them, same size,
one tap, each printing its own price. Nobody is walked past the option they
came for.
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
connection is the household seat and Together. Insight is the one a piece of
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

### Unity and connection — the household plan
Shared identity is the strongest of Cialdini's principles and the hardest to
fake. The honest version here is that this argument happens *between two
people*, and a subscription covering one of them answers half of it.

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

## The public copy

`src/lib/honesty.ts` and `/honesty` are this document rewritten for the person
the techniques are used on. It carries the same four refusals in plainer
words, and `scripts/honesty-test.mjs` fails the build if any of them stops
being named in both — the drift that actually happens is not a typo, it is
somebody quietly dropping one on the way to shipping it.

Publishing it is partly a differentiator and partly a forcing function: a
technique that cannot be described plainly to the person it is used on should
not be in the product, and having to write that sentence is the fastest way to
find out. Two were dropped on that test while the page was being written: a
decoy price tier (already refused above on replication grounds, and refused
twice over once it had to be described to a reader), and an artificial pause
before the reveal — a labour illusion — which is indefensible in a product
whose entire pitch is that this takes twenty seconds.

## How to add to this file

If you are adding something persuasive: name the effect, cite what it rests
on, point at the code, and check it against the three properties at the top.
If it fails one of them, it does not go in the product. If you cannot tell
whether it fails one of them, write down why you cannot tell — that entry is
worth more than a confident one.
