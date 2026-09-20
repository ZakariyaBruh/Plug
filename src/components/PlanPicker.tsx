import { Link } from '@tanstack/react-router'
import { useState } from 'react'

/*
 * Ids only, and from products.ts rather than from lib/household.ts — that
 * file talks to Whop with the app's API key and has no business anywhere near
 * a browser bundle.
 */
import {
  HOUSEHOLD_ANNUAL_PLAN_ID,
  HOUSEHOLD_MONTHLY_PLAN_ID,
  PREMIUM_ANNUAL_PLAN_ID,
  PREMIUM_PLAN_ID,
} from '#/lib/products'
import {
  ANNUAL_SAVED,
  ANNUAL_SAVING,
  HOUSEHOLD_SAVED,
  HOUSEHOLD_SEATS,
  HOW_TO_LEAVE,
  PRICE_ANNUAL,
  PRICE_ANNUAL_IF_MONTHLY,
  PRICE_ANNUAL_PER_MONTH,
  PRICE_ANNUAL_VALUE,
  PRICE_HOUSEHOLD,
  PRICE_HOUSEHOLD_ANNUAL,
  PRICE_HOUSEHOLD_ANNUAL_VALUE,
  PRICE_HOUSEHOLD_IF_MONTHLY,
  PRICE_HOUSEHOLD_PER_MONTH,
  PRICE_HOUSEHOLD_PER_SEAT,
  PRICE_HOUSEHOLD_VALUE,
  PRICE_MONTHLY,
  PRICE_VALUE,
  TRIAL_DAYS,
  track,
} from '#/lib/site'

/*
 * ONE BUTTON, TWO SWITCHES.
 *
 * There are four things to buy — solo or household, yearly or monthly — and
 * four buttons on a page about not having to decide things would be a joke at
 * our own expense. So the switches carry the choice and the button stays
 * singular, reading out whichever of the four is selected.
 *
 * THE DEFAULTS ARE JUST ME, YEARLY, and that is the loudest thing on this
 * page. Most people take whatever option requires no action — of every lever
 * a pricing page can pull, the default effect is the one with the strongest
 * replication behind it, and it is worth more than any amount of copy.
 *
 * It is also the one easiest to abuse, so: both alternatives sit on the same
 * switch, at the same size, one tap away, each printing its own price in the
 * same words. A default you can see and change is a suggestion. A default
 * hidden behind a disclosure is a trick, and the difference is the whole of
 * the ethics here. See docs/persuasion.md.
 *
 * All four plans carry the same seven-day trial, which is why the button says
 * the same thing whatever is selected and only the line above it changes.
 */

/*
 * WHAT EACH OF THE FOUR SAYS ABOUT ITSELF.
 *
 * Three fields rather than one sentence, because the yearly plans have an
 * anchor to print and the monthly ones do not, and a single string cannot be
 * struck through in the middle.
 *
 * `anchor` is twelve payments at this product's own monthly price — the real
 * other way to buy the same thing, one tap away on the switch beside it. That
 * is the only kind of reference price allowed here; see docs/persuasion.md.
 */
const PLANS = {
  'solo-yearly': {
    id: PREMIUM_ANNUAL_PLAN_ID,
    value: PRICE_ANNUAL_VALUE,
    price: `${PRICE_ANNUAL} a year`,
    anchor: `${PRICE_ANNUAL_IF_MONTHLY} if you paid monthly`,
    note: `${PRICE_ANNUAL_PER_MONTH} a month, billed once. You keep ${ANNUAL_SAVED}.`,
  },
  'solo-monthly': {
    id: PREMIUM_PLAN_ID,
    value: PRICE_VALUE,
    price: `${PRICE_MONTHLY}`,
    anchor: null,
    note: 'Cancel any time.',
  },
  'household-yearly': {
    id: HOUSEHOLD_ANNUAL_PLAN_ID,
    value: PRICE_HOUSEHOLD_ANNUAL_VALUE,
    price: `${PRICE_HOUSEHOLD_ANNUAL} a year for ${HOUSEHOLD_SEATS}`,
    anchor: `${PRICE_HOUSEHOLD_IF_MONTHLY} if you paid monthly`,
    note: `${PRICE_HOUSEHOLD_PER_MONTH} a month, billed once — ${PRICE_HOUSEHOLD_PER_SEAT} each. You keep ${HOUSEHOLD_SAVED}.`,
  },
  'household-monthly': {
    id: HOUSEHOLD_MONTHLY_PLAN_ID,
    value: PRICE_HOUSEHOLD_VALUE,
    price: `${PRICE_HOUSEHOLD} a month for ${HOUSEHOLD_SEATS}`,
    anchor: null,
    note: 'Cancel any time.',
  },
} as const

function Switch({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: [string, string, string?][]
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div
      className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg)] p-1"
      role="group"
      aria-label={label}
    >
      {options.map(([key, text, badge]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            value === key
              ? 'bg-[var(--amber)] text-black'
              : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
        >
          {text}
          {badge ? (
            <span className={value === key ? 'ml-2 opacity-70' : 'ml-2 text-[var(--amber)]'}>
              {badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

/*
 * `heading` is the "7 days free" line above the price. On by default, because
 * in a pricing card the picker is the only thing that says it — and off where
 * the page's own headline already does, which on the Premium hero had the
 * trial announced twice, a hand's width apart, in two different sizes.
 */
export function PlanPicker({
  size = 'lg',
  heading = true,
  opensOn = 'solo',
}: {
  size?: 'lg' | 'sm'
  heading?: boolean
  /*
   * Which side the "who it covers" switch starts on. Solo nearly everywhere,
   * because most people are buying for themselves — and household at the foot
   * of the section that has just spent four steps explaining the household
   * plan, where opening on "Just me" made the reader undo the page's own
   * argument before they could act on it.
   */
  opensOn?: 'solo' | 'household'
}) {
  const [who, setWho] = useState<'solo' | 'household'>(opensOn)
  const [when, setWhen] = useState<'yearly' | 'monthly'>('yearly')

  const plan = PLANS[`${who}-${when}` as keyof typeof PLANS]
  const big = size === 'lg'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Switch
          label="Who it covers"
          value={who}
          onChange={(next) => setWho(next as 'solo' | 'household')}
          options={[
            ['solo', 'Just me'],
            ['household', `${HOUSEHOLD_SEATS} of us`],
          ]}
        />
        <Switch
          label="How to pay"
          value={when}
          onChange={(next) => setWhen(next as 'yearly' | 'monthly')}
          options={[
            // The saving is computed from the prices in site.ts, so this badge
            // cannot drift away from the numbers beside it.
            ['yearly', 'Yearly', `−${ANNUAL_SAVING}%`],
            ['monthly', 'Monthly'],
          ]}
        />
      </div>

      <p className={`mt-4 ${heading ? `font-bold ${big ? 'text-3xl' : 'text-2xl'}` : ''}`}>
        {heading ? `${TRIAL_DAYS} days free` : null}
        <span
          className={`block font-normal text-[var(--text-dim)] ${heading ? 'text-sm' : 'text-base'}`}
        >
          {/* The price you pay, then the price you did not. The anchor is
              struck through and stays dim: it is a comparison, not an offer,
              and a struck-through number in the same weight as the live one
              is how a pricing page starts lying by typography. */}
          <b className="font-semibold text-[var(--text)]">then {plan.price}</b>
          {plan.anchor ? (
            <>
              {' · '}
              <s className="opacity-70">{plan.anchor}</s>
            </>
          ) : null}
        </span>
        <span className="block text-sm font-normal text-[var(--text-dim)]">{plan.note}</span>
      </p>

      {who === 'household' ? (
        <p className="mt-2 max-w-sm text-sm text-[var(--text-dim)]">
          One subscription, {HOUSEHOLD_SEATS} accounts. You hand the second seat to whoever you
          eat with and they get their own tastes, their own rules and their own saved dishes.{' '}
          {/* Nobody should have to buy a thing to find out how it works. */}
          <a href="/premium#household" className="text-[var(--amber)] underline underline-offset-4">
            How the seat works
          </a>
        </p>
      ) : null}

      <Link
        to="/checkout/$planId"
        params={{ planId: plan.id }}
        onClick={() => track('add_to_cart', { value: plan.value, currency: 'USD', plan: `${who}-${when}` })}
        className={`mt-6 inline-block rounded-full bg-[var(--amber)] font-semibold text-black hover:opacity-90 ${
          big ? 'px-8 py-3' : 'px-6 py-3 text-sm'
        }`}
      >
        Start {TRIAL_DAYS} days free
      </Link>

      {/* THE EXIT, BESIDE THE ASK.
          An easy way out is the most load-bearing trust signal on a page that
          wants a card — and a reader who cannot find one is right to assume
          the worst. Every clause is checkable: Account has one link, and so
          does the Premium strip inside the game. */}
      <p className="mt-3 max-w-sm text-xs text-[var(--text-dim)]">{HOW_TO_LEAVE}</p>
    </div>
  )
}
