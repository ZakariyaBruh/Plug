# Should 350 of the 450 dishes be Premium?

A decision record, written before the decision, because it is the kind of
change that is easy to ship and expensive to reverse.

**Recommendation: no — not as a wall. Yes, if you want it, as an embargo.**
The reasoning is below and the numbers are reproducible: `bun run test` runs
the accuracy gate, and the diet counts come from the same catalogue.

## The case for it is real

A free tier of 450 hand-written dishes with recipes is a lot to give away, and
"more dishes" is the most legible thing a subscription could add. It is also
the one lever that scales with the work already done rather than needing new
features built.

And the objection I expected to be decisive is not. Running the accuracy probe
over a 100-dish slice:

| catalogue | finds the dish first | mean questions |
|---|---|---|
| all 450 (today) | 99.3% | 11.4 |
| a free 100 | 100.0% | 7.8 |

Fewer dishes are *easier* to tell apart, so the free game would be more
accurate, not less. The engine is not the argument.

## Four things that are

**1. Restricted diets collapse.** Dietary rules are free on purpose — the
reasoning is in `data.js` and it is that an app which keeps offering a Muslim
pork gets deleted rather than paid. But a diet is a filter applied *before*
any paywall, so the two multiply. Dishes left, against the full catalogue and
against a free hundred:

| diet | all 450 | free 100 |
|---|---|---|
| Vegan | 98 | 17 |
| Ital | 97 | 17 |
| Jain | 74 | 20 |
| Sattvic | 116 | 35 |
| Buddhist, vegetarian | 129 | 36 |
| Vegetarian | 211 | 49 |
| Kosher | 329 | 84 |

A vegan free user would get seventeen dishes. Deciding dinner five times a
week, they see the entire free catalogue inside a month, and "don't repeat
this week" is itself Premium — so they would see repeats immediately. That is
not a reduced product, it is a broken one, and it breaks hardest for exactly
the people the free dietary rules were meant to serve.

**2. It contradicts what the site currently promises, in writing, everywhere.**
`THE_GIFT` — on the homepage and directly above the price — says "every dish,
every recipe, and everything you do not eat — free, permanently". The same
claim is on /premium, /faq, the app store listing, the reverse trial's ending
screen, and /honesty, whose entire standard is that nothing in the product
contradicts what the product publishes. Withdrawing 350 dishes would be the
most visible broken promise available, and it would be the second withdrawal
in a month after the household plan. For a product whose differentiator is a
published standards page, that is the expensive kind of cheap.

**3. The funnel says dish count is not the bottleneck.** 557 people, 513
opened the app, 34 reached the price page, 0 bought. Nobody is bouncing off
"not enough dishes" — they are not reaching the price at all, and the 34 who
did said no to a price, not to a catalogue. Gating dishes moves neither
number. It only makes the product worse for the 479 who never asked to pay.

**4. It would confound the reverse trial before it has produced a week of
data.** Premium-on-for-five-decisions shipped days ago and is the freemium
mechanism, deliberately chosen over a wall. Changing the free/paid line now
means never knowing which change did what — and the trial is the one that can
be measured, because `preview_ended` carries what each person actually used.

## The version worth having

If the catalogue is to earn its keep, make it an **embargo rather than a
wall**: new dishes arrive for Premium first and reach everybody some weeks
later.

- Nothing is taken from anyone. The free catalogue only ever grows, so
  "every dish free" stays true as written — it becomes a statement about
  eventually rather than immediately, which is a sentence /honesty can carry.
- No diet collapses, because today's 450 stay free for everyone.
- It gives Premium a recurring, visible reason to exist that is not a feature
  you have to build.
- It costs no accuracy: Premium searches more dishes, free searches today's,
  and both are above the gate.

## What to do first, either way

Wait for the reverse trial's numbers. `preview_ended` reports what each person
did with their five decisions, `premium_why` reports what they say they want,
and Clarity now records the sessions. Two weeks of that will say more about
where the money is than any argument in this file — including this one.
