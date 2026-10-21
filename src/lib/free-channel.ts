import { today } from '#/lib/allowance'
import { RADIO_CATEGORIES } from '#/lib/radio'
import { TV_CATEGORIES } from '#/lib/tv'

/*
 * TODAY'S ONE FREE CHANNEL.
 *
 * TV and radio are Premium, with an exception that changes daily: one TV group
 * and one radio group, each picked at random, are free to anybody signed in.
 * Everything else needs Premium.
 *
 * "Random" is a hash of the UTC date rather than a roll of the dice, so it is
 * the same pick for everybody all day, the same on every server that answers,
 * and it needs nothing stored. It turns over at the same moment the daily
 * allowances do (see allowance.ts, today()).
 */
export type FreePick = { medium: 'tv' | 'radio'; id: string; name: string; emoji: string }

function pool(): FreePick[] {
  return [
    ...TV_CATEGORIES.map((c) => ({ medium: 'tv' as const, id: c.id, name: c.name, emoji: c.emoji })),
    ...RADIO_CATEGORIES.map((c) => ({ medium: 'radio' as const, id: c.id, name: c.name, emoji: c.emoji })),
  ]
}

// FNV-1a: small, dependency-free, and spreads consecutive dates well enough
// that tomorrow's pick is not predictable from today's.
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export type FreePicks = { tv: FreePick; radio: FreePick }

// One for each medium, each picked on its own: a day with a free TV group is
// not a day without a free radio one. The medium is part of what is hashed, so
// the two are not tied together.
export function freePicks(day = today()): FreePicks {
  const all = pool()
  const pickFrom = (medium: 'tv' | 'radio') => {
    const mine = all.filter((p) => p.medium === medium)
    return mine[hash(`${medium}:${day}`) % mine.length]
  }
  return { tv: pickFrom('tv'), radio: pickFrom('radio') }
}

export function isFree(medium: 'tv' | 'radio', category: string, day = today()): boolean {
  return freePicks(day)[medium].id === category
}
