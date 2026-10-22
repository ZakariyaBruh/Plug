/*
 * Play with Dot, in a real browser: all ten games load on demand, start, run
 * through their start card, countdown and a few seconds of input without a
 * single page error, end on a results card, close on Escape, and nothing scrolls
 * sideways on a phone.
 *
 *   bun run dotsdrive
 *
 * Not in `bun run test` for the same reason as the other drivers: it needs a
 * Chromium. The games had no test of any kind before this one.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', 'public')
const PORT = 8793

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


const IDS = ['arena', 'jump', 'merge', 'pop', 'match', 'invade', 'cross', 'stack', 'spit', 'says']
async function session(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 700, isMobile: width < 700 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGEERROR ' + e.message) })
  await page.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.addInitScript(() => { if (window.top === window) localStorage.setItem('m45-consent', 'essential') })
  await page.addInitScript(() => { if (window.top === window) localStorage.setItem('whatShouldIEat.v1', JSON.stringify({ decisions: 3, onboarded: true, langAsked: true })) })
  await page.goto(APP, { waitUntil: 'load' })
  await page.waitForTimeout(900)
  for (let i = 0; i < 6 && (await page.locator('#welcome').isVisible()); i++) {
    const next = page.locator('#welcome-next')
    if (await next.isVisible()) await next.click({ force: true })
    await page.waitForTimeout(300)
  }
  page.errors = errors
  return page
}

for (const [label, w, h] of [['phone 390x844', 390, 844], ['desktop 1280x800', 1280, 800]]) {
  const page = await session(w, h)
  // The games are fetched on first use, not at startup.
  ok(`${label}: nothing of the games is loaded until they are asked for`, await page.evaluate(() => !window.M45Play && !window.Sprites))
  await page.evaluate(() => document.getElementById('buddy-games').click())
  await page.waitForSelector('.pg-tile', { timeout: 8000 })
  ok(`${label}: the shelf has ${IDS.length} games and a way to pick one`, (await page.locator('.pg-tile').count()) === IDS.length && (await page.locator('.pg-shuffle').count()) === 1)
  ok(`${label}: and they are the ones we expect, in order`, JSON.stringify(await page.evaluate(() => M45Play.shelf())) === JSON.stringify(IDS))
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)

  for (const id of IDS) {
    await page.evaluate((id) => M45.Play.open(id), id)
    await page.waitForSelector('.pg-canvas', { timeout: 5000 })
    const box = await page.locator('.pg-canvas').boundingBox()
    // the start card, then the countdown, then play
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(3900)
    const phase = await page.evaluate(() => M45Play._st && M45Play._st.phase)
    // Move about, press, drag, and let go, the way a thumb would.
    for (let k = 0; k < 10; k++) {
      const fx = 0.15 + 0.7 * ((k * 0.37) % 1), fy = 0.3 + 0.5 * ((k * 0.53) % 1)
      await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy)
      await page.mouse.down(); await page.mouse.move(box.x + box.width * (1 - fx), box.y + box.height * fy, { steps: 4 })
      await page.waitForTimeout(260); await page.mouse.up(); await page.waitForTimeout(160)
      await page.keyboard.press(['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp'][k % 4])
    }
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const live = await page.evaluate(() => !!M45Play._st)
    ok(`${label}: ${id} starts, runs and takes input with no page error and no sideways scroll (${phase})`, page.errors.length === 0 && over <= 0 && live && (phase === 'play' || phase === 'over'), page.errors.join(' | ') + ' overflow ' + over)
    if (id === 'arena') ok(`${label}: the stage is ${Math.round(box.width)}px wide, not 340`, box.width >= (w >= 700 ? 380 : 330), `${box.width}`)
    // Ending it, whatever it was doing, lands on a results card with a way on.
    await page.evaluate(() => M45Play._st.end())
    await page.waitForSelector('.pg-result', { timeout: 6000 }).catch(() => {})
    ok(`${label}: ${id} ends on a results card with play-again and another-game`, (await page.locator('.pg-result .is-main').count()) === 1 && (await page.locator('.pg-result .pg-btn').count()) === 2)
    await page.keyboard.press('Escape'); await page.waitForTimeout(150)
    ok(`${label}: and Escape closes it`, await page.evaluate(() => !M45Play.isOpen()))
  }
  await page.context().close()
}

await browser.close()
server.close()
console.log(`\n${pass} passed, ${fails} failed`)
process.exit(fails ? 1 : 0)
