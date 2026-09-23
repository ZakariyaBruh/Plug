/*
 * Playing it the way a person does: knowing how you feel, not what you want.
 *
 * WHY THIS IS A SECOND TEST AND NOT A BETTER ONE. accuracy-test.mjs asks
 * whether a dish can be found by somebody answering off that dish's own tags.
 * That is a fair question about the catalogue and a dishonest one about a
 * person, because nobody arrives knowing the answer — if they did they would
 * not be here. They arrive knowing they want something hot, quick, not spicy,
 * and nothing with fish in it. The dish is the output, not the input.
 *
 * So each run below starts from a MOOD — a handful of things somebody has
 * decided about their evening — answers every question from that mood and
 * shrugs at everything the mood says nothing about, which is most of it. The
 * question is not "did it find the dish". There is no dish. The question is
 * whether what came back is something a person in that mood would accept.
 *
 * WHAT IT CHECKS, AND WHY EACH ONE IS THE RIGHT QUESTION:
 *
 *   - It must not contradict anything they actually said. Asking for
 *     something quick and being handed a three-hour braise is the failure
 *     people remember, and the one they leave over.
 *   - It must commit. An answer nobody can be given is worse than a wrong
 *     one, and the give-up rule has been the source of both.
 *   - It must not ask twenty questions to get there. Somebody in a mood has
 *     told it a lot by question six.
 *   - Two different moods must not land on the same dish. If they do, the
 *     answers are not being read — they are decoration on a default.
 *
 * WHAT IT FOUND. The moods below are ordinary and none of them was chosen to
 * be hard. Every one of them used to be answerable; what this pins is that
 * they stay answerable when the catalogue next grows.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const JS = join(process.cwd(), 'public', 'decide', 'js')
const loaded = new Map()
function load(file) {
  if (loaded.has(file)) return loaded.get(file)
  const shim = { exports: {} }
  const req = (s) => load(s.replace(/^\.\//, ''))
  new Function('module', 'exports', 'require', readFileSync(join(JS, file), 'utf8'))(
    shim,
    shim.exports,
    req,
  )
  loaded.set(file, shim.exports)
  return shim.exports
}

const Data = load('data.js')
const Engine = load('engine.js')

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

/*
 * Nine evenings. Each is what somebody has decided before they open the app,
 * written as the tags they would answer yes or no to; everything else they
 * genuinely do not mind about, which is the whole point.
 */
const MOODS = [
  { name: 'in a hurry, wants something hot', want: { hot: 1, quick: 1 } },
  { name: 'cannot face cooking, wants comfort', want: { comfort: 1, hot: 1, homemade: 0 } },
  { name: 'wants a takeaway kind of thing', want: { indulgent: 1, homemade: 0, hot: 1 } },
  { name: 'hungover: fried, salty, no thinking', want: { fried: 1, sweet: 0, quick: 1 } },
  { name: 'trying to eat well', want: { healthy: 1, light: 1, fried: 0 } },
  { name: 'wants pudding', want: { sweet: 1, hot: 0 } },
  { name: 'cold and wants soup', want: { soupy: 1, hot: 1 } },
  { name: 'feeding people, wants to share', want: { shareable: 1, hot: 1 } },
  { name: 'wants something cheap and filling', want: { cheap: 1, filling: 1, hot: 1 } },
]

/*
 * A seeded random, because the engine's own tie-break needs a real one.
 *
 * reset() gives every dish a jitter of 0.9 + 0.2*random() so that identical
 * answers do not always land on the same dish. Handing it `() => 0.5`, which
 * is what the accuracy probe does, switches that off — every dish gets the
 * same jitter and near-ties fall back to catalogue order, which is Pizza
 * forever. That made the first version of this test report six Pizzas out of
 * nine and blame the app for something the harness had done. A seed keeps the
 * runs reproducible without flattening the thing being measured.
 */
function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function evening(mood, seed) {
  const game = new Engine.Game({ random: seeded(seed) })
  const said = []
  while (!game.shouldGuess()) {
    const next = game.nextQuestion()
    if (!next) break
    const tag = next.question.tag
    /*
     * The mood answers what it has an opinion about and shrugs at the rest.
     * Most questions get a shrug, which is the realistic case and the one
     * that used to end the game early with a near-random answer.
     */
    const reply = tag in mood.want ? (mood.want[tag] ? 'yes' : 'no') : 'either'
    game.answer(tag, reply)
    if (reply !== 'either') said.push(`${tag}=${reply}`)
  }
  return { game, said, asked: game.answers.length, dish: game.ranking()[0].item }
}

const runs = MOODS.map((m, i) => ({ mood: m, ...evening(m, 1000 + i * 77) }))

for (const run of runs) {
  const { mood, dish, asked, game } = run

  /*
   * THE HARD RULE: it may not contradict something it asked.
   *
   * This is the whole of what the app controls. It cannot honour an opinion
   * nobody put to them, but it can never take an answer and hand back its
   * opposite, and that is the failure people actually leave over — asking for
   * something quick and being given a braise.
   */
  const broken = Object.keys(mood.want).filter((tag) => {
    if (!game.asked()[tag]) return false
    const where = game.axis(dish, tag)
    return mood.want[tag] ? where < 0.5 : where > 0.5
  })
  const heard = Object.keys(mood.want).filter((tag) => game.asked()[tag])
  check(
    `${mood.name} -> "${dish.name}" (${asked}q, asked about ${heard.length}/${Object.keys(mood.want).length})`,
    broken.length === 0,
    broken.length
      ? `contradicts ${broken.map((t) => `${t}=${mood.want[t] ? 'yes' : 'no'}`).join(', ')}`
      : '',
  )
}

/*
 * THE SOFT ONE, AND WHY IT IS A NUMBER RATHER THAN A RULE.
 *
 * The app can only honour what it asks, and it asks whatever splits the field
 * best rather than whatever this person came in caring about. So "in a hurry,
 * wants something hot" can get twelve questions, none of them about speed,
 * and a dish that takes an hour — which is not the app breaking a promise,
 * because it never made one, and is still the reason an answer can feel
 * vague. The share below is the measure of that, and it is the number to
 * watch if the answers ever start feeling off again: it going down means the
 * game is spending its questions further from what people actually mind
 * about.
 */
const stated = runs.reduce((a, r) => a + Object.keys(r.mood.want).length, 0)
const put = runs.reduce(
  (a, r) => a + Object.keys(r.mood.want).filter((t) => r.game.asked()[t]).length,
  0,
)
check(
  `it asks about most of what people came in with (${put}/${stated})`,
  put / stated >= 0.6,
)

/*
 * The one that regressed, by name. "Trying to eat well" shrugs at drink,
 * sweet and hot — the three openers — and the give-up rule read that as
 * having no opinions, stopped at question five and returned fish and chips
 * without ever asking whether they wanted something healthy.
 */
const eatWell = runs.find((r) => r.mood.name === 'trying to eat well')
check(
  `somebody trying to eat well is asked about it before being answered ("${eatWell.dish.name}")`,
  eatWell.game.asked().healthy || eatWell.game.asked().light,
)
check(
  'and is not handed something fried',
  eatWell.game.axis(eatWell.dish, 'fried') < 0.5,
)

// An answer at all. The give-up rule has failed in both directions before.
check(
  'every mood gets an answer',
  runs.every((r) => r.dish),
)

// And gets it without an interrogation.
const longest = Math.max(...runs.map((r) => r.asked))
check(`none of them takes twenty questions (worst was ${longest})`, longest < Engine.MAX_QUESTIONS)

/*
 * Different evenings, different dinners. This is the one that would catch the
 * app quietly falling back on a popular dish when the answers stop telling it
 * anything — which is exactly what happened when a shrug ended the game early,
 * and what "pizza" looked like from the outside.
 */
const dishes = runs.map((r) => r.dish.name)
const unique = new Set(dishes)
check(
  `nine moods give at least seven different dinners (${unique.size})`,
  unique.size >= 7,
  dishes.join(', '),
)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
