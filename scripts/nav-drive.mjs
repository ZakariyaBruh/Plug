/*
 * Moving around the app in a real browser: the sidebar, the phone's tab bar and
 * its sheet, the back button, and a keyboard.
 *
 *   bun run navdrive
 *
 * WHY THIS IS NOT IN `bun run test`. It needs a Chromium, and it asks a
 * different question from scripts/shell-test.mjs. That one reads the files and
 * insists they agree; this one clicks. It exists because of what reading cannot
 * see — and every item below was a real failure first:
 *
 *  - the sidebar was position:fixed with nothing to scroll it, so on a short
 *    window or at the larger text size the last links were below the fold and
 *    could not be reached at all;
 *  - thirteen sections swapped in place and the address never changed, so back
 *    left the app and reload dropped you on the front door;
 *  - a function called `replay` was added next to an older one with the same
 *    name, the later declaration won, and every back button threw. A source
 *    test passed; clicking Back did not;
 *  - on a phone, something passing the edge for a moment (the card that slides
 *    in) made the browser widen the page to 395-413px on a 390px screen, and it
 *    stayed wide.
 *
 * IT SERVES public/, not a build: the app is plain static files, so there is
 * nothing to build and nothing to go stale. Playwright is not a dependency of
 * this project; it is on the machine and imported by path, as in play-drive.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', 'public')
const PORT = 8792

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
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
const APP = `http://127.0.0.1:${PORT}/decide/`

let pass = 0
let fails = 0
const ok = (name, cond, detail) => {
  cond ? (pass += 1) : (fails += 1)
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : `\n        ${detail}`}`)
}

const pw = await import('/opt/node22/lib/node_modules/playwright/index.js').catch(() => null)
if (!pw) {
  console.error('Playwright is not available on this machine; nothing driven.')
  server.close()
  process.exit(0)
}
const { chromium } = pw.default || pw
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

/*
 * Reduced motion on purpose: it turns the view transitions off, which makes a
 * click and its result happen in the same frame instead of racing one. The
 * transitions themselves are looked at with eyes, not asserts.
 */
async function open(width, height, { xl = false, hash = '', motion = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height }, reducedMotion: motion ? 'no-preference' : 'reduce', hasTouch: width < 700, isMobile: width < 700,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGEERROR ' + e.message) })
  // The app's /api calls have nothing to talk to here; an empty answer is enough.
  await page.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  // The cookie notice is its own test (ads-drive); here it would only sit over the buttons.
  await page.addInitScript(() => { if (window.top === window) localStorage.setItem('m45-consent', 'essential') })
  if (xl) await page.addInitScript(() => localStorage.setItem('m45-text', 'xl'))
  await page.goto(APP + hash, { waitUntil: 'load' })
  await page.waitForTimeout(700)
  for (let i = 0; i < 6 && (await page.locator('#welcome').isVisible()); i++) {
    const next = page.locator('#welcome-next')
    if (await next.isVisible()) await next.click({ force: true })
    await page.waitForTimeout(350)
  }
  await page.waitForTimeout(500)
  page.errors = errors
  return page
}

// A section that throws is a failure to report, and the others still run.
async function section(name, fn) {
  // ONLY=history node scripts/nav-drive.mjs runs the sections whose name contains it.
  if (process.env.ONLY && !name.includes(process.env.ONLY)) return
  try { await fn() } catch (e) { ok(`${name}: ran to the end`, false, String(e.message).split("\n").slice(0,12).join(" | ")) }
}

const snap = (page) => page.evaluate(() => ({
  hash: location.hash,
  title: document.title,
  view: document.querySelector('.view.is-current')?.id,
  landing: !document.getElementById('landing').hidden,
  entries: history.length,
}))
const active = (page) => page.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.dataset.view || a.className) : null })
const settle = (page) => page.waitForTimeout(250)

/* ----------------------------------------------------------- the sidebar */
await section('the sidebar', async () => {
  const page = await open(1280, 800)
  ok('desktop: the tab bar is not drawn', await page.evaluate(() => getComputedStyle(document.getElementById('tabbar')).display === 'none'))
  ok('desktop: the sidebar is in groups', (await page.locator('.rail-group').count()) === 4)

  // Every link has to be reachable at any height and any text size. This is the
  // one that was broken: below ~700px tall the last links simply were not there.
  await page.context().close()
  for (const [w, h, xl] of [[1366, 650, false], [1280, 560, false], [1366, 650, true]]) {
    const p = await open(w, h, { xl })
    const r = await p.evaluate(() => {
      const box = document.querySelector('.rail-scroll')
      const out = []
      for (const link of document.querySelectorAll('.rail-link')) {
        link.scrollIntoView({ block: 'nearest' })
        const b = link.getBoundingClientRect()
        out.push(b.top >= 0 && b.bottom <= innerHeight + 1)
      }
      return { all: out.every(Boolean), scrolls: box.scrollHeight > box.clientHeight, overflowY: getComputedStyle(box).overflowY }
    })
    ok(`desktop ${w}x${h}${xl ? ' at the largest text' : ''}: every one of thirteen links can be brought into view`, r.all, JSON.stringify(r))
    ok(`desktop ${w}x${h}${xl ? ' at the largest text' : ''}: the column scrolls inside itself`, r.overflowY === 'auto' || r.overflowY === 'scroll', JSON.stringify(r))
    await p.context().close()
  }
})

/* ----------------------------------------------------------- the history */
await section('the history', async () => {
  const page = await open(1280, 800)
  const click = (v) => page.click(`.rail-link[data-view="${v}"]`)
  let s = await snap(page)
  const entries0 = s.entries
  ok('starts on the front door at the bare address', s.landing && s.hash === '', JSON.stringify(s))

  await click('dishes'); await settle(page); s = await snap(page)
  ok('a section writes #/section and names the tab', s.hash === '#/dishes' && s.title === 'Dishes · morsels45', JSON.stringify(s))
  await click('planner'); await settle(page)
  await click('help'); await settle(page)
  ok('three moves wrote three entries, not more', (await snap(page)).entries === entries0 + 3, `${(await snap(page)).entries} vs ${entries0}`)

  await page.goBack(); await settle(page); s = await snap(page)
  ok('back goes to the section before', s.view === 'view-planner' && s.hash === '#/planner', JSON.stringify(s))
  await page.goBack(); await page.goBack(); await settle(page); s = await snap(page)
  ok('and back again to the front door', s.landing && s.hash === '' && /what should you eat/.test(s.title), JSON.stringify(s))
  const before = s.entries
  await page.goForward(); await settle(page); s = await snap(page)
  ok('forward replays it, and writes nothing', s.view === 'view-dishes' && s.entries === before, JSON.stringify(s))
  await click('dishes'); await settle(page)
  ok('choosing the section you are on adds no entry', (await snap(page)).entries === before)

  await click('news'); await settle(page)
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(900); s = await snap(page)
  ok('reload keeps the section', s.view === 'view-news' && !s.landing, JSON.stringify(s))
  ok('and starts a keyboard at its heading, so Tab is the page', await page.evaluate(() => document.activeElement.classList.contains('head-title')), await active(page))

  for (const r of ['nearby', 'menu', 'chat', 'radio', 'daily', 'profile']) {
    await page.goto(`${APP}#/${r}`); await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800); s = await snap(page)
    ok(`a link to #/${r} opens it`, s.view === 'view-' + r && !s.landing, JSON.stringify(s))
  }
  await page.goto(`${APP}?go=kitchen`); await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800)
  ok('an old ?go= link still works, and is tidied to a hash', await page.evaluate(() => document.querySelector('.view.is-current').id === 'view-kitchen' && location.search === '' && location.hash === '#/kitchen'))
  await page.evaluate(() => { location.hash = '#not-ours' }); await settle(page)
  ok('a hash that is not ours does not send anybody home', (await snap(page)).view === 'view-kitchen')

  // Back into a game shows the screen you left, not a fresh one.
  await page.goto(APP); await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(900)
  await page.click('#landing-start'); await page.waitForTimeout(450)
  await page.click('#choice-yes'); await page.waitForTimeout(450)
  const q = await page.evaluate(() => [document.getElementById('q-now').textContent, document.getElementById('q-text').textContent])
  await click('dishes'); await settle(page)
  await page.goBack(); await settle(page); s = await snap(page)
  const q2 = await page.evaluate(() => [document.getElementById('q-now').textContent, document.getElementById('q-text').textContent])
  ok('back into a game returns to the same question', s.view === 'view-decide' && q.join() === q2.join(), `${q} vs ${q2}`)
  ok('none of it threw', page.errors.length === 0, page.errors.join('; '))
  await page.context().close()
})

/* ------------------------------------------------------- the phone's bar */
await section('the phone\'s bar', async () => {
  const page = await open(390, 844)
  ok('phone: the tab bar is drawn, the sheet is not', await page.evaluate(() =>
    getComputedStyle(document.getElementById('tabbar')).display !== 'none' && !document.body.classList.contains('nav-open')))
  ok('phone: the closed sheet cannot take focus', await page.evaluate(() =>
    [...document.querySelectorAll('.rail-link')].every((l) => { l.focus(); return document.activeElement !== l })))

  await page.focus('#tab-more'); await page.keyboard.press('Enter'); await page.waitForTimeout(300)
  ok('Enter on More opens the sheet and says it is expanded', await page.evaluate(() =>
    document.body.classList.contains('nav-open') && document.getElementById('tab-more').getAttribute('aria-expanded') === 'true'))
  ok('focus moves into the sheet', await page.evaluate(() => document.getElementById('rail').contains(document.activeElement)), await active(page))
  await page.keyboard.press('Escape'); await page.waitForTimeout(250)
  ok('Escape closes it and gives focus back to More', await page.evaluate(() => !document.body.classList.contains('nav-open')) && (await active(page)) === 'tab-more', await active(page))

  await page.click('#tab-more'); await page.waitForTimeout(300)
  await page.click('#nav-scrim', { position: { x: 195, y: 20 } }); await page.waitForTimeout(250)
  ok('the scrim closes it', await page.evaluate(() => !document.body.classList.contains('nav-open')))

  await page.click('#tab-more'); await page.waitForTimeout(300)
  await page.click('.rail-link[data-view="help"]'); await page.waitForTimeout(450)
  ok('choosing from the sheet goes there and closes it', await page.evaluate(() =>
    !document.body.classList.contains('nav-open') && document.querySelector('.view.is-current').id === 'view-help'))
  ok('More is the current tab for a section behind it', await page.evaluate(() =>
    document.getElementById('tab-more').classList.contains('is-current') && !document.querySelector('.tab-link[data-view].is-current')))
  await page.click('.tab-link[data-view="dishes"]'); await page.waitForTimeout(350)
  ok('a tab marks itself and More lets go', await page.evaluate(() =>
    document.querySelector('.tab-link[data-view="dishes"]').classList.contains('is-current') && !document.getElementById('tab-more').classList.contains('is-current')))

  // The navigation cannot take a screen: it was a quarter of the height, then half at large text.
  const top = await page.evaluate(() => Math.round(document.querySelector('.view.is-current .head-title').getBoundingClientRect().top))
  ok('the page title starts in the top fifth of a phone', top < 844 * 0.2, `title at ${top}px`)

  await page.click('#tab-more'); await page.waitForTimeout(300)
  await page.setViewportSize({ width: 1100, height: 800 }); await page.waitForTimeout(300)
  ok('widening closes the sheet and the column takes over', await page.evaluate(() =>
    !document.body.classList.contains('nav-open') && getComputedStyle(document.getElementById('tabbar')).display === 'none'))
  await page.context().close()
})

/* ----------------------------------------------- nothing scrolls sideways */
await section('nothing scrolls sideways', async () => {
  // A passing overflow is enough to make a phone widen the page and keep it wide,
  // so the widest the page ever got is what is asserted, not where it ended up.
  for (const w of [320, 360, 390]) {
    // With motion ON: the passing overflow only happens while the cards are moving.
    const page = await open(w, 800, { motion: true })
    await page.evaluate(() => {
      window.__widest = innerWidth
      setInterval(() => { window.__widest = Math.max(window.__widest, innerWidth) }, 40)
    })
    await page.evaluate(() => document.getElementById('landing-start').click()); await page.waitForTimeout(500)
    for (let i = 0; i < 3; i++) { await page.click('#choice-yes').catch(() => {}); await page.waitForTimeout(350) }
    await page.waitForTimeout(800)
    const widest = await page.evaluate(() => window.__widest)
    ok(`phone ${w}px wide never gets wider than ${w}px while a game is played`, widest === w, `widest it got: ${widest}px`)
    await page.context().close()
  }
})

console.log(`\n${pass} passed, ${fails} failed`)
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
