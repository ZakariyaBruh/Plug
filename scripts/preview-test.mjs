/*
 * THE PREVIEW MUST NOT BE ABLE TO SPEND MONEY.
 *
 * Every new profile gets the Premium features for its first five decisions.
 * Most of those cost nothing to run — they are flags on a profile in the
 * visitor's own browser. Three of them are not: a model call for "something
 * new", a places lookup for "nearby", a model call for cooking from your
 * cupboard. Those stay behind a real subscription.
 *
 * The split lives in two lists in app.js, and the danger is not that somebody
 * puts a feature in the wrong one — it is that somebody adds a feature and
 * puts it in neither, at which point the allow-list quietly excludes it and
 * a paying feature looks broken, or worse, somebody "fixes" that by widening
 * the check.
 *
 * So: every premium('...') string in the app has to appear in exactly one of
 * the two lists. The build fails by name otherwise, which is the only way a
 * rule about money survives contact with a year of feature work.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = readFileSync(join(root, 'public/decide/js/app.js'), 'utf8')

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

function listNamed(name) {
  const at = app.indexOf(`var ${name} = [`)
  if (at === -1) return null
  const end = app.indexOf('];', at)
  return [...app.slice(at, end).matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1])
}

const covers = listNamed('PREVIEW_COVERS')
const money = listNamed('PREVIEW_MONEY')

check('PREVIEW_COVERS exists', !!covers)
check('PREVIEW_MONEY exists', !!money)
if (!covers || !money) process.exit(1)

// Every gated feature in the app, as the call site spells it.
const gated = [...new Set([...app.matchAll(/premium\('((?:[^'\\]|\\.)*)'\)/g)].map((m) => m[1]))]
  // The one inside this file's own comment about itself.
  .filter((s) => s !== '...')

check('found the gated features', gated.length > 10, `only ${gated.length}`)

const unclassified = gated.filter((g) => !covers.includes(g) && !money.includes(g))
check(
  'every gated feature is in exactly one list',
  unclassified.length === 0,
  unclassified.length
    ? `in neither list: ${unclassified.map((u) => `"${u}"`).join(', ')}\n        ` +
      `Add each to PREVIEW_COVERS (costs nothing to run) or PREVIEW_MONEY (an API call per use) in public/decide/js/app.js.`
    : '',
)

const both = gated.filter((g) => covers.includes(g) && money.includes(g))
check('nothing is in both lists', both.length === 0, both.join(', '))

// A name in a list that no longer exists in the app is a list going stale.
const orphans = [...covers, ...money].filter((c) => !gated.includes(c))
check('no list entry names a feature that is gone', orphans.length === 0, orphans.map((o) => `"${o}"`).join(', '))

/*
 * The two that cost money must never be in the covered list, by name, even if
 * somebody rewrites the lists. Both are Gemini calls, one per use.
 *
 * It was three. "Finding somewhere nearby" was in here on the assumption that
 * a places lookup is metered; it asks OpenStreetMap and Photon and costs
 * nothing, so it is checked from the other side now. The rule is what is
 * pinned — a feature is out only if using it bills us — and this is the one
 * place to change if that stops being true of one of them.
 */
for (const paid of ['Something new', 'Cooking from your cupboard']) {
  check(`"${paid}" stays outside the preview`, !covers.includes(paid))
}
check('"Finding somewhere nearby" is inside it — it costs nothing per use', covers.includes('Finding somewhere nearby'))

// The preview must read the paid check, not the combined one, before spending.
check(
  'premium() asks isPaid() first',
  /function premium\(what\) \{\s*\n\s*if \(isPaid\(\)\) return true/.test(app),
  'premium() must short-circuit on a real subscription before consulting the preview',
)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
