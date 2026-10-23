import { ALL_DISHES, type Dish } from '#/lib/dishes'
import { bestFact, meaningfulWords } from '#/lib/dot-kb'

/*
 * WHAT THE FREE ASSISTANT SAYS WHEN NO FREE MODEL ANSWERS.
 *
 * Everything in lib/free-ai.ts can fail at once: those are public services with
 * nothing promised. Until now that meant "the assistant is busy, ask again", which
 * for the most common question this app gets ("im hungry, something cheap and
 * spicy") is a poor answer, because the app can answer that one itself. It has
 * four hundred and fifty dishes and a tag for nearly every word people use.
 *
 * So when the models are silent, a question that is plainly about what to eat is
 * answered from the menu: the words are read for tags ("cheap", "spicy", "quick",
 * "not fried"), the dishes are ranked on them, and the best is named with its own
 * one-line description and a second choice. A question about the app itself is
 * answered from Dot's fact list when it clearly matches one. Anything else (a
 * general question, a recipe, a conversation) is NOT answered from here: a menu
 * has nothing to say to "why is the sky blue", and pretending otherwise would be
 * worse than the busy message.
 *
 * It is always said to be what it is. The reply names the menu as its source and
 * the page marks it, and it is never counted against the day's free questions: it
 * costs nothing and it is not the assistant.
 */

// What people say, and the tag it means. Order does not matter; every word that matches is counted.
const WANTS: [RegExp, string][] = [
  [/\b(spic(y|ier)|chill?i|fiery|kick|heat|jalape|sriracha|vindaloo|curry|curries)\b/, 'spicy'],
  [/\b(cheap|budget|broke|inexpensive|affordable|economical|frugal|on a student|skint)\b/, 'cheap'],
  [/\b(quick|quickly|fast|hurry|in a rush|no time|lazy|easy|simple|minutes?|10 min|15 min|20 min)\b/, 'quick'],
  [/\b(health(y|ier)|light|salad|low[- ]cal|lean|fresh|clean|nutritious|good for me|diet)\b/, 'healthy'],
  [/\b(sweet|dessert|pudding|sugar(y)?|cake|treat|biscuit|ice cream|afters)\b/, 'sweet'],
  [/\b(chocolate|choc|cocoa)\b/, 'chocolate'],
  [/\b(veg(etarian|gie|gies)?|vegan|plant[- ]based|meat[- ]?free|no meat)\b/, 'veg'],
  [/\b(chicken|poultry|wings?)\b/, 'chicken'],
  [/\b(fish|seafood|prawns?|shrimp|salmon|tuna|sushi|crab|squid)\b/, 'seafood'],
  [/\b(cheese|cheesy|cheddar|mozzarella|melty)\b/, 'cheesy'],
  [/\b(soup|soupy|broth|stew|bowl of)\b/, 'soupy'],
  [/\b(bread|sandwich|toast|bun|wrap|sarnie|bagel)\b/, 'bready'],
  [/\b(fried|crispy|deep[- ]fried|chips|fries)\b/, 'fried'],
  [/\b(breakfast|brunch|morning)\b/, 'breakfast'],
  [/\b(comfort|cosy|cozy|stodgy|hearty|warming|homely|hangover)\b/, 'comfort'],
  [/\b(drink|smoothie|shake|coffee|tea|juice|cocktail|thirsty)\b/, 'drink'],
  [/\b(crunchy|crisp|crunch)\b/, 'crunchy'],
  [/\b(share|sharing|party|friends|group|everyone|crowd|guests|family)\b/, 'shareable'],
  [/\b(takeaway|take[- ]?out|delivery|order in|eat out)\b/, 'hot'],
  [/\b(cold|chilled|refreshing|summer)\b/, 'fresh'],
  [/\b(filling|hungry|starving|huge|big appetite|stuffed)\b/, 'filling'],
  [/\b(indulgent|decadent|rich|naughty|spoil)\b/, 'indulgent'],
  [/\b(messy|sticky|finger food|handheld|hands)\b/, 'handheld'],
  [/\b(beef|steak|burger|brisket)\b/, 'beef'],
  [/\b(pork|bacon|ham|sausage)\b/, 'pork'],
  [/\b(egg|eggs|omelette|omelet)\b/, 'egg'],
]

// "no pork", "not fried", "without cheese", "can't eat dairy", "allergic to egg": the tag is ruled out.
const NEGATION = /\b(?:no|not|without|avoid|hate|dislike|allergic to|cannot eat|can't eat|cant eat|don't want|dont want|don't like|dont like|non)\s+(?:any\s+|the\s+)?([a-z-]+)/g

const FOODISH = /\b(eat|eating|hungry|dinner|lunch|supper|tea|tonight|snack|meal|food|dish|recipe|cook|craving|crave|fancy|menu|takeaway|what should i|what shall i|what can i|suggest|recommend|idea|ideas)\b/

function tagsFor(text: string): { want: string[]; avoid: string[] } {
  const q = text.toLowerCase()
  const avoid = new Set<string>()
  for (const m of q.matchAll(NEGATION)) {
    for (const [re, tag] of WANTS) if (re.test(m[1])) avoid.add(tag)
  }
  // Remove the negated phrases before reading what they want, so "not spicy" is not read as wanting spice.
  const positive = q.replace(NEGATION, ' ')
  const want = new Set<string>()
  for (const [re, tag] of WANTS) if (re.test(positive)) want.add(tag)
  for (const tag of avoid) want.delete(tag)
  return { want: [...want], avoid: [...avoid] }
}

function seed(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function jitter(question: string, dish: Dish): number {
  return (seed(question + '|' + dish.name) % 1000) / 1000
}

export type LocalAnswer = { text: string; kind: 'menu' | 'app'; dishes: string[] }

/** The ranked dishes for a question, best first, or [] if nothing in it says what is wanted. */
export function pickFromMenu(question: string, limit = 3): Dish[] {
  const { want, avoid } = tagsFor(question)
  const generic = FOODISH.test(question.toLowerCase())
  if (!want.length && !avoid.length && !generic) return []
  const scored = ALL_DISHES.map((d) => {
    const have = new Set(d.tags)
    if (avoid.some((t) => have.has(t))) return { d, s: -1 }
    const hits = want.filter((t) => have.has(t)).length
    // Every wish has to be met if any dish can meet them all; otherwise the most of them.
    return { d, s: hits * 10 + jitter(question, d) }
  })
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
  if (!scored.length) return []
  if (want.length && scored[0].s < 10) return generic ? scored.slice(0, limit).map((x) => x.d) : []
  return scored.slice(0, limit).map((x) => x.d)
}

/**
 * An answer from the app's own knowledge, or null when this is not something the menu or the fact list can speak to.
 */
export function localAnswer(question: string): LocalAnswer | null {
  const q = question.trim()
  if (!q) return null

  // About the app: only on a clear match, and in English. Anything vaguer would be a guess dressed as a fact.
  // A single keyword is enough when nothing in the question is about food ("how does premium work");
  // it is not when it is ("something cheap and spicy" must not become the price of Premium).
  const fact = bestFact(q)
  const aboutFood = tagsFor(q).want.length > 0 || FOODISH.test(q.toLowerCase())
  if (fact && meaningfulWords(q) <= 9 && (fact.score >= 6 || (fact.score >= 3 && !aboutFood))) {
    return { text: fact.fact.text, kind: 'app', dishes: [] }
  }

  const picks = pickFromMenu(q)
  if (!picks.length) return null
  const [a, b] = picks
  const second = b ? ` If that does not appeal, ${b.name} is the other way to go.` : ''
  return {
    text: `${a.name}. ${a.blurb}${second}`,
    kind: 'menu',
    dishes: picks.map((d) => d.name),
  }
}
