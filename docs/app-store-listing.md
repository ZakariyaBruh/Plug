# Whop App Store listing — Morsels45

## Positioning

The App Store is browsed by **creators deciding what to install in their community**, not
by hungry people. So the copy is aimed at them, and the pitch is not "decide what to eat" —
it is **daily retention**. A community owner's problem is members going quiet; Morsels45 is
a twenty-second habit with a streak attached, which is exactly the shape of thing that gets
someone to open a whop on a day they had no other reason to.

Everything claimed below is real and in the app today — checked against `lib/site.ts`.

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
> everyone turned out to agree on. Every invite is a link that travels outside your community
> and points back into it.
>
> ### What members get
>
> - **112 dishes**, each with a recipe, a step-by-step cook mode and a shopping list
> - **Nearby** — everywhere near them that serves it, sorted by what kind of place it is
> - **Six more ways to play** — Knockout brackets, thirty-second Blitz, Swipe, Shortlist,
>   This-or-that, and Endless
> - **Rules that stick** — ban meat, seafood, spice or anything else once, and never be asked
>   again
> - Works with no signal, installs to the home screen, and plays entirely from the keyboard
>
> Free to play. Everything above is included — Premium adds extra modes and a shared browser
> for ordering or cooking together, but nobody has to pay to get the daily habit.

---

## Fields to set

| Field | Value |
|---|---|
| `name` | Morsels45 — Decide |
| `description` | the short description above |
| `app_store_description` | the long description above |
| `app_type` | `b2b_app` — currently `website`, which is not an installable app |
| `experience_path` | `/experiences/[experienceId]` — **declared but returns 404** |
| `icon` | already set |
| `banner_image` | missing — needs a 1200×630-ish image |
| `status` | `unlisted` → `live` **last**, after the route exists |

## Blockers before `status: live`

1. **The experience route does not exist.** `experience_path` points at
   `/experiences/[experienceId]` and there is no such route — a member who opens the app
   inside a whop gets the 404 page. This is the one that makes a listing actively harmful
   rather than merely incomplete.
2. **`app_type` is `website`.** That is a site, not something a creator installs.
3. **No banner image.** `status: live` requires name, icon and description; a banner is what
   makes the card worth clicking.

## The honest caveat

Whop communities skew heavily towards trading, reselling, betting and ecommerce. A food
app is not an obvious fit for most of them, and the listing should be judged on whether
*fitness, nutrition, student and lifestyle* communities bite. The retention angle is the
strongest honest pitch available — it is not a guarantee that creators want it.
