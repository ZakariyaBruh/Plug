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
check('the decisions threshold is the same in both, and it is zero: ads from the first visit', (siteTs.match(/ADS_AFTER_DECISIONS = (\d+)/) || [])[1] === (configJs.match(/adsAfterDecisions: (\d+)/) || [])[1] && (configJs.match(/adsAfterDecisions: (\d+)/) || [])[1] === '0')
check('nothing in the ads code steps aside for Save-Data', !/saveData|save-data/i.test((adsJs + adSlot).replace(/\/\*[\s\S]*?\*\//g, '')))

// The sandbox is the whole safety argument; the two files that build a frame must not widen it.
for (const [name, src] of [['js/ads.js', adsJs], ['AdSlot.tsx', adSlot]]) {
  const sandbox = ((src.match(/['"`](allow-scripts[^'"`]*)['"`]/) || [])[1]) || ''
  check(`${name} builds its frame from allow-scripts and popups only`,
    sandbox === 'allow-scripts allow-popups allow-popups-to-escape-sandbox', `found: ${sandbox}`)
  check(`${name} never grants same-origin or top navigation`, !/sandbox[^;\n]*(allow-same-origin|allow-top-navigation)/.test(src))
}
check('no Social Bar or Smartlink is implemented anywhere', !/social.?bar|smartlink/i.test(adsJs + adSlot.replace(/\/\*[\s\S]*?\*\//g, '')),
  'they are left out on purpose: built to look like something other than an ad')

const zOf = (sel) => { const m = css.match(new RegExp('(?:^|\\n)' + sel.replace(/[.]/g, '\\.') + ' \\{[^}]*?z-index: (\\d+)')); return m ? Number(m[1]) : null }
// The app's ads are ONE fixed strip, over the page, that never pushes it and never goes away
// for a free visitor. It is started once, told about Premium, and reserves its height in a variable.
check('the game starts the dock once and tells it about Premium', (app.match(/Ads\.start\(\)/g) || []).length === 1 && /Ads\.premiumKnown\(!!status\.hasPremium\)/.test(app))
check('and the in-page slots are there too, on top of the dock (the owner asked for both, for more ads)', /Ads\.mount\(\$\('profile-ad'\)/.test(app) && /Ads\.refresh\(slot, 'end'/.test(app) && /Ads\.mount\(adItem, 'inline'/.test(app) && /id="landing-ad-a"/.test(html) && /id="view-ad"/.test(html) && /id="profile-ad"/.test(html))
check('the dock is fixed, and the page reserves its height instead of moving when it loads', /\.dock \{[^}]*position: fixed/.test(css) && /--anchor-h/.test(adsJs) && /body\.has-dock \{ padding-bottom: var\(--anchor-h\)/.test(css))
check('the dock is gone for a Premium member, in the stylesheet and in the script', /body\.is-premium \.dock \{ display: none/.test(css) && /if \(premium\) \{[^}]*removeDock\(\)/.test(adsJs))
check('the games sit under the dock and over the rest; the welcome and tour sit over it', zOf('.topbar') < zOf('.pg') && zOf('.pg') < zOf('.dock') && zOf('.dock') < zOf('.welcome') && zOf('.welcome') < zOf('.tour'), `pg ${zOf('.pg')} dock ${zOf('.dock')} welcome ${zOf('.welcome')} tour ${zOf('.tour')}`)
check('open games and a decision being played put the dock at the very bottom', /body\.is-playing \.dock, body\.is-games \.dock \{ bottom:/.test(css) && /classList\.add\('is-games'\)/.test(read('js/play.js')) && /classList\.remove\('is-games'\)/.test(read('js/play.js')))
check('the dock shows when the questions are asked and while a game is played: nothing in the game hides it', !/is-playing[^{]*\.dock[^{]*\{[^}]*display: none/.test(css) && !/is-games[^{]*\.dock[^{]*\{[^}]*display: none/.test(css))
const pages = ['faq', 'how-it-works', 'info', 'eat.index', 'index', 'eat.$dish']
for (const f of readdirSyncSafe(join(root, '..', '..', 'src/routes'))) {
  const src = readFileSync(join(root, '..', '..', 'src/routes', f), 'utf8')
  const has = /<AdSlot\b/.test(src)
  const name = f.replace(/\.tsx?$/, '')
  if (pages.includes(name)) check(`/${name} has its one slot, with the viewer's Premium status`, (src.match(/<AdSlot\b/g) || []).length === 1 && /premium=\{viewer\.hasPremium\}/.test(src))
  else if (/\.(tsx)$/.test(f)) check(`${name} carries no ad`, !has, 'ads belong only on the reading pages: never the checkout, premium, account or order pages')
}

// The privacy page and the unit table are driven by the same switch.
const privacy = readFileSync(join(root, '..', '..', 'src/routes/privacy.tsx'), 'utf8')
check('the privacy page’s answer, section and third-party row all read ADS_ON',
  (privacy.match(/ADS_ON/g) || []).length >= 5 && /a: ADS_ON \? 'Yes' : 'No'/.test(privacy))

// Consent. Ads wait for it where it is required, and ads are never called essential.
const consentJs = read('js/consent.js')
const consentBar = readFileSync(join(root, '..', '..', 'src/components/ConsentBar.tsx'), 'utf8')
const consentLib = readFileSync(join(root, '..', '..', 'src/lib/consent.ts'), 'utf8')
const consentClient = readFileSync(join(root, '..', '..', 'src/lib/consent-client.ts'), 'utf8')
check('the app and the site store the choice under the same key', (consentJs.match(/KEY = '([^']+)'/) || [])[1] === (consentClient.match(/CONSENT_KEY = '([^']+)'/) || [])[1])
check('the cookie bar sits under the welcome screen, not over its Next button', zOf('.consent') !== null && zOf('.welcome') !== null && zOf('.consent') < zOf('.welcome'), `consent ${zOf('.consent')}, welcome ${zOf('.welcome')}`)
// The cookie choice changes HOW an ad is loaded, never WHETHER: no way to turn the ads off for free.
const adCode = (adsJs + adSlot).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
check('without consent an ad is loaded without cookies, not withheld', /credentialless/.test(adsJs) && /credentialless/.test(adSlot) && /referrerpolicy', 'origin'/.test(adsJs) && /referrerPolicy="origin"/.test(adSlot) && !/no-referrer/.test(adsJs + adSlot))
check('ads are real pages of this site, not srcdoc, and report back', /ad-frame\?u=/.test(adsJs) && !/srcdoc/i.test(adCode) && /ad-frame\?u=/.test(adSlot) && /house/.test(adsJs))
check('ads.js has no waiting list for consent', !/waiting/.test(adCode.split('function restricted')[1] || ''))
check('AdSlot draws whatever the answer, once it is known', /allowed === null\) \{ setUnits/.test(adSlot) && !/allowed !== true\) \{ setUnits/.test(adSlot))
check('nothing in the ad code reads a setting, Do Not Track, Save-Data or storage', !/localStorage|sessionStorage|doNotTrack|saveData|navigator\.connection|matchMedia/i.test(adCode))
check('no control anywhere offers to hide ads', !/(hide|turn off|disable|block|remove)\s+(the\s+)?ads?\b/i.test(html.replace(/Remove ads with Premium/g, '')) && !/id="[^"]*(hide|no|block)[-_]?ads?[^"]*"/i.test(html))
check('the banner says ads always run, and that saying no keeps them', /always run/.test(consentJs) && /still see ads/.test(consentJs) && /always run/.test(consentBar) && /still see ads/.test(consentBar))
check('and that Whop counts page views whatever is chosen', /Whop[^']*counts page views/.test(consentJs) && /Whop, which hosts this site, counts page views/.test(consentBar))
check('a country that cannot be told is asked, not assumed', /c === 'XX' \|\| c === 'T1'/.test(consentLib) && /settle\(true\)/.test(consentJs))
for (const [name, text] of [['js/consent.js', consentJs], ['ConsentBar', consentBar]]) {
  const body = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<[^>]+>/g, ' ')
  const says = body.split(/[.;]/).filter((x) => /essential/i.test(x) && !/essential only/i.test(x))
  check(`${name}: no sentence puts advertising or analytics under "essential"`,
    says.length > 0 && says.every((x) => !/advertis|adsterra|\bads\b|analytics|clarity/i.test(x)), says.join(' || '))
  check(`${name}: refusing is as easy as accepting (Accept all and Essential only both there)`, /Accept all/.test(text) && /Essential only/.test(text))
}
check('GA4 and replay are added only after consent', /allowed !== true\) return/.test(readFileSync(join(root, '..', '..', 'src/routes/__root.tsx'), 'utf8')) && !/googletagmanager[^`]*<\/script>/.test(readFileSync(join(root, '..', '..', 'src/routes/__root.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').split('Analytics')[0]))

// A shared result names each question in one base-36 character, so there can be at most 36.
// (Dot used to act out each question on a big stage above it; that was taken out, and the
// checks below make sure it stays out.)
const dataJs = read('js/data.js')
const qStart = dataJs.indexOf('var QUESTIONS = ['), qBlock = dataJs.slice(qStart, dataJs.indexOf('\n  ];', qStart))
const qLines = qBlock.split('\n').filter((l) => /^\s*\{[^}]*\btag: '[a-z]+'/.test(l))
check('the questions are found', qLines.length >= 30, `found ${qLines.length}`)
check('a shared result can still name each question in one base-36 character', qLines.length <= 36, `${qLines.length} questions`)
check('there is no acting-out stage above the question', !/DotStage|q-stage/.test(app + html + css))

// The games: loaded on demand, drawn rather than typed, and every sprite they name exists.
const playJs = read('js/play.js')
const spritesJs = read('js/sprites.js')
const spriteNames = new Set([...spritesJs.matchAll(/^\s{4}([a-z]+): function \(g\)/gm)].map((m) => m[1]).concat(['dot']))
check('the games are not loaded by index.html', !/js\/play\.js|js\/sprites\.js/.test(html))
check('app.js fetches them on first use', /script\('js\/sprites\.js'\)/.test(app) && /script\('js\/play\.js'\)/.test(app))
check('the games draw no emoji', !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(playJs), 'a picture belongs in sprites.js, drawn')
check('and no gradients or glow', !/createLinearGradient|createRadialGradient|shadowBlur|shadowColor/.test(playJs))
const named = new Set([...playJs.matchAll(/\b(?:sprite\(g, |sprite\(g2, )'([a-z]+)'/g)].map((m) => m[1]))
;[...playJs.matchAll(/\[\s*'([a-z]+)',\s*-?\d/g)].forEach((m) => named.add(m[1]))
;[...playJs.matchAll(/(?:s|icon): '([a-z]+)'/g)].forEach((m) => named.add(m[1]))
const missing = [...named].filter((n) => !spriteNames.has(n) && !['hit', 'back'].includes(n))
check('every sprite the games name is drawn in sprites.js', missing.length === 0, missing.join(', '))
check('there are ten games on the shelf', (playJs.match(/\bregister\(\{/g) || []).length === 10)

// A new game file has to be listed in every place the build tracks them.
for (const [label, file] of [['vite.config.ts', 'vite.config.ts'], ['routes/decide/$.ts', 'src/routes/decide/$.ts'], ['sw.js', 'public/decide/sw.js']]) {
  for (const js of ['js/ads.js', 'js/consent.js']) check(`${js} is tracked in ${label}`, readFileSync(join(root, '..', '..', file), 'utf8').includes(js))
}
check('index.html loads js/consent.js before js/ads.js', html.indexOf('<script src="js/consent.js">') > 0 && html.indexOf('<script src="js/consent.js">') < html.indexOf('<script src="js/ads.js">'))
check('index.html loads js/ads.js after config.js', html.indexOf('<script src="js/config.js">') > 0 && html.indexOf('<script src="js/ads.js">') > html.indexOf('<script src="js/config.js">'))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
