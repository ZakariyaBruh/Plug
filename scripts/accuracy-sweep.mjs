/*
 * How many questions is enough? Measured, not argued.
 *
 *   node scripts/accuracy-sweep.mjs
 *
 * accuracy-test.mjs asks whether a PERFECT answerer is found. Real people are
 * not perfect, so this plays all of the catalogue many times with an answerer
 * who gets a share of replies wrong (mistaps, or a dish pictured differently
 * from how it is tagged) and says "either" now and then, for a spread of
 * stopping rules, and prints how often the intended dish comes first, how often
 * it is in the six on screen, and how many questions it cost.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const JS = join(process.cwd(), 'public', 'decide', 'js')
const loaded = new Map()
function load(file) {
  if (loaded.has(file)) return loaded.get(file)
  const shim = { exports: {} }
  new Function('module', 'exports', 'require', readFileSync(join(JS, file), 'utf8'))(shim, shim.exports, (s) => load(s.replace(/^\.\//, '')))
  loaded.set(file, shim.exports)
  return shim.exports
}
const Data = load('data.js')
const Engine = load('engine.js')

function rng(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296 } }

function play(target, rule, noise, seed) {
  const rand = rng(seed)
  const game = new Engine.Game({ random: rng(seed + 1), ...rule })
  while (!game.shouldGuess()) {
    const next = game.nextQuestion()
    if (!next) break
    const tag = next.question.tag
    const where = game.axis(target, tag)
    let reply = where > 0.5 ? 'yes' : where < 0.5 ? 'no' : next.question.neither ? 'neither' : 'either'
    if (rand() < noise && reply !== 'either') reply = reply === 'yes' ? 'no' : 'yes'
    game.answer(tag, reply)
  }
  const ranked = game.ranking()
  return { asked: game.answers.length, at: ranked.findIndex((r) => r.item.name === target.name) }
}

const RULES = [
  ['ships: tol after 6, late 7', {}],
  ['tol after 4, late 5', { tolerantAfter: 4, lateAfter: 5 }],
  ['tol after 5, late 6', { tolerantAfter: 5, lateAfter: 6 }],
  ['tol after 6, late 5', { tolerantAfter: 6, lateAfter: 5 }],
  ['tol after 6, late 7, slack 3', { slack: 3 }],
  ['tol after 6, min 9', { minQuestions: 9 }],
]
const ROUNDS = Number(process.argv[2] || 1)
const STEP = Number(process.argv[3] || 4)
console.log('rule'.padEnd(26), 'noise', 'first%', 'top6%', 'questions')
for (const noise of (process.argv[4] ? process.argv[4].split(',').map(Number) : [0, 0.08, 0.15])) {
  for (const [name, rule] of RULES) {
    let first = 0, six = 0, asked = 0, n = 0
    for (let r = 0; r < ROUNDS; r++) for (const [i, item] of Data.ITEMS.entries()) {
      if (i % STEP) continue
      const out = play(item, rule, noise, 1000 * r + i)
      n += 1; asked += out.asked
      if (out.at === 0) first += 1
      if (out.at >= 0 && out.at < 6) six += 1
    }
    console.log(name.padEnd(26), String(noise).padEnd(5), (100 * first / n).toFixed(1).padStart(6), (100 * six / n).toFixed(1).padStart(6), (asked / n).toFixed(1).padStart(8))
  }
}
