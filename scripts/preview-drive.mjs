/*
 * The reverse trial, driven in a real browser from the first screen to the
 * last of the five.
 *
 *   bun run build && node scripts/preview-drive.mjs
 *
 * WHY THIS IS NOT IN `bun run test`. It needs a build on disk, a server and a
 * Chromium, so it is a driver you run rather than a gate that runs itself.
 * scripts/preview-test.mjs is the gate: it reads the source and enforces the
 * money split. This one answers the other question — whether the thing works
 * when somebody actually plays it — and it has already earned its keep twice:
 *
 *  - saveLimit() asked isPlus() rather than unlocked(), so the app unlocked
 *    "Save it" during the preview and the profile then refused it with "your
 *    saved list is full" over an empty list.
 *  - the ending screen quoted FREE_SAVES, which is 0, and told people their
 *    saved list would "stop growing past 0".
 *
 * Neither is visible in the source and neither would fail a unit test.
 *
 * IT SERVES dist/client, not the dev server. The page Cloudflare answers with
 * is the stamped copy vite writes to dist/client/decide/index.html — see the
 * comment on stampServiceWorker in vite.config.ts — so that is the only copy
 * worth driving.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', 'dist', 'client')
const KEY = 'whatShouldIEat.v1'
const PORT = 8791

if (!existsSync(join(ROOT, 'decide', 'index.html'))) {
  console.error('No build to drive. Run `bun run build` first.')
  process.exit(1)
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
}

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('not found') }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
})
await new Promise((ok) => server.listen(PORT, '127.0.0.1', ok))

const URL_ = `http://127.0.0.1:${PORT}/decide/index.html`
let fails = 0
const ok = (name, cond, detail) => {
  cond ? null : (fails += 1)
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : `\n        ${detail}`}`)
}

/*
 * Playwright is not a dependency of this project — it is on the machine, and
 * imported by path so installing it is never a condition of `bun run build`.
 */
const pw = await import('/opt/node22/lib/node_modules/playwright/index.js').catch(() => null)
if (!pw) {
  console.error('Playwright is not available on this machine; nothing driven.')
  server.close()
  process.exit(0)
}
const { chromium } = pw.default || pw

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } })
const page = await ctx.newPage()
let beacons = []
await page.exposeFunction('__beacon', (n, d) => { beacons.push([n, d]) })
await page.addInitScript(() => {
  // Stand in for whop.track so the funnel can be read back without a network.
  window.whop = { track: (n, d) => { try { window.__beacon(n, d) } catch (e) {} } }
})
page.on('pageerror', (e) => { console.log('PAGEERROR ' + e.message); fails += 1 })

const state = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY)

// The four-step first run stands in front of the landing screen on a fresh
// profile, which is correct for a person and in the way of a driver.
async function pastWelcome(pg) {
  for (let i = 0; i < 10; i++) {
    if (!(await pg.locator('#welcome').isVisible())) return true
    const skip = pg.locator('#welcome-skip')
    const next = pg.locator('#welcome-next')
    if (await skip.isVisible()) await skip.click({ force: true })
    else if (await next.isVisible()) await next.click({ force: true })
    else return false
    await pg.waitForTimeout(400)
  }
  return !(await pg.locator('#welcome').isVisible())
}

await page.goto(URL_, { waitUntil: 'load' })
await page.waitForTimeout(1400)
ok('the first run can be got past', await pastWelcome(page))
await page.waitForTimeout(600)

const banner = page.locator('#landing-preview')
ok('the landing says the preview is on', await banner.isVisible())
let bt = (await banner.textContent()) || ''
ok('it names five decisions', /first 5 decisions/.test(bt), bt.slice(0, 140))
ok('it says no card', /No card/.test(bt))
ok('preview_started fired', beacons.some((b) => b[0] === 'preview_started'))
let st = await state()
ok('the profile holds five', st.preview && st.preview.left === 5, JSON.stringify(st.preview))
const locked = await page.locator('#duel-btn.is-locked, #knockout-btn.is-locked, #swipe-btn.is-locked, #mood-wrap.is-locked').count()
ok('nothing local is locked during it', locked === 0, `${locked} still locked`)

let saveOnVerdict = false
async function oneDecision() {
  await page.locator('#landing-start').click()
  await page.waitForTimeout(400)
  for (let i = 0; i < 30; i++) {
    if (await page.locator('#accept-btn').isVisible()) break
    const yes = page.locator('#choice-yes')
    if (await yes.isVisible()) { await yes.click(); await page.waitForTimeout(160); continue }
    break
  }
  const accept = page.locator('#accept-btn')
  if (!(await accept.isVisible())) return false
  /*
   * The verdict panel is up before the reel has landed, and the dish it is
   * about does not exist until it has: is-landed comes off at the start of
   * every reveal and goes back on when it stops. Clicking anything on the
   * panel before then acts on nothing, silently — which is how this driver
   * spent an hour "finding" a save bug that was its own impatience.
   */
  await page.waitForFunction(() => {
    const el = document.getElementById('result-icon')
    return el && el.classList.contains('is-landed')
  }, null, { timeout: 15000 })
  await page.waitForTimeout(300)
  if (saveOnVerdict) {
    saveOnVerdict = false
    const fav = page.locator('#fav-btn')
    if (await fav.isVisible()) { await fav.click(); await page.waitForTimeout(400) }
    const s = await state()
    ok('a dish can be saved during the preview', (s.favourites || []).length === 1,
      'favourites=' + JSON.stringify(s.favourites || []))
  }
  await accept.click()
  await page.waitForTimeout(700)
  return true
}

for (let n = 1; n <= 5; n++) {
  if (n === 2) saveOnVerdict = true   // so the ending has something real to count
  ok(`decision ${n} reaches an answer and is accepted`, await oneDecision())
  st = await state()
  const left = st.preview ? st.preview.left : null
  ok(`${5 - n} left after decision ${n}`, left === 5 - n, `left=${left}`)

  const over = page.locator('#preview-over')
  const shown = await over.isVisible()
  if (n < 5) {
    ok(`the ending stays away on decision ${n}`, !shown)
    await page.goto(URL_, { waitUntil: 'load' })
    await page.waitForTimeout(900)
    bt = (await page.locator('#landing-preview').textContent()) || ''
    const want = 5 - n
    ok(`the banner counts down to ${want}`,
      want === 1 ? /one more decision/.test(bt) : new RegExp('first ' + want + ' decisions').test(bt),
      bt.slice(0, 120))
  } else {
    ok('the ending shows on the fifth', shown)
    const text = (await over.textContent()) || ''
    ok('it says that was the last of the five', /last of your five/.test(text), text.slice(0, 90))
    ok('it counts the decisions', /5\s*decisions made/.test(text), text.slice(0, 400))
    ok('it counts the saved dish', /1\s*dish saved/.test(text), text.slice(0, 400))
    ok('it says the saved one is kept', /the dish you saved stays, but you cannot add another/.test(text), text.slice(0, 500))
    ok('it names what stops', /cook mode and the shopping list/.test(text))
    ok('preview_ended fired', beacons.some((b) => b[0] === 'preview_ended'))
    const pe = beacons.find((b) => b[0] === 'preview_ended')
    ok('preview_ended carries the counts', pe && pe[1].decisions === 5 && pe[1].saved === 1, JSON.stringify(pe && pe[1]))
    ok('the keep-it link goes to /premium', (await page.locator('#preview-over-go').getAttribute('href')) === '/premium')
  }
}

st = await state()
ok('the ending is marked seen as soon as it is shown', st.preview && st.preview.seen === true, JSON.stringify(st.preview))

await page.goto(URL_, { waitUntil: 'load' })
await page.waitForTimeout(900)
ok('the banner is gone afterwards', !(await page.locator('#landing-preview').isVisible()))
ok('the locks come back', (await page.locator('#duel-btn.is-locked').count()) === 1)
beacons = []
await oneDecision()
ok('the ending never shows twice', !(await page.locator('#preview-over').isVisible()))
ok('and does not fire its beacon twice', !beacons.some((b) => b[0] === 'preview_ended'))

/*
 * A separate context, because the played profile above shares this origin and
 * writes itself back over a cleared key — which looked exactly like "a fresh
 * profile gets no preview" for one confusing run.
 */
await page.close()
const ctx2 = await browser.newContext({ viewport: { width: 420, height: 900 } })
const fresh = await ctx2.newPage()
await fresh.goto(URL_, { waitUntil: 'load' })
await fresh.waitForTimeout(1400)
await pastWelcome(fresh)
await fresh.waitForTimeout(500)
const s3 = await fresh.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY)
ok('a fresh profile gets its own preview', !!s3.preview && s3.preview.left === 5, JSON.stringify(s3.preview))
await fresh.evaluate(() => { const b = document.getElementById('landing-start'); if (b) b.click() })
await fresh.waitForTimeout(400)
const card = await fresh.evaluate(() => {
  const el = document.getElementById('pantry-toggle')
  if (el) el.click()
  const sheet = document.getElementById('ad-sheet')
  const title = document.getElementById('ad-title')
  return { open: !!(sheet && sheet.open), title: title ? title.textContent : '' }
})
ok('a per-use feature still asks for a subscription', card.open, JSON.stringify(card))
ok('and the card says why it is the exception', /cannot lend you/.test(card.title || ''), card.title)

console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILED'}`)
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
