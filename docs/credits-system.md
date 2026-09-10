# Credits / Money tab — design spec

Status: **built.** Ledger, postback verification and gating are implemented and tested
(`bun run test:credits` — 42 assertions). What is NOT done is everything that needs an
account somewhere else: a CPX publisher account, a Turso database, and the secrets that
point at them. See §9.

## 1. Shape of the feature

A `Money` tab where a user completes third-party surveys. The survey network pays us per
completion; we credit the user ~30% of that as **points**. Points are spent inside the app to
unlock gated actions (chat messages past a free allowance, news reads, premium features).

Points are **closed-loop**: earned in-app, spent in-app, never cashed out. Keep it that way.
A points balance that converts back to money is a materially different product — stored value,
payout rails, and the regulatory surface that comes with them. Spend-only avoids all of it.

## 2. Provider — CPX Research

All of these are survey/offerwall aggregators with an embeddable wall and S2S postbacks.

| Provider | Integration | Notes |
|---|---|---|
| **CPX Research** | iframe wall + postback | Generous fill, simple setup, widely used for points economies |
| **BitLabs** | JS SDK / iframe + postback | Good UX, strong screenout handling, pays on screenouts |
| **Pollfish** | SDK-first | Better for mobile-native; weaker for embedded web |
| **TheoremReach** | iframe + postback | Solid US fill, stricter approval |
| **Lootably** | offerwall (surveys + offers) | Broader than surveys; more reward-fraud surface |

**CPX is what is wired up**, chosen on payout terms: $25 minimum against BitLabs' $100, and
an open application rather than a sales call. It sits behind a `SurveyProvider` interface in
`src/lib/surveys.ts`, so swapping it means writing one adapter and changing `SURVEY_PROVIDER`.

**Payouts do not reach the Whop balance, and no integration can make them.** Survey networks
pay publishers to PayPal, a bank account, or crypto. Moving that into Whop afterwards is a
deposit you make by hand. Nothing in this design changes that, because nothing can.

All of these need a real domain and an app review before postbacks go live. Budget for it;
it is not same-day.

## 3. The economics

Provider payouts per completion vary widely (~$0.20 to ~$5.00, geo and length dependent).
So do not hardcode a per-survey point value. Derive it:

```
points_awarded = round(net_revenue_usd * POINTS_PER_USD * USER_SHARE)

POINTS_PER_USD = 100      # 1 point = $0.01 of gross revenue
USER_SHARE     = 0.30     # the 30%
```

| Provider pays us | Our cut (70%) | User gets |
|---|---|---|
| $0.50 | $0.35 | 15 points |
| $1.00 | $0.70 | 30 points |
| $3.00 | $2.10 | 90 points |

Sanity-check against the spend side before shipping. If an action costs 5 points and a typical
survey yields 30, one survey buys ~6 actions. Tune `POINTS_PER_USD` until that ratio feels right
— it is the single number that determines whether the economy feels generous or stingy, and
it should live in config, not in code.

**Screenouts matter more than you'd think.** Most survey starts end in a screenout, not a
completion. If screenouts pay nothing, the tab feels broken and users quit. Pay a small flat
consolation (1–2 points) for a screenout, funded out of our 70%.

## 4. Data model — `scripts/credits-schema.sql`

```
credit_accounts
  user_id            PK
  balance            int  -- may go negative after a reversal; block spend while < 0
  lifetime_earned    int
  lifetime_spent     int
  updated_at

credit_ledger                    -- append-only, the source of truth
  id                 PK
  user_id            FK
  delta              int         -- +earn, -spend, -reversal
  reason             enum(survey_complete, survey_screenout, spend, reversal, manual_adjust, signup_bonus)
  provider           text|null
  provider_txn_id    text|null   -- UNIQUE(provider, provider_txn_id)
  net_revenue_usd    numeric|null
  metadata           jsonb
  created_at
```

`balance` is a cache. The ledger is the truth; balance must be recomputable from it. The
`UNIQUE(provider, provider_txn_id)` constraint is what makes postbacks idempotent — networks
retry, and they will double-fire.

## 5. Postback handling — `src/routes/api/surveys/postback.ts`

The reward is granted **only** by a server-to-server postback from the provider. Never by the
client, never by a redirect the browser follows, never by a "survey finished" JS callback. The
client cannot be trusted to report that it earned money.

Endpoint: `POST /api/surveys/postback/:provider`

1. **Verify the signature.** Every provider signs postbacks (usually MD5/SHA of params + your
   secret key). Reject on mismatch. This is the whole security model.
2. **Check the source IP** against the provider's published allowlist.
3. **Idempotency:** insert the ledger row keyed on `(provider, provider_txn_id)`. On conflict,
   return 200 without re-crediting — a retry must not pay twice.
4. **Credit inside a transaction:** ledger insert + balance update, atomic.
5. **Return the exact success body the provider expects** (often literal `1` or `OK`). Anything
   else and they retry forever.

### Reversals

Providers claw back for fraud, duplicate submissions, and low-quality answers. A reversal
arrives as a postback with a negative amount or a `status=reversed` flag. Handle it:

- Write a compensating ledger row. Never delete or mutate the original.
- Let the balance go negative; clamp *spending* at `balance >= cost`, not the balance itself.
- If a user reverses repeatedly, flag the account. Serial reversals are the signature of survey
  fraud, and the network will eventually penalize *us* for the traffic, not them.

## 6. Spending / gating — `src/lib/credits.ts`

One helper, `charge(userId, feature)`, used by every gated route. Free allowance first,
then points, both inside a single write transaction — the check and the deduction cannot be
separated, or two simultaneous requests each see the same last point.

Gating is enforced in the route, next to the expensive work (the Gemini call, the feed fetch).
A disabled button is an affordance, not a control.

| Caller | Chat | News |
|---|---|---|
| **Premium** | unlimited | unlimited |
| **Signed in, standard** | 12/day free, then 1 point | 10/day free, then 1 point |
| **Signed out** | 5/day, best-effort by IP, then sign-in prompt | free (uncountable) |

`premium_action` is defined at 5 points in `COST` and is not yet attached to a feature — wire
it up when you decide which action it gates.

Two honest caveats:

- **The anonymous chat cap is best-effort.** It counts in isolate memory, exactly like the
  burst limiter that was already there, and it does not survive a spread across isolates. It
  is smaller than the signed-in allowance on purpose: signing out has to be a worse deal than
  signing in, or the credits are decorative.
- **Metering the news costs the shared cache.** That endpoint was `public, max-age=900`, so
  four publishers served one request per 15 minutes for all readers. A per-user answer cannot
  be shared, so it is now `private` — each signed-in load is a real fetch of four feeds plus
  two Whop round trips. The allowance is set high because the point is consistency, not
  revenue. It is one number in `FREE_PER_DAY` if you want it looser or gone.

Running out is not rendered as an error. Chat and news both put an **Earn credits** tap in the
failure state that lands on the Credits tab — that transition is the whole funnel.

## 7. Compliance notes

- Survey networks generally require users to be **18+**. Check the chosen provider's terms
  against the app's actual audience before integrating.
- Never phrase the reward as payment for *particular answers*. Points are for completing the
  survey, whatever the responses. Incentivizing specific answers poisons the panel data and gets
  publishers banned.
- Disclose plainly, in the tab: that surveys are run by a third party, that the third party
  receives their responses, and that screenouts pay less than completions.

## 8. What the UI does — `public/decide/`

A `Credits` rail item between News and Profile, with four states: signed out (sign-in prompt),
Premium (nothing is metered for you), configured (balance, today's remaining allowance, the
wall button, ledger history), and unreachable.

The page is strictly a reader. There is no code path in `app.js` that can raise a balance —
points are created by the postback and destroyed by the routes that charge for themselves.
The wall opens in its own tab, the way `/premium` already does, and refocusing this tab
re-reads the balance so points appear without a reload.

## 9. To go live

1. ~~**Create a Turso database**~~ — done: `morsles45-zakarius.aws-us-east-1.turso.io`
2. ~~**Apply the schema**~~ — done, all three tables and the `credit_ledger_txn`
   unique index are live.
3. ~~**Set the secrets**~~ — done. `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
   are set on the app. Note the URL is the `https://` form, not `libsql://`:
   the `libsql://` scheme negotiates a WebSocket first, and the `https://` form
   goes straight to the HTTP pipeline the Workers client uses anyway.
4. **Turn metering on** when you are ready to charge real users:
   `whop apps secrets set --secret CREDITS_ENABLED=true`. Until then the Credits
   tab, the survey wall and the ledger all work and points accrue, but nothing
   is charged — see §12.
5. **Get a CPX publisher account**, then:
   `whop apps secrets set CPX_APP_ID=... CPX_SECURE_HASH=... SURVEY_POSTBACK_IPS=<their postback IPs>`
6. **Point CPX's postback at** `https://morsels45-app.whop.site/api/surveys/postback`
7. **Sanity-check `POINTS_PER_USD`** against the spend side before opening it up (§3).
8. **Decide on a migration bonus.** Chat and news are free today; metering them without
   grandfathering existing users reads as a takeaway.

Until step 1 is done every feature stays free — `charge()` returns `unmetered` when there is
no database, deliberately, so a missing ledger cannot take away something that worked
yesterday. The same is true of step 3: with no `SURVEY_POSTBACK_IPS` the postback route
refuses every caller rather than trusting one.

## 10. Compliance notes

- Survey networks generally require users to be **18+**. Check CPX's terms against the app's
  actual audience before switching it on.
- Never phrase the reward as payment for *particular answers*. Points are for completing the
  survey, whatever the responses. Incentivising specific answers poisons the panel data and
  gets publishers banned.
- The Credits tab discloses that surveys are run by CPX, that CPX sees the responses, and that
  screenouts pay less than completions. Keep that text if you rework the screen.

## 11. Earning inside Whop, instead of outside it

Surveys are the only option here that pays **outside** Whop — CPX pays a publisher to
PayPal, a bank, or crypto, and getting that into the Whop balance is a manual deposit.
Everything below lands in the balance directly, needs no card, and needs no external
account. If the goal is money in Whop without touching it, these outrank the survey wall.

The ledger does not care where points come from. `credit()` dedupes on
`(provider, provider_txn_id)`, so any of these becomes a new `provider` value and reuses
everything already built and tested.

**a. List the app in the Whop App Store.** `app_whoFNnhtY9AVWJ` is currently
`status: unlisted`, `app_type: website`. Published, other creators install it into their
own whops and pay: a one-time install fee, a 10–30% share of what they charge their
members for access, or a per-member subscription. This is the largest number on the page
and the biggest change — an installable app is a different product from a consumer food
app, so it is a positioning decision, not a code change.

**b. Sell credit packs** (§2 of the earlier proposal). Whop checkout, straight into the
balance. Needs plan IDs created in the dashboard.

**c. In-app affiliates.** The `affiliates` API creates affiliate records and commission
overrides — percentage or flat, `first_payment` or `all_payments`, or an account-wide
rev-share. It generates referral URLs with a 30-day attribution cookie, and refunds
reverse commissions automatically (the same shape as the survey reversals in §5). Let
users earn for bringing in Premium buyers: acquisition that costs nothing up front.
One implementation note — **there are no affiliate webhooks**, so unlike the CPX postback
this has to poll `affiliates.overrides.list` to notice earnings.

**d. Whop Partners.** Not app revenue, but free to join with no approval and no card, and
referral earnings transfer into the account balance.

**e. Whop Treasury** pays yield on a USDT0 balance. Worth knowing about specifically
because withdrawing needs a bank or wallet: a balance that cannot come out yet does not
have to sit idle.

## 12. The metering switch

`CREDITS_ENABLED` governs whether anybody is *charged*. It is deliberately not the
same question as whether the database is configured: one is infrastructure, the other
is a decision about live users that has to be reversible in a single field.

Off (the default, and anything that is not `true`/`1`/`yes`/`on`):

- `charge()` returns `unmetered` before it touches the database, so chat and news
  behave exactly as they did before any of this existed.
- The anonymous chat cap is not applied either — metering off means all of it, not
  just the charging.
- `/api/news` goes back to `public` caching, so the shared fifteen-minute cache is not
  given up for a meter that is not running.
- The Credits tab says so plainly and hides the allowance rows, which would otherwise
  read "12 of 12 free" forever and look like a broken meter rather than a paused one.

**Earning is unaffected either way.** Survey postbacks still credit points, and points
banked while metering was off are still there when it comes on. That is what makes the
switch safe to leave off: it costs nothing to wait.
