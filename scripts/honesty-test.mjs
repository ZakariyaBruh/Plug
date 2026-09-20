/*
 * The published promises and the repository's own notes have to agree.
 *
 * /honesty tells the reader four things this product will never do, in
 * wording specific enough that doing one of them makes the page false.
 * docs/persuasion.md tells whoever is editing the code the same four, with
 * the reasoning. Two copies of a promise is two copies that can drift, and
 * the drift that actually happens is not a typo — it is somebody quietly
 * dropping one of the four from the developer-facing file on the way to
 * shipping it.
 *
 * So: every refusal named on the page must still be named in the doc. It is
 * a crude check and it catches the case that matters.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const doc = readFileSync(join(root, 'docs/persuasion.md'), 'utf8').toLowerCase()
const src = readFileSync(join(root, 'src/lib/honesty.ts'), 'utf8')

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

/*
 * The four, as the phrase each is known by in the doc. Not the page's own
 * headings: those are written for a reader who has never met the ideas, and
 * the doc names them by their technical names.
 */
const REFUSALS = [
  ['fabricated social proof', /fabricated social proof/],
  ['fake scarcity', /fake scarcity/],
  ['variable-ratio reward', /variable-ratio reward/],
  ['streak-loss guilt', /streak-loss guilt/],
]

for (const [name, pattern] of REFUSALS) {
  check(`docs/persuasion.md still refuses ${name}`, pattern.test(doc))
}

// And the page still lists four of them, so a deletion is caught from the
// other side too.
const count = (src.match(/^\s{2}\{\s*$/gm) || []).length
const refusalBlock = src.slice(src.indexOf('export const REFUSALS'))
const named = (refusalBlock.match(/name: '/g) || []).length
check('the honesty page still lists four refusals', named === 4, `found ${named}`)
check('honesty.ts parsed as expected', count > 0)

// Every technique must say what it does HERE, not just what the effect is:
// a list of psychology with no claims attached is not a disclosure.
const techniques = src.slice(src.indexOf('export const TECHNIQUES'), src.indexOf('export type Refusal'))
const names = (techniques.match(/name: '/g) || []).length
const heres = (techniques.match(/here:/g) || []).length
check('every technique says what it does here', names > 0 && names === heres, `${names} names, ${heres} claims`)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
