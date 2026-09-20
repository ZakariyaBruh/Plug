/*
 * A PLAYABLE TASTE OF THE GAME, on the page that is trying to talk you into it.
 *
 * The landing page describes the mechanic in a paragraph and then asks for a
 * click into somewhere else to find out whether the description was any good.
 * Five either-ors and one answer is the whole idea, and it takes about fifteen
 * seconds — which is less than reading the paragraph. So it happens here.
 *
 * WHY IT IS NOT THE REAL ENGINE. The game is a separate static app under
 * public/decide (see routes/decide/$.ts), deliberately: plain scripts, its own
 * stylesheet, no build step, and a service worker in front of it. Importing it
 * here is not possible and reimplementing it would be worse than pointless —
 * the real one has twenty-eight questions, a taste model, dietary rules,
 * snoozes, a bias prior and an explanation of what it let go and why. This is a
 * fifth of the questions over a fifth of the catalogue, with contradictions
 * counted the way the real one counts them and nothing else. It is a trailer.
 * The moment anybody wants more than a trailer, the button hands them the
 * actual thing.
 *
 * WHY THE DISHES ARE COPIED. `ALL_DISHES` reads the whole catalogue out of
 * data.js at build time, and importing it here would bundle a hundred and
 * thirty-three dishes into the landing page to show one. So twenty-four are
 * written out below — and the build checks every one of them against the
 * catalogue (see previewCheck in vite.config.ts), because a copied list is a
 * list that drifts, and a preview that serves a dish the real app does not
 * have, or describes one differently, is a lie told in the shop window.
 */

/*
 * How many questions the real bank holds, for the line that says how much
 * bigger the real thing is. A literal rather than a count of anything here,
 * because nothing here has the real bank — and checked against data.js by the
 * build, for the same reason DISH_COUNT is. The last number on this site that
 * was written down and not checked said 112 for three intakes running.
 */
export const REAL_QUESTIONS = 28

/** The five the preview asks about. Real tags, real questions, real wording. */
export type PreviewTag = 'sweet' | 'hot' | 'quick' | 'handheld' | 'crunchy'

/** How true a tag is of a dish: 1 plainly, 0.5 "depends how it is made". */
export type Level = 1 | 0.5

export type PreviewDish = {
  name: string
  icon: string
  blurb: string
  tags: Partial<Record<PreviewTag, Level>>
}

export type PreviewQuestion = {
  tag: PreviewTag
  text: string
  yes: string
  yesIcon: string
  no: string
  noIcon: string
}

/** 'either' is the real game's third reply: it records nothing. */
export type Reply = 'yes' | 'no' | 'either'

export type Answers = Partial<Record<PreviewTag, Reply>>

/*
 * THE QUESTIONS, and why these five out of twenty-eight.
 *
 * Chosen by measurement rather than by taste. Every five-question subset of
 * the plausible tags was scored on two things: how many of the thirty-two
 * answer paths land on a dish that contradicts nothing, and how many different
 * dishes can win at all — a preview where eleven of the paths end on a pudding
 * is not a preview of this app. These five give 31 of 32 clean and 63 of the
 * catalogue reachable, which was the best of them.
 *
 * The wording is lifted from the real question bank, including the two
 * openers, so the first question somebody sees in the real game is a question
 * they have already seen here.
 */
export const PREVIEW_QUESTIONS: PreviewQuestion[] = [
  { tag: 'sweet', text: 'Sweet or savoury?', yes: 'Sweet', yesIcon: '🍬', no: 'Savoury', noIcon: '🧂' },
  { tag: 'hot', text: 'Hot or cold?', yes: 'Hot', yesIcon: '🔥', no: 'Cold', noIcon: '❄️' },
  {
    tag: 'quick',
    text: 'How soon do you need this?',
    yes: 'Right now', yesIcon: '⚡',
    no: 'I can wait', noIcon: '🕰️',
  },
  {
    tag: 'handheld',
    text: 'Hands or cutlery?',
    yes: 'Eat with hands', yesIcon: '🤲',
    no: 'Knife and fork', noIcon: '🍴',
  },
  {
    tag: 'crunchy',
    text: 'Crunchy or soft?',
    yes: 'Crunchy', yesIcon: '🥨',
    no: 'Soft and tender', noIcon: '🍮',
  },
]

/*
 * THE POOL. Twenty-four dishes, and not an arbitrary twenty-four.
 *
 * Every one of them wins at least one of the thirty-two answer paths, and
 * between them they cover all thirty-one that the catalogue can answer without
 * contradicting anybody. Half of them are here because they are the only thing
 * that fits some corner; the other half are here because a shop window should
 * have pizza in it.
 *
 * Names, icons, blurbs and tag levels are verbatim from data.js, and the build
 * fails if any of that stops being true.
 */
export const PREVIEW_DISHES: PreviewDish[] = [
  { name: 'Pizza', icon: '🍕', blurb: 'A slice big enough to fold. Nobody has ever regretted this.', tags: { hot: 1, quick: 0.5, handheld: 1 } },
  { name: 'Fried chicken', icon: '🍗', blurb: 'Shatteringly crisp outside, ridiculous inside.', tags: { hot: 1, handheld: 1, crunchy: 1 } },
  { name: 'Ramen', icon: '🍜', blurb: 'A bowl of broth you will absolutely drink to the bottom.', tags: { hot: 1 } },
  { name: 'Tacos', icon: '🌮', blurb: 'Three small ones, obviously. Nobody stops at three.', tags: { hot: 1, handheld: 1 } },
  { name: 'Mac and cheese', icon: '🧀', blurb: 'Carbs wearing a cheese blanket.', tags: { hot: 1, quick: 1 } },
  { name: 'Fish and chips', icon: '🍟', blurb: 'Vinegar, too much salt, eaten out of the paper.', tags: { hot: 1, crunchy: 1 } },
  { name: 'Sushi', icon: '🍣', blurb: 'Little parcels, soy sauce, a dab of wasabi.', tags: { handheld: 1 } },
  { name: 'Caesar salad', icon: '🥗', blurb: 'Croutons, anchovy dressing, more parmesan than advertised.', tags: { crunchy: 1 } },
  { name: 'Gazpacho', icon: '🥣', blurb: 'Cold tomato soup, and it works. Trust it.', tags: {} },
  { name: 'Japchae', icon: '🍜', blurb: 'Glass noodles, sesame, vegetables that still have a snap.', tags: { quick: 0.5 } },
  { name: 'Empanadas', icon: '🥟', blurb: 'Pastry, filling, crimped edge. Every country claims a different crimp.', tags: { hot: 0.5, handheld: 1, crunchy: 1 } },
  { name: 'Pretzel', icon: '🥨', blurb: 'Warm, salty, twisted, eaten walking.', tags: { hot: 0.5, quick: 1, handheld: 1, crunchy: 0.5 } },
  { name: 'Cheese and crackers', icon: '🧀', blurb: 'Barely cooking, entirely a meal.', tags: { hot: 0.5, quick: 1, crunchy: 1 } },
  { name: 'Peanut butter toast', icon: '🍞', blurb: 'Two minutes from thought to eaten.', tags: { sweet: 1, hot: 0.5, quick: 1 } },
  { name: 'Crepes', icon: '🥞', blurb: 'Thin, lacy, folded around chocolate.', tags: { sweet: 1, hot: 1, handheld: 0.5 } },
  { name: 'Churros', icon: '🥨', blurb: 'Cinnamon sugar and a cup of chocolate to dunk in.', tags: { sweet: 1, hot: 1, handheld: 1, crunchy: 1 } },
  { name: 'Pastel de nata', icon: '🥚', blurb: 'Burnt on top on purpose. Eat it warm, standing up.', tags: { sweet: 1, hot: 1, quick: 1, crunchy: 1 } },
  { name: 'Cinnamon roll', icon: '🍩', blurb: 'Best warm, from the middle outwards.', tags: { sweet: 1, hot: 0.5, handheld: 1 } },
  { name: 'Apple pie', icon: '🥧', blurb: 'With cream, and no discussion about it.', tags: { sweet: 1, hot: 0.5 } },
  { name: 'Baklava', icon: '🍯', blurb: 'Layers you cannot count, held together by syrup and nerve.', tags: { sweet: 1, hot: 0.5, crunchy: 1 } },
  { name: 'Doughnut', icon: '🍩', blurb: 'Sugar on your fingers, no plate involved.', tags: { sweet: 1, hot: 0.5, quick: 1, handheld: 1 } },
  { name: 'Cookies', icon: '🍪', blurb: 'Still warm, edges crisp, middle not quite set.', tags: { sweet: 1, hot: 0.5, quick: 1, handheld: 1, crunchy: 1 } },
  { name: 'Ice cream', icon: '🍦', blurb: 'Straight from the tub is a valid serving suggestion.', tags: { sweet: 1, quick: 1, handheld: 1 } },
  { name: 'Yoghurt parfait', icon: '🥣', blurb: 'Layers of yoghurt, granola, berries.', tags: { sweet: 1, quick: 1, crunchy: 0.5 } },
]

function level(dish: PreviewDish, tag: PreviewTag): number {
  return dish.tags[tag] ?? 0
}

/*
 * How many things this dish plainly contradicts.
 *
 * ONLY THE FAR END CONTRADICTS, which is the real engine's rule and the one
 * thing about it worth copying exactly. A dish at 0.5 on an axis is one that
 * can be made either way, and it never argues with anybody — most of the
 * catalogue sits at 0.5 on most axes simply because nobody has tagged it at
 * either end, and treating that as disagreement makes half the menu
 * unreachable. `either` records nothing at all.
 */
export function faults(dish: PreviewDish, answers: Answers): PreviewTag[] {
  const out: PreviewTag[] = []
  for (const q of PREVIEW_QUESTIONS) {
    const said = answers[q.tag]
    if (!said || said === 'either') continue
    const has = level(dish, q.tag)
    if ((said === 'yes' && has === 0) || (said === 'no' && has === 1)) out.push(q.tag)
  }
  return out
}

/** How well it fits, as a number, for breaking ties between equals. */
function fit(dish: PreviewDish, answers: Answers): number {
  let score = 0
  for (const q of PREVIEW_QUESTIONS) {
    const said = answers[q.tag]
    if (!said || said === 'either') continue
    const has = level(dish, q.tag)
    score += said === 'yes' ? has : 1 - has
  }
  return score
}

/** Everything still contradicting nothing — the number that shrinks as you go. */
export function stillStanding(answers: Answers): PreviewDish[] {
  return PREVIEW_DISHES.filter((dish) => faults(dish, answers).length === 0)
}

export type Verdict = {
  dish: PreviewDish
  /** What it had to contradict to be the best answer available. Usually empty. */
  letGo: PreviewTag[]
}

/*
 * The answer.
 *
 * Fewest contradictions first and only then best fit, which is the real
 * engine's order and matters: a dish that agrees with four answers and flatly
 * contradicts the fifth is a worse answer than one that agrees with three and
 * contradicts none. Ties fall to the order the pool is written in, so the same
 * five answers always produce the same dish — a preview that gave two
 * different answers to the same questions would be a demo of a coin.
 *
 * One of the thirty-two paths cannot be answered cleanly by anything in the
 * catalogue, let alone this pool: sweet, cold, slow, eaten with hands and
 * crunchy is not a dish. That is what `letGo` is for, and the real game does
 * the same thing in the same words rather than quietly serving a compromise.
 */
export function decide(answers: Answers): Verdict {
  const ranked = PREVIEW_DISHES.map((dish, at) => ({
    dish,
    at,
    missed: faults(dish, answers),
    score: fit(dish, answers),
  })).sort((a, b) => a.missed.length - b.missed.length || b.score - a.score || a.at - b.at)

  return { dish: ranked[0].dish, letGo: ranked[0].missed }
}

/*
 * STEERING, WHICH IS THE THING WORTH SHOWING.
 *
 * The preview asked five questions, gave one answer, and stopped. That is the
 * old app: you could take the answer or leave it, and leaving it was the only
 * thing you could say about it. The real one now lets you point — lighter,
 * spicier, quicker — and the answer moves in that direction.
 *
 * Here every tag has already been spoken for by the five questions, so a
 * steer FLIPS an answer rather than adding one, and the verdict is worked out
 * again from scratch. Same engine, one thing changed, which is exactly what
 * happens in the app.
 */
export type Steer = { tag: PreviewTag; value: Reply; label: string; said: string }

/** What is worth offering, given what they said and what they got. */
export function steersFor(answers: Answers, dish: PreviewDish): Steer[] {
  const out: Steer[] = []
  for (const q of PREVIEW_QUESTIONS) {
    const said = answers[q.tag]
    // Only a stated answer can be reversed; "either" was never a direction.
    if (!said || said === 'either') continue
    const flip: Reply = said === 'yes' ? 'no' : 'yes'
    // No point offering a direction the dish is already in.
    const has = level(dish, q.tag)
    if (flip === 'yes' && has === 1) continue
    if (flip === 'no' && has === 0) continue
    out.push({
      tag: q.tag,
      value: flip,
      label: flip === 'yes' ? q.yes : q.no,
      said: `${flip === 'yes' ? q.yes : q.no}, then.`,
    })
  }
  return out
}

/** The same answers with one of them changed. */
export function withSteer(answers: Answers, steer: Steer): Answers {
  return { ...answers, [steer.tag]: steer.value }
}

/** "crunchy" -> "Crunchy", for saying which answer had to give. */
export function replyWords(tag: PreviewTag, said: Reply): string {
  const q = PREVIEW_QUESTIONS.find((x) => x.tag === tag)
  if (!q) return tag
  return said === 'yes' ? q.yes : q.no
}
