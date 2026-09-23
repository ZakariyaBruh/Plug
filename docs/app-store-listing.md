# Whop App Store listing — Morsels45

## Positioning

The App Store is browsed by **creators deciding what to install in their community**, not
by hungry people. So the copy is aimed at them, and the pitch is not "decide what to eat" —
it is **daily retention**. A community owner's problem is members going quiet; Morsels45 is
a twenty-second habit with a streak attached, which is exactly the shape of thing that gets
someone to open a whop on a day they had no other reason to.

Everything claimed below is real and in the app today. The dish count is checked by the
build (see `recipeBook` in `vite.config.ts`); the free/paid split is `STANDARD` and
`PREMIUM_SECTIONS` in `lib/site.ts`. Re-read both before editing this. This file has now
twice been left describing an app that had moved on — first saying 112 dishes and selling
the dietary rules as Premium, then saying 327 and selling cook mode, the shopping list and
Nearby as free — so treat every number here as something to re-check rather than to trust.

---

## Name

**Morsels45 — Decide**

Keep it. It is short, it is the brand, and the subtitle carries the explanation.

## Short description (listings and search results)

> The 20-second game that settles what's for dinner — and gives your members a reason to
> open your whop every day.

Says what it is *and* why a creator would want it, which is what a one-line listing has to
do. 118 characters.

## App store description (the in-depth view)

This is the text set on the live `app_store_description` field. Every number in it is
produced by the build or read off `lib/site.ts`: 450 dishes and 780 recipes are what
`recipeBook` prints, 200 picks a day is `ENDLESS_DAY`, three questions is `CHAT_FREE`, the
prices and the seven days are `PRICE`, `PRICE_ANNUAL` and `TRIAL_DAYS`, and the free/paid
split is `STANDARD` and `PREMIUM_SECTIONS`.

**What the previous version got wrong**, which is the reason this section now says where
each claim comes from:

- **112 dishes.** Stale by two catalogue intakes. It is 450.
- **Cook mode, the shopping list and Nearby listed under what members get free.** All three
  are Premium, and the listing was selling the paid half as the free half.
- **"The two-phone version of Together is free."** That version does not exist — it is an
  unbuilt task, and the listing was describing it as shipped.
- **"A streak that breaks if they skip one."** True of the mechanic, and the wrong way round
  for this product: nothing in the app is built to make somebody feel bad for missing a day,
  which is written down as a refusal in `docs/persuasion.md`. The streak is named as
  something that climbs, not something to lose.

> "What do you want to eat?" "I don't mind."
>
> Everybody has had that conversation. Morsels45 ends it in twenty seconds.
>
> Members answer a handful of either-or questions — hot or cold, quick or slow, something new or something they already know — and get one dish. Not a list of forty to scroll past. One. If the answer is close but not right, they can point at it — lighter, spicier, sooner — and it answers again in that direction instead of starting over.
>
> WHY PUT IT IN YOUR COMMUNITY
>
> The hard part of running a community is the members who quietly stop showing up. Morsels45 gives them a small reason to come back: a fresh decision every day, XP and levels that climb, a streak, badges to chase. It takes twenty seconds — which is the point. It is a habit, not a time sink.
>
> WHAT IS FREE, PERMANENTLY
>
> • The decide game — about eight questions, never more than twenty
> • All 450 dishes, with 780 recipes to read, browse, search and filter
> • Rules that stick — vegetarian, vegan or pescatarian; halal, kosher, Hindu, Jain, Sattvic, Buddhist, Sikh, Adventist, Word of Wisdom or Ital; or one ingredient at a time. Answered once on the way in, then never asked again on any screen in the app
> • Endless — two dishes and a clock, every pick buying back a little less time. 200 picks a day
> • Tonight's pick — one dish, no questions
> • Ask it anything — three questions, then it is Premium
> • Food news — six headlines a day with the publishers' own summaries
> • XP, levels, streaks and badges
> • No account, no card. Works with no signal, installs to the home screen, plays entirely from the keyboard, and there is an Android app if a tab is not enough
>
> The dietary rules are free on purpose. An app that keeps offering a member food they do not eat does not get paid — it gets deleted.
>
> WHAT PREMIUM ADDS
>
> • It remembers you. Strike a dish off and it never comes back; accept one and it is off the table for a week; everything it offers leans towards what you have actually liked
> • It gets you fed, not just decided — cook mode one step at a time with the timer built in, the shopping list, and somewhere near you that actually serves the thing
> • Six more ways to play — Knockout brackets, thirty-second Blitz, This-or-that, Shortlist, Swipe, and Together
> • Together — up to six people round one phone, five either-ors each, then the one dish the whole table can live with, and what everyone turned out to agree on. Every invite is a link that travels outside your community and points back into it
> • The shared browser — a real browser somewhere else that two people drive at once with a cursor each, opened on the dish you landed on. Order it together, shop the list together, or cook along to the same video in step
> • A planned week, a written menu whenever you like, and the dials: meal slot, heat, how adventurous, a guest at the table
>
> Premium is $4.99 a month or $29.99 a year, with seven days free and one link to cancel.

---

## Fields to set

| Field | Value |
|---|---|
| `name` | Morsels45 — Decide |
| `description` | the short description above |
| `app_store_description` | the long description above |
| `app_type` | stuck at `website` — cannot be changed, see above |
| `experience_path` | `/experiences/[experienceId]` — built, live, returns 302 |
| `icon` | already set |
| `banner_image` | missing — needs a 1200×630-ish image |
| `status` | stays `unlisted` — `live` would publish into a directory that hides website apps |

## STOP — this app cannot be listed as an installable app

`app_type` is `website`, and the API refuses to change it:

```
whop apps update app_whoFNnhtY9AVWJ --app_type b2b_app
HTTP_400: app_type cannot be changed on a website app
```

`whop apps create` has no `--app_type` flag either, so the type is fixed at creation and
there is no CLI route around it. And a website app is excluded from discovery by design —
the list API's own documentation says *"Apps of type `website` are left out unless you ask
for them by name."* Setting `status: live` would therefore publish it into a directory
where nobody browsing can find it, which is the exact problem listing was meant to solve.

(That quote describes the list API's default filter. That the browsable App Store behaves
the same way is an inference, a strong one, but not something anybody here has seen.)

**What still works.** `unlisted` keeps the app "accessible via direct link", so a creator
handed the link can install it today and their members get a working experience — which is
true only because `/experiences/$experienceId` now exists. Installs come from asking rather
than from browsing.

**The one route back** is a fresh app record that is not typed `website` (dashboard, or
`whop apps init`), pointed at this same codebase. Not obviously worth it: Whop communities
skew heavily to trading, reselling and betting, so a food app was already a weak bet before
it needed a second app record, a second route and a second deploy target to chase.

**The copy below is still worth having.** It is the best positioning language this project
has, and it works in a TikTok caption, a Reddit post or a DM to a creator just as well as
in a listing.

## Blockers that would remain even then

1. ~~**The experience route does not exist.**~~ Built and deployed — `/experiences/exp_test`
   returns 302 to `/decide/`. It also verifies Whop's `x-whop-user-token` against the
   published JWKS (`lib/whop-token.ts`), because the SDK ships no verifier and the header
   alone proves nothing on an origin anyone can reach directly.
2. ~~**`app_type` is `website`.**~~ Not fixable — see above.
3. **No banner image.** A banner is what makes a card worth clicking.
4. **No dashboard view.** Both comparable live b2b apps (Automated Churn Recovery, Lobuly AI
   Support) declare a `dashboard_path` for the installing creator. This app has none.

## The honest caveat

Whop communities skew heavily towards trading, reselling, betting and ecommerce. A food
app is not an obvious fit for most of them, and the listing should be judged on whether
*fitness, nutrition, student and lifestyle* communities bite. The retention angle is the
strongest honest pitch available — it is not a guarantee that creators want it.
