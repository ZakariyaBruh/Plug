/*
 * The homepage and reward-screen hooks, and the privacy promise they touch.
 *
 *  - Every event the site or the game sends is counted, and the count must be
 *    the number the privacy page says out loud. A new beacon without a new
 *    sentence fails here, not in a complaint.
 *  - "That's the one" on the homepage links to /decide/?dish=<name>. A
 *    preview dish that is not in the real catalogue would open nothing, so
 *    every preview dish must be one the game can find.
 *  - The deep links the homepage uses are ones the game actually handles.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')
const app = read('public/decide/js/app.js')
const privacy = read('src/routes/privacy.tsx')
const index = read('src/routes/index.tsx')
const preview = read('src/components/GamePreview.tsx')

let failed = 0
const check = (ok, name) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name)
  if (!ok) failed++
}

const names = new Set()
for (const f of ['app.js', 'progress.js', 'engine.js']) {
  for (const m of read('public/decide/js/' + f).matchAll(/beacon\('([a-z_]+)'/g)) names.add(m[1])
}
const walk = (dir) => readdirSync(join(root, dir)).flatMap((n) => {
  const p = dir + '/' + n
  return statSync(join(root, p)).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : []
})
for (const f of walk('src')) {
  for (const m of read(f).matchAll(/\btrack\('([a-z_]+)'/g)) names.add(m[1])
}
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const said = /lede: '(\w+) events, listed by name/i.exec(privacy)?.[1]?.toLowerCase()
check(said === words[names.size], `privacy says ${said} events and the code sends ${names.size}: ${[...names].sort().join(', ')}`)
check(/(\w+) in total, and every one goes to both places/.exec(privacy)?.[1]?.toLowerCase() === words[names.size],
  'the analytics paragraph gives the same total')

const catalogue = new Set(
  // Catalogue size is checked elsewhere; this only needs the names.
  [...read('public/decide/js/data.js').matchAll(/item\('((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'").toLowerCase()),
)
const previewNames = [...read('src/lib/preview.ts').matchAll(/name: '((?:[^'\\]|\\.)*)', icon/g)].map((m) => m[1])
check(previewNames.length >= 20, `the preview has its dishes (${previewNames.length})`)
const missing = previewNames.filter((n) => !catalogue.has(n.toLowerCase()))
check(missing.length === 0, 'every preview dish opens a real catalogue dish' + (missing.length ? ': missing ' + missing.join(', ') : ''))

check(/\/decide\/\?dish=\$\{encodeURIComponent\(verdict\.dish\.name\)\}/.test(preview), "that's the one links to the dish it just showed")
check(/searchParams\.get\('dish'\)/.test(app), 'the game opens ?dish=')
check(/href="\/decide\/\?go=tonight"/.test(index) && /go === 'tonight'\) showTonight\(\)/.test(app), 'the homepage skip lands on tonight’s pick')
check(/deepLinked && !progress\.state\.onboarded|!deepLinked && !progress\.state\.onboarded/.test(app), 'a deep link is not interrupted by the walkthrough')
check(/id="next-strip"/.test(read('public/decide/index.html')) && /paintNext\(\);/.test(app), 'the reward screen says what else is free')

if (failed) {
  console.error(failed + ' failed')
  process.exit(1)
}
