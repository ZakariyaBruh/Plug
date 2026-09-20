# Whop App Store listing — Morsels45

## Positioning

The App Store is browsed by **creators deciding what to install in their community**, not
by hungry people. So the copy is aimed at them, and the pitch is not "decide what to eat" —
it is **daily retention**. A community owner's problem is members going quiet; Morsels45 is
a twenty-second habit with a streak attached, which is exactly the shape of thing that gets
someone to open a whop on a day they had no other reason to.

Everything claimed below is real and in the app today. The dish count is checked by the
build (see `recipeBook` in `vite.config.ts`); the free/paid split is `STANDARD` and
`PREMIUM_SECTIONS` in `lib/site.ts`. Re-read both before editing this — the previous version
of this file said 112 dishes and sold the dietary rules as Premium, months after they were
neither.

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

> **"What do you want to eat?" "I don't mind."**
>
> Everybody has had that conversation. Morsels45 ends it in twenty seconds.
>
> Members answer a handful of either-or questions — hot or cold, quick or slow, something new
> or something they already know — and get one dish. Not a list of forty to scroll past. One.
>
> ### Why put it in your community
>
> The hard part of running a community is the members who quietly stop showing up. Morsels45
> gives them a small reason to come back: a fresh decision every day, a streak that breaks if
> they skip one, XP and levels that climb, badges to chase. It takes twenty seconds — which is
> the point. It is a habit, not a time sink.
>
> **Together mode** makes it a group thing. Up to six people round one phone answer five
> questions each, and it lands on the one dish the whole table can live with, then shows what
> everyone turned out to agree on. It is a Premium mode, but the two-phone version of it —
> send a link, they answer their half — is free, and every invite is a link that travels
> outside your community and points back into it.
>
> ### What members get
>
> - **272 dishes**, each with a recipe, a step-by-step cook mode and a shopping list
> - **Nearby** — everywhere near them that serves it, sorted by what kind of place it is
> - **Rules that stick, free** — vegetarian, vegan or pescatarian; halal, kosher, Hindu, Jain,
>   Sattvic, Buddhist, Sikh, Adventist, Word of Wisdom or Ital; or one ingredient at a time.
>   Answered once on the way in, then never asked again, on every screen in the app
> - **Endless** — two dishes and a clock, free, 200 picks a day
> - Works with no signal, installs to the home screen, and plays entirely from the keyboard
>
> Free to play, and the dietary rules are part of the free half on purpose: an app that keeps
> offering a member food they do not eat does not get paid, it gets deleted. Premium adds six
> more ways to play — Knockout, Blitz, This-or-that, Shortlist, Together and Swipe — cook mode,
> and a shared browser two people drive at once to order or cook together. Nobody has to pay to
> get the daily habit.

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
