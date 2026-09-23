/*
 * Five decisions in a real browser, played the way a free profile plays them.
 *
 *   bun run build && bun run drive
 *
 * WHY THIS IS NOT IN `bun run test`. It needs a build on disk, a server and a
 * Chromium, so it is a driver you run rather than a gate that runs itself.
 * The unit tests read the source; this one asks whether the thing works when
 * somebody actually plays it, and that is a different question. It has caught
 * two bugs no unit test could see:
 *
 *  - a tier check that unlocked a button in the app and was then refused by
 *    the ceiling behind it in the profile, so "Save it" opened and then said
 *    the saved list was full over an empty list;
 *  - a screen quoting a constant that was zero, telling people their list
 *    would "stop growing past 0".
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

// A free profile arrives with the Premium modes marked as Premium. They are
// visible and pressable on purpose — that is how anybody learns they exist.
const locked = await page.locator('#duel-btn.is-locked, #knockout-btn.is-locked, #swipe-btn.is-locked').count()
ok('the Premium modes are marked as locked', locked === 3, `${locked} of 3`)

let askedToPay = false
async function oneDecision(trySaving) {
  /*
   * Back to the front screen between decisions, the way somebody opening the
   * app again gets there. Accepting leaves you on the reward panel, and the
   * landing is hidden from that point on — driving five in a row without
   * coming back means clicking a button nobody can see.
   */
  await page.goto(URL_, { waitUntil: 'load' })
  await page.waitForTimeout(900)
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
   * once spent an hour "finding" a save bug that was its own impatience.
   */
  await page.waitForFunction(() => {
    const el = document.getElementById('result-icon')
    return el && el.classList.contains('is-landed')
  }, null, { timeout: 15000 })
  await page.waitForTimeout(300)
  if (trySaving) {
    const fav = page.locator('#fav-btn')
    if (await fav.isVisible()) { await fav.click(); await page.waitForTimeout(500) }
    const card = await page.evaluate(() => {
      const sheet = document.getElementById('ad-sheet')
      const title = document.getElementById('ad-title')
      return { open: !!(sheet && sheet.open), title: title ? title.textContent : '' }
    })
    askedToPay = card.open
    ok('saving a dish asks for a subscription', card.open, JSON.stringify(card))
    ok('and the card names the thing that was tapped', /Saving a dish/.test(card.title || ''), card.title)
    const s2 = await state()
    ok('and nothing was saved behind the card', (s2.favourites || []).length === 0)
    await page.evaluate(() => { const b = document.getElementById('ad-close'); if (b) b.click() })
    await page.waitForTimeout(400)
  }
  await accept.click()
  await page.waitForTimeout(700)
  return true
}

for (let n = 1; n <= 5; n++) {
  ok(`decision ${n} reaches an answer and is accepted`, await oneDecision(n === 2))
  const st = await state()
  ok(`the profile counts ${n} decision${n === 1 ? '' : 's'}`, st.decisions === n, `decisions=${st.decisions}`)
}

ok('the funnel saw the decisions', beacons.filter((b) => b[0] === 'decided').length === 5,
  beacons.map((b) => b[0]).join(' '))
ok('and saw the upsell', askedToPay && beacons.some((b) => b[0] === 'premium_seen'),
  beacons.map((b) => b[0]).join(' '))

// Five decisions in, the one-tap survey is due on the reward screen.
ok('the why survey appears once it is earned', await page.locator('#why-strip').isVisible())

/*
 * A per-use feature stays behind the subscription, and says so. A separate
 * context because the played profile above shares this origin and writes
 * itself back over a cleared key.
 */
await page.close()
const ctx2 = await browser.newContext({ viewport: { width: 420, height: 900 } })
const fresh = await ctx2.newPage()
await fresh.goto(URL_, { waitUntil: 'load' })
await fresh.waitForTimeout(1400)
await pastWelcome(fresh)
await fresh.waitForTimeout(500)
await fresh.evaluate(() => { const b = document.getElementById('landing-start'); if (b) b.click() })
await fresh.waitForTimeout(400)
const card = await fresh.evaluate(() => {
  const el = document.getElementById('pantry-toggle')
  if (el) el.click()
  const sheet = document.getElementById('ad-sheet')
  const title = document.getElementById('ad-title')
  return { open: !!(sheet && sheet.open), title: title ? title.textContent : '' }
})
ok('cooking from your cupboard asks for a subscription', card.open, JSON.stringify(card))
ok('and names it', /Cooking from your cupboard/.test(card.title || ''), card.title)

console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILED'}`)
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
