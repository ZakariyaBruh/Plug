/*
 * The two retention mechanisms, driven in a real browser.
 *
 *   bun run build && bun run retention
 *
 * WHY A BROWSER AND NOT A UNIT TEST. Both of these are about what a specific
 * browser does on a specific day, and neither is visible in the source:
 *
 *  - The home-screen offer has two routes, and the one that matters most is
 *    the one with no button in it. Chromium fires beforeinstallprompt and
 *    hands over an event; Safari on iOS never fires it and never will, so
 *    there is nothing to click and the app has to say where the button lives
 *    instead. For a long time only the Chromium route existed, which quietly
 *    meant the iPhone half of the audience was offered nothing at all. This
 *    drives the iOS user agent for that reason.
 *
 *  - "Welcome back. Last time: ramen." depends on the date changing between
 *    two visits, so the only way to test it is to wind the clock back in the
 *    profile and reload. It caught a real bug on the first run: the visit
 *    stamp wrote today's date into the profile as the file loaded, long
 *    before the greeting read it, so the comparison always said "same day"
 *    and the line never appeared for anybody.
 */
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
const { chromium } = pw
const URL_ = 'http://127.0.0.1:4173/decide/'
const KEY = 'whatShouldIEat.v1'
let fails = 0
const ok = (n, c, d) => { c || (fails += 1); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${c || !d ? '' : '\n        ' + d}`) }

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

async function open(ua) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true, ...(ua ? { userAgent: ua } : {}) })
  const page = await ctx.newPage()
  const beacons = []
  await page.exposeFunction('__b', (n, d) => beacons.push([n, d]))
  await page.addInitScript(() => { window.whop = { track: (n, d) => { try { window.__b(n, d) } catch (e) {} } } })
  await page.route('**://www.googletagmanager.com/**', r => r.abort())
  await page.route('**://www.clarity.ms/**', r => r.abort())
  await page.route('**/api/promo', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"live":false}' }))
  page.on('pageerror', e => { console.log('PAGEERROR ' + e.message.slice(0, 160)); fails += 1 })
  return { browser, ctx, page, beacons }
}
async function pastWelcome(page) {
  for (let i = 0; i < 10; i++) {
    if (!(await page.locator('#welcome').isVisible())) return
    const s = page.locator('#welcome-skip'), n = page.locator('#welcome-next')
    if (await s.isVisible()) await s.click({ force: true }); else if (await n.isVisible()) await n.click({ force: true }); else return
    await page.waitForTimeout(350)
  }
}
async function decide(page) {
  await page.locator('#landing-start').click(); await page.waitForTimeout(400)
  for (let i = 0; i < 25; i++) {
    if (await page.locator('#accept-btn').isVisible()) break
    const y = page.locator('#choice-yes')
    if (!(await y.isVisible())) break
    await y.click(); await page.waitForTimeout(150)
  }
  await page.waitForFunction(() => { const e = document.getElementById('result-icon'); return e && e.classList.contains('is-landed') }, null, { timeout: 15000 })
  await page.waitForTimeout(300)
  await page.locator('#accept-btn').click(); await page.waitForTimeout(800)
}

// ---------- iOS: the Share-sheet route, which used to be offered to nobody
{
  const { browser, page, beacons } = await open(IOS)
  await page.goto(URL_, { waitUntil: 'load' }); await page.waitForTimeout(1500)
  await pastWelcome(page); await page.waitForTimeout(500)
  ok('iOS: nothing is offered before a decision', !(await page.locator('#keep-strip').isVisible()))
  await decide(page)
  const shown = await page.locator('#keep-strip').isVisible()
  ok('iOS: the home-screen strip appears after one decision', shown)
  const note = (await page.locator('#keep-note').textContent()) || ''
  ok('iOS: it says where the button actually is', /Add to Home Screen/.test(note), note.slice(0, 90))
  ok('iOS: no dead button to press', !(await page.locator('#keep-go').isVisible()))
  ok('iOS: install_shown fired', beacons.some(b => b[0] === 'install_shown' && b[1].how === 'ios'))
  await page.locator('#keep-no').click(); await page.waitForTimeout(400)
  ok('iOS: "not now" hides it', !(await page.locator('#keep-strip').isVisible()))
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1500)
  await decide(page)
  ok('iOS: and it stays gone', !(await page.locator('#keep-strip').isVisible()))
  await browser.close()
}

// ---------- returning on a later day
{
  const { browser, page, beacons } = await open(IOS)
  await page.goto(URL_, { waitUntil: 'load' }); await page.waitForTimeout(1500)
  await pastWelcome(page); await page.waitForTimeout(400)
  await decide(page)
  const dish = await page.evaluate(k => (JSON.parse(localStorage.getItem(k) || '{}').history || [])[0], KEY)
  ok('a decision is in the history', !!dish && !!dish.name, JSON.stringify(dish))
  // Wind the clock back: pretend the last visit was three days ago.
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k) || '{}')
    const d = new Date(); d.setDate(d.getDate() - 3)
    s.seen = d.toISOString().slice(0, 10)
    localStorage.setItem(k, JSON.stringify(s))
  }, KEY)
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1800)
  const hello = (await page.locator('#landing-hello').textContent()) || ''
  ok('it greets a returning visitor by what they ate', /Welcome back\. Last time: /.test(hello), hello)
  ok('and names the real dish', hello.includes(dish.name), `${hello} vs ${dish.name}`)
  const ret = beacons.find(b => b[0] === 'returned')
  ok('the return is measured', !!ret && ret[1].days === 3, JSON.stringify(ret && ret[1]))
  // Same day again: it should not re-fire, and should not say "welcome back"
  const before = beacons.filter(b => b[0] === 'returned').length
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1500)
  ok('reloading the same day does not count as returning',
    beacons.filter(b => b[0] === 'returned').length === before)
  const hello2 = (await page.locator('#landing-hello').textContent()) || ''
  ok('and it stops saying welcome back on the same day', !/Welcome back/.test(hello2), hello2.slice(0, 70))
  await browser.close()
}

console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILED'}`)
process.exit(fails ? 1 : 0)
