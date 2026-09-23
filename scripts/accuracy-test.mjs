/*
 * Can the game still find each dish, if you answer its questions truthfully?
 *
 * WHY THIS EXISTS. The catalogue grew from 112 to 327 to 450 by hand, and
 * every intake described its dishes with slightly fewer of the tags the
 * engine can actually ask about — 8.5 on the first hundred, 6.3 on everything
 * after the hundred and fiftieth. Nothing failed. The build stayed green, the
 * diet gate stayed green, every dish had its recipe. The game just got quietly
 * worse at its one job, and the only way anybody found out was by playing it
 * and feeling that the answers had got vaguer.
 *
 * So this plays all 450 games. For each dish it answers every question the way
 * somebody who wanted that exact dish would — read straight off the dish's own
 * tags — and asks whether the game lands on it.
 *
 * WHAT IT CAUGHT ON THE DAY IT WAS WRITTEN:
 *
 *  - 29 groups of dishes, 70 in all, with byte-identical answers to all 28
 *    questions. Five different things behind "Shepherd's pie". Four behind
 *    "Beef stew". No number of questions can separate those, because there is
 *    no question that distinguishes them: it is not a tuning problem, it is
 *    two dishes wearing one description.
 *  - The give-up rule answering at 0.8% confidence. See hasGivenUp.
 *
 * WHY A PERFECT ANSWERER RATHER THAN A SIMULATED PERSON. Real people mistype,
 * change their minds and answer about the dish they end up wanting rather than
 * the one they started with, and the engine is built to survive all three.
 * None of that can be held to a number. "Somebody who answers honestly can be
 * found" is the floor beneath all of it: fail this and no amount of tolerance
 * for human error will save the game, because it cannot find the dish even
 * when nothing goes wrong.
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

const ITEMS = Data.ITEMS
const ASKABLE = Data.QUESTIONS.map((q) => q.tag)

/*
 * No two dishes may answer all 28 questions identically.
 *
 * This is the one that is worth failing a build over, because it is not a
 * matter of degree: a pair like this makes one of the two unreachable however
 * well anybody answers, and it is invisible in every other check.
 */
const vector = (item) => ASKABLE.map((t) => item.tags[t] || 0).join(',')
const byVector = new Map()
for (const item of ITEMS) {
  const k = vector(item)
  byVector.set(k, [...(byVector.get(k) || []), item.name])
}
const clashes = [...byVector.values()].filter((names) => names.length > 1)
check(
  'no two dishes give identical answers to every question',
  clashes.length === 0,
  clashes.map((c) => c.join(' == ')).join('\n        '),
)

// A player who wants this dish, answering each question off the dish itself.
function play(target) {
  const game = new Engine.Game({ random: () => 0.5 })
  while (!game.shouldGuess()) {
    const next = game.nextQuestion()
    if (!next) break
    const tag = next.question.tag
    const where = game.axis(target, tag)
    const reply =
      where > 0.5 ? 'yes' : where < 0.5 ? 'no' : next.question.neither ? 'neither' : 'either'
    game.answer(tag, reply)
  }
  const ranked = game.ranking()
  return {
    asked: game.answers.length,
    at: ranked.findIndex((r) => r.item.name === target.name),
    got: ranked[0].item.name,
  }
}

const rows = ITEMS.map((item) => ({ name: item.name, ...play(item) }))
const first = rows.filter((r) => r.at === 0)
const sixth = rows.filter((r) => r.at >= 0 && r.at < 6)
const asked = rows.reduce((a, r) => a + r.asked, 0) / rows.length

/*
 * The two numbers, and why they are set where they are.
 *
 * TOP SIX has no slack at all, because the result screen offers six dishes:
 * outside it, the dish somebody answered their way to is not on the screen in
 * any form, which is the game being wrong rather than imprecise.
 *
 * FIRST is 98 rather than 100 on purpose. The last few are pairs like coconut
 * rice and egg fried rice, which are close because the food is close, and
 * driving them apart would mean writing tags that are not true. A gate that
 * can only be met by lying about the catalogue is worse than no gate.
 */
const pct = (n) => (100 * n) / rows.length
check(
  `a truthful player finds the dish first at least 98% of the time (${pct(first.length).toFixed(1)}%)`,
  pct(first.length) >= 98,
  rows
    .filter((r) => r.at !== 0)
    .map((r) => `${r.name} -> ranked ${r.at + 1}, got "${r.got}" after ${r.asked}q`)
    .join('\n        '),
)
check(
  `and it is in the six on screen every time (${pct(sixth.length).toFixed(1)}%)`,
  sixth.length === rows.length,
  rows
    .filter((r) => r.at < 0 || r.at >= 6)
    .map((r) => `${r.name} -> ranked ${r.at + 1}`)
    .join('\n        '),
)

// Accuracy bought with twenty questions is not accuracy, it is an interrogation.
check(`and it takes about a dozen questions, not twenty (${asked.toFixed(1)})`, asked <= 13)

/*
 * The give-up rule, from both ends. Somebody who shrugs at everything still
 * gets a short game; somebody who shrugged only because the dish sits in the
 * middle of three axes does not get answered at random. Bibimbap is the dish
 * that proved the second half: 0.5 on homemade, meat and spicy, all honestly.
 */
function shrugger(replies) {
  const game = new Engine.Game({ random: () => 0.5 })
  let n = 0
  while (!game.shouldGuess()) {
    const next = game.nextQuestion()
    if (!next) break
    game.answer(next.question.tag, replies(n))
    n += 1
  }
  return game.answers.length
}
check('somebody who shrugs at everything is let go quickly', shrugger(() => 'either') <= 6)
check(
  'somebody who answered first is not',
  shrugger((n) => (n < 3 ? 'no' : 'either')) > 6,
)
const bibimbap = rows.find((r) => r.name === 'Bibimbap')
check('bibimbap, the dish that found the give-up bug, is found', bibimbap && bibimbap.at === 0)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
