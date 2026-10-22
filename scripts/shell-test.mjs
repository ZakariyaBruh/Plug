/*
 * THE SHELL HAS TO AGREE WITH ITSELF.
 *
 * The app's chrome is stated three times: in the markup (the sidebar, the tab
 * bar, the landing's cards), in the script (which sections exist, which are
 * routes), and in the stylesheet (which glyph each page carries). Nothing
 * ever failed when one of them was edited without the others, so they drifted:
 * a section reachable from the sidebar and not from the history, a heading
 * three pixels off because one page kept an eyebrow the rest had lost, twenty
 * different corner radii in a file whose own header says "one radius family".
 *
 * This reads all four files and insists they say the same thing. It cannot see
 * a layout — only a browser can, and scripts/nav-drive.mjs is the one that
 * clicks. Treat a pass here as "nothing has been forgotten".
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'decide')
const readdirSyncSafe = (d) => readdirSync(d, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name)
const read = (p) => readFileSync(join(root, p), 'utf8')
const html = read('index.html')
const css = read('styles.css')
const app = read('js/app.js')
const i18n = read('js/i18n.js')

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

/* ------------------------------------------------------------- sections */
const railBlock = html.slice(html.indexOf('<nav class="rail"'), html.indexOf('</nav>', html.indexOf('<nav class="rail"')))
const tabBlock = html.slice(html.indexOf('<nav class="tabbar"'), html.indexOf('</nav>', html.indexOf('<nav class="tabbar"')))
const railViews = [...railBlock.matchAll(/class="rail-link[^"]*"[^>]*data-view="([a-z]+)"/g)].map((m) => m[1])
const tabViews = [...tabBlock.matchAll(/class="tab-link"[^>]*data-view="([a-z]+)"/g)].map((m) => m[1])

check('the sidebar lists thirteen sections', railViews.length === 13, `found ${railViews.length}: ${railViews.join(', ')}`)
check('no section is listed twice', new Set(railViews).size === railViews.length, railViews.join(', '))

for (const v of railViews) {
  check(`sidebar section "${v}" has a page`, html.includes(`id="view-${v}"`), `add <section class="view" id="view-${v}">`)
}
for (const v of tabViews) {
  check(`tab bar section "${v}" is also in the sidebar sheet`, railViews.includes(v),
    'the sheet behind More has to hold everything, or a section disappears on a phone')
}
check('the tab bar has More as its last stop', /id="tab-more"/.test(tabBlock) && tabBlock.lastIndexOf('tab-more') > tabBlock.lastIndexOf('data-view="'))

const routes = (app.match(/var ROUTES = \[([^\]]+)\]/) || [])[1]
const routeList = routes ? [...routes.matchAll(/'([a-z]+)'/g)].map((m) => m[1]) : []
check('every section is a history route, and no route is a ghost',
  [...routeList].sort().join() === [...railViews].sort().join(),
  `routes: ${routeList.join(', ')}\n        sidebar: ${railViews.join(', ')}`)

/* ---------------------------------------------------------- translations */
const navKeys = [...new Set([...html.matchAll(/data-i18n="(nav\.[a-z]+)"/g)].map((m) => m[1]))]
const blocks = {}
const langStarts = ['ms', 'th', 'hi', 'ar'].map((lang) => [lang, i18n.search(new RegExp(`^\\s{4}${lang}: \\{`, 'm'))]).sort((a, b) => a[1] - b[1])
langStarts.forEach(([lang, start], i) => {
  // From this language's header to the next one's, so a key in Hindi cannot vouch for Thai.
  blocks[lang] = i18n.slice(start, i + 1 < langStarts.length ? langStarts[i + 1][1] : start + 6000)
})
for (const key of navKeys) {
  for (const [lang, block] of Object.entries(blocks)) {
    check(`${key} is translated into ${lang}`, block.includes(`'${key}':`),
      `add '${key}' to the ${lang} block of STRINGS in js/i18n.js — an untranslated label switches language halfway down the sidebar`)
  }
}

/* ----------------------------------------------------------- page frame */
// The title sat at 140px on nine screens and 166px on three, because three
// headings kept an eyebrow the others had lost. Whatever sits above a title in
// a page header must be one of the hidden kickers.
const heads = [...html.matchAll(/<header class="head">([\s\S]*?)<\/header>/g)].map((m) => m[1])
check('there are page headers to check', heads.length >= 8, `found ${heads.length}`)
heads.forEach((head, i) => {
  const title = (head.match(/<h1 class="head-title"[^>]*>([^<]*)/) || [])[1] || `header ${i}`
  const before = head.slice(0, head.indexOf('<h1')).replace(/<!--[\s\S]*?-->/g, '').trim()
  check(`"${title.trim()}" has nothing visible above its title`, before === '' || /^<p class="mechanic kicker"[^>]*>[^<]*<\/p>$/.test(before),
    `found: ${before.slice(0, 90)} — a .kicker is hidden by the stylesheet, anything else moves the title`)
})

// Each section's glyph: defined once, mapped to its page, and used by its link.
for (const v of railViews.filter((v) => v !== 'decide')) {
  check(`"${v}" has a glyph and a page-title rule`, new RegExp(`--i-${v}:\\s*url\\(`).test(css) && new RegExp(`#view-${v}\\s*\\{\\s*--ico:\\s*var\\(--i-${v}\\)`).test(css),
    `define --i-${v} in the Icons block and map #view-${v} to it`)
}
for (const cls of new Set([...html.matchAll(/class="[^"]*\bico i-([a-z]+)\b/g)].map((m) => m[1]))) {
  check(`glyph class i-${cls} exists`, new RegExp(`\\.i-${cls}\\s*\\{\\s*--ico:`).test(css), `add .i-${cls} { --ico: var(--i-${cls}); }`)
}

/* ------------------------------------------------------- the front door */
const cards = [...html.matchAll(/<button class="explore-card"([^>]*)>/g)].map((m) => m[1])
check('the landing has a feature card for each way in', cards.length >= 10, `found ${cards.length}`)
for (const attrs of cards) {
  const id = (attrs.match(/id="([^"]+)"/) || [])[1]
  const view = (attrs.match(/data-landing-view="([a-z]+)"/) || [])[1]
  if (id) check(`card #${id} is wired`, new RegExp(`\\$\\('${id}'\\)\\.addEventListener`).test(app), `app.js never listens to #${id}`)
  else check(`card to "${view}" goes somewhere real`, railViews.includes(view), `${view} is not a section`)
}

/* ------------------------------------------------------------- one shape */
// Every corner is one of four steps, a pill, a circle or a thin bar. A raw
// 12px is how the file got to twenty values; the message says what to use.
const ALLOWED = new Set(['0', '2px', '3px', '4px', '50%', '99px', '999px', 'inherit'])
const radii = []
for (const m of css.matchAll(/(?<![-\w])border-radius:\s*([^;}{]+?)\s*(?:!important)?\s*[;}]/g)) {
  const start = css.lastIndexOf('{', m.index)
  const block = css.slice(start, css.indexOf('}', m.index))
  if (/(?<![-\w])--r\s*:/.test(block)) continue // the game tiles use --r as a row number
  if (/calc\(/.test(m[1])) continue // calc(var(--r) + 2px) is built from the scale
  for (const t of m[1].split(/\s+/)) {
    if (t === '/' || t.startsWith('var(') || t.startsWith('calc(') || ALLOWED.has(t) || /^\d+%$/.test(t) || /^(var\(--r[-a-z]*\))$/.test(t)) continue
    radii.push(`${t}  (…${css.slice(Math.max(0, start - 36), start).replace(/\s+/g, ' ').trim()})`)
  }
}
check('every corner is on the shape scale', radii.length === 0,
  `use var(--r-xs) / var(--r) / var(--r-lg) / var(--r-xl):\n        ${radii.slice(0, 6).join('\n        ')}`)

/* ------------------------------------------------------------- calm */
// Anything that moves at the edge of your vision for as long as you read.
function lastAnimation(selector) {
  // The bare selector at the start of a rule: "body.is-premium .topbar-premium { animation: none }"
  // is a different rule and says nothing about what a free profile sees.
  const all = [...css.matchAll(new RegExp(`^${selector.replace(/[.#]/g, '\\$&')}\\s*\\{[^}]*?animation:\\s*([^;}]+)`, 'gm'))]
  return all.length ? all[all.length - 1][1] : ''
}
for (const sel of ['.topbar-premium', '.peek-cta .go']) {
  const a = lastAnimation(sel)
  check(`${sel} does not loop forever`, a !== '' && !/infinite/.test(a), `animation: ${a}`)
}

/* ------------------------------------------------------------------ ads */
// The privacy page reads one table (src/lib/site.ts) and the game another
// (js/config.js). If they disagree about what is live, the page says "no
// advertising" over a game that is showing some, or the reverse.
const siteTs = readFileSync(join(root, '..', '..', 'src/lib/site.ts'), 'utf8')
const configJs = read('js/config.js')
const adsJs = read('js/ads.js')
const adSlot = readFileSync(join(root, '..', '..', 'src/components/AdSlot.tsx'), 'utf8')
const SIZES = ['leaderboard', 'wide', 'mobile', 'rectangle', 'tower']
const liveInSite = (n) => new RegExp(`${n}: \\{ src: '[^']+', key: '[^']+'`).test(siteTs)
const liveInGame = (n) => new RegExp(`${n}: \\{ src: '[^']+', key: '[^']+'`).test(configJs)
for (const n of SIZES) {
  check(`the ${n} unit is ${liveInSite(n) ? 'live' : 'off'} in both the site and the game`, liveInSite(n) === liveInGame(n),
    `site.ts says ${liveInSite(n) ? 'live' : 'off'}, config.js says ${liveInGame(n) ? 'live' : 'off'}`)
}
for (const [name, key] of [['the 160x600 skyscraper', 'c34df66c2852fa155381e97d401a1a4a'], ['the native unit', 'd3500e59199e09eee4a23799c098b4e5'], ['the Social Bar', '081a53853ee78e59ce72a9333b3d4700']]) {
  check(`${name} stays out of both tables`, !siteTs.includes(key) && !configJs.includes(key))
}
check('the smart link is the same in the site and the game', (siteTs.match(/SMARTLINK_URL = '([^']+)'/) || [])[1] === (configJs.match(/smartlink: '([^']+)'/) || [])[1] && !!(siteTs.match(/SMARTLINK_URL = '([^']+)'/) || [])[1])
check('the decisions threshold is the same in both', (siteTs.match(/ADS_AFTER_DECISIONS = (\d+)/) || [])[1] === (configJs.match(/adsAfterDecisions: (\d+)/) || [])[1])

// The sandbox is the whole safety argument; the two files that build a frame must not widen it.
for (const [name, src] of [['js/ads.js', adsJs], ['AdSlot.tsx', adSlot]]) {
  const sandbox = ((src.match(/['"`](allow-scripts[^'"`]*)['"`]/) || [])[1]) || ''
  check(`${name} builds its frame from allow-scripts and popups only`,
    sandbox === 'allow-scripts allow-popups allow-popups-to-escape-sandbox', `found: ${sandbox}`)
  check(`${name} never grants same-origin or top navigation`, !/sandbox[^;\n]*(allow-same-origin|allow-top-navigation)/.test(src))
}
check('no Social Bar or Smartlink is implemented anywhere', !/social.?bar|smartlink/i.test(adsJs + adSlot.replace(/\/\*[\s\S]*?\*\//g, '')),
  'they are left out on purpose: built to look like something other than an ad')

// Where a slot may be armed. Anything else (a question, a game, the answer, the
// reward) is a moment the persuasion notes say gets care, so it is a failure.
const mounts = [...app.matchAll(/Ads\.mount\(([^,]+),\s*'(\w+)'/g)].map((m) => m[1].trim())
check('the game arms exactly two slots, the dish list and the profile', mounts.length === 2 && mounts.some((m) => m === 'adItem') && mounts.some((m) => m.includes('profile-ad')), mounts.join(' | '))
const pages = ['faq', 'how-it-works', 'info', 'eat.index']
for (const f of readdirSyncSafe(join(root, '..', '..', 'src/routes'))) {
  const src = readFileSync(join(root, '..', '..', 'src/routes', f), 'utf8')
  const has = /<AdSlot\b/.test(src)
  const name = f.replace(/\.tsx?$/, '')
  if (pages.includes(name)) check(`/${name} has its one slot, with the viewer's Premium status`, (src.match(/<AdSlot\b/g) || []).length === 1 && /premium=\{viewer\.hasPremium\}/.test(src))
  else if (/\.(tsx)$/.test(f)) check(`${name} carries no ad`, !has, 'ads belong only on the four reading pages')
}

// The privacy page and the unit table are driven by the same switch.
const privacy = readFileSync(join(root, '..', '..', 'src/routes/privacy.tsx'), 'utf8')
check('the privacy page’s answer, section and third-party row all read ADS_ON',
  (privacy.match(/ADS_ON/g) || []).length >= 5 && /a: ADS_ON \? 'Yes' : 'No'/.test(privacy))

// A new game file has to be listed in every place the build tracks them.
for (const [label, file] of [['vite.config.ts', 'vite.config.ts'], ['routes/decide/$.ts', 'src/routes/decide/$.ts'], ['sw.js', 'public/decide/sw.js']]) {
  check(`js/ads.js is tracked in ${label}`, readFileSync(join(root, '..', '..', file), 'utf8').includes('js/ads.js'))
}
check('index.html loads js/ads.js after config.js', html.indexOf('<script src="js/config.js">') > 0 && html.indexOf('<script src="js/ads.js">') > html.indexOf('<script src="js/config.js">'))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
