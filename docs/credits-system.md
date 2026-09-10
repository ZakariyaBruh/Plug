# Credits / Money tab — design spec

Status: **design only, not implemented.** The app source is not in this repo yet
(`whop apps pull` still needs an app id). This document captures the decisions that are
expensive to change after launch, so implementation is mechanical once the code lands.

## 1. Shape of the feature

A `Money` tab where a user completes third-party surveys. The survey network pays us per
completion; we credit the user ~30% of that as **points**. Points are spent inside the app to
unlock gated actions (chat messages past a free allowance, news reads, premium features).

Points are **closed-loop**: earned in-app, spent in-app, never cashed out. Keep it that way.
A points balance that converts back to money is a materially different product — stored value,
payout rails, and the regulatory surface that comes with them. Spend-only avoids all of it.

## 2. Provider choice — DECISION NEEDED

All of these are survey/offerwall aggregators with an embeddable wall and S2S postbacks.

| Provider | Integration | Notes |
|---|---|---|
| **CPX Research** | iframe wall + postback | Generous fill, simple setup, widely used for points economies |
| **BitLabs** | JS SDK / iframe + postback | Good UX, strong screenout handling, pays on screenouts |
| **Pollfish** | SDK-first | Better for mobile-native; weaker for embedded web |
| **TheoremReach** | iframe + postback | Solid US fill, stricter approval |
| **Lootably** | offerwall (surveys + offers) | Broader than surveys; more reward-fraud surface |

Recommendation: **CPX Research or BitLabs**, and design the integration behind our own
`SurveyProvider` interface so a second one can be added later. Fill rate varies a lot by
geo — running two walls is common and worth planning for.

Every one of these requires a real domain and an app review before postbacks go live. Budget
for that; it is not same-day.

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

## 4. Data model

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

## 5. Postback handling — the part that gets exploited

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

## 6. Spending / gating

One server-side helper, used by every gated feature:

```
spendCredits(userId, cost, reason, idempotencyKey) -> ok | insufficient
```

Gating must be enforced **server-side**, at the same place the expensive work happens (the model
call, the article fetch). A disabled button is a UI affordance, not a control.

Proposed gates — all values config, not constants:

| Feature | Free allowance | Then |
|---|---|---|
| Chat | 5 messages / day | 1 point per message |
| News | 3 articles / day | 1 point per article |
| Premium action (`x`) | — | 5 points |

The free allowance resets on a rolling daily window. Premium/paid tiers bypass gating entirely
(see open question 3).

When a user hits zero, the "out of credits" state should link straight into the Money tab. That
transition is the entire funnel — it is worth designing properly rather than as an alert.

## 7. Compliance notes

- Survey networks generally require users to be **18+**. Check the chosen provider's terms
  against the app's actual audience before integrating.
- Never phrase the reward as payment for *particular answers*. Points are for completing the
  survey, whatever the responses. Incentivizing specific answers poisons the panel data and gets
  publishers banned.
- Disclose plainly, in the tab: that surveys are run by a third party, that the third party
  receives their responses, and that screenouts pay less than completions.

## 8. Open questions

1. **Which provider?** (§2) Blocks the whole integration — needs an account and app review.
2. **`POINTS_PER_USD`?** (§3) Sets the feel of the economy.
3. **What are the existing user tiers?** "Standard users" implies a premium tier that skips
   gating. Need to see how the app currently models this.
4. **Do existing users get a starting balance?** Gating chat and news with no grandfathering
   will read as a takeaway to current users. A signup/migration bonus is the usual fix.
