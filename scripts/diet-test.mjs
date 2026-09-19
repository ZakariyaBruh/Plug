/*
 * The dietary promise, end to end.  bun run scripts/diet-test.mjs
 *
 * "Everything you don't eat, off the menu" is the one claim on this site that
 * somebody could be harmed by trusting, and it is the one the whole trust
 * position rests on. vite.config's dietCheck proves the CATALOGUE is sound —
 * nothing counts as vegetarian while carrying an animal tag, and no diet is
 * starved. This proves the ENGINE honours it: every preset plays real games
 * and the answer never breaks the rule that was set.
 *
 * Both are needed. The catalogue was wrong (khao soi, tagged chicken, derived
 * vegetarian) and separately the engine was lenient (a tag of 0.5 survived a
 * ban, so a vegetarian was offered Caesar salad). Either one alone would have
 * served the wrong dinner to somebody who had told us not to.
 *
 * Whop is not involved and neither is a browser: these are the two pure
 * modules, run directly.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/*
 * decide/js is UMD and predates this repo's module system, so it is executed
 * rather than imported — the same trick vite.config uses. `require` is shimmed
 * because engine.js asks for data.js by path.
 */
const JS = join(process.cwd(), 'public', 'decide', 'js')
const loaded = new Map()
function load(file) {
  if (loaded.has(file)) return loaded.get(file)
  const shim = { exports: {} }
  const req = (spec) => load(spec.replace(/^\.\//, ''))
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
const Progress = load('progress.js')

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

/*
 * A fixed generator, so a failure is reproducible from its seed rather than
 * being a thing that happened once on someone's machine.
 */
function rng(seed) {
  return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
}

const GAMES = 60

for (const diet of Progress.DIETS) {
  const bans = diet.tags.slice()
  const broken = []
  let silent = 0

  for (let g = 0; g < GAMES; g++) {
    const random = rng(g * 7919 + 13)
    const game = new Engine.Game({ random })
    game.setBans(bans)

    for (let i = 0; i < Engine.MAX_QUESTIONS && !game.shouldGuess(); i++) {
      const question = game.nextQuestion()
      if (!question) break
      const roll = random()
      game.answer(question.tag, roll < 0.42 ? 'yes' : roll < 0.84 ? 'no' : 'either')
    }

    const best = game.best()
    if (!best || !best.item) {
      silent += 1
      continue
    }

    /*
     * activeBans() is the set actually in force. A rule the catalogue cannot
     * satisfy at all is dropped rather than enforced, which is a stated
     * outcome — so it is not counted as a break here. dietCheck in
     * vite.config is what stops a diet ever getting into that state.
     */
    for (const tag of game.activeBans()) {
      // Above zero, not equal to one: a maybe breaks a standing rule.
      if ((best.item.tags[tag] ?? 0) > 0) broken.push(`${best.item.name} (${tag}, seed ${g})`)
    }
  }

  check(
    `${diet.label} is never served something it rules out`,
    broken.length === 0,
    broken.slice(0, 4).join('; '),
  )
  check(`${diet.label} always gets an answer`, silent === 0, `${silent}/${GAMES} games ended with nothing`)
}

// The specific dishes that were wrong, named, so a regression says which.
const by = (name) => Data.ITEMS.find((item) => item.name === name)
for (const [name, tag] of [
  ['Khao soi', 'meat'],
  ['Congee', 'meat'],
  ['Caesar salad', 'seafood'],
  ['Mapo tofu', 'meat'],
  ['Miso soup', 'seafood'],
]) {
  const item = by(name)
  check(`${name} is not offered to a vegetarian`, !!item && (item.tags[tag] ?? 0) > 0, `${tag} is ${item?.tags[tag] ?? 'absent'}`)
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
