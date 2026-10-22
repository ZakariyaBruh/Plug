/*
 * The ad rules, in a real browser, against a fake ad network.
 *
 *   bun run adsdrive
 *
 * No real unit is needed, and none is contacted: the driver serves public/
 * itself, rewrites config.js on the way out to point three fake units at a
 * script it also serves, and checks what the game does with them. The fake
 * creative is deliberately rude. It tries to read the page's storage, reach into
 * its DOM and redirect the tab, and reports what the browser let it do, so the
 * sandbox is tested by an attacker and not by reading its attribute.
 *
 * What it asserts is the list of promises made on the privacy page:
 *   - nothing is drawn, and nothing is requested, until a unit is configured
 *   - an ad from the first visit (no decisions needed), and Save-Data does not stop it
 *   - nothing for Premium
 *   - where the visitor has to opt in first: nothing until Accept all, and gone again after Essential only
 *   - one slot under every section but the questions and Profile (which has its own)
 *   - none in the decide flow, a game, the answer or the reward
 *   - one slot per screen, drawn only once it is near the viewport
 *   - the right size for the width, and a label that offers the way out
 *   - re-rendering the list does not reload (and so re-count) the ad
 *   - the creative can read nothing of ours and cannot move the tab
 *
 * Playwright is not a dependency of this project; it is on the machine and
 * imported by path, as in play-drive.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', 'public')
const PORT = 8793
const KEY = 'whatShouldIEat.v1'

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
}

let configured = true // flipped per scenario: are the units live, or stripped out as if none were pasted?
const adRequests = []
const reports = []

// A creative that behaves as badly as the sandbox allows it to, and says what happened.
const FAKE_AD = `
(function () {
  var o = window.atOptions || {};
  var r = { key: o.key, w: o.width, h: o.height };
  try { r.storage = typeof localStorage.getItem('${KEY}'); } catch (e) { r.storage = 'blocked'; }
  try { r.parentDom = typeof window.parent.document.title; } catch (e) { r.parentDom = 'blocked'; }
  try { window.top.location.href = 'https://example.com/hijacked'; r.top = 'allowed'; } catch (e) { r.top = 'blocked'; }
  try { document.cookie = 'ad=1'; r.cookie = document.cookie ? 'readable' : 'empty'; } catch (e) { r.cookie = 'blocked'; }
  document.body.insertAdjacentHTML('beforeend', '<div style="width:' + r.w + 'px;height:' + r.h + 'px;background:#ccc"></div>');
  window.parent.postMessage({ fakeAd: r }, '*');
})();`

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  if (url.startsWith('/fake-ad/')) {
    adRequests.push(url)
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    return res.end(FAKE_AD)
  }
  const path = normalize(url).replace(/^(\.\.[/\\])+/, '')
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('not found') }
  let body = readFileSync(file)
  if (path.endsWith('/decide/js/config.js')) {
    // The shipped file carries the real keys and the real network. Either take them out (as if
    // nothing had been pasted) or keep the keys and point the network at the fake one here.
    body = Buffer.from(configured
      ? String(body).replaceAll('https://bauval.org/22/', `http://127.0.0.1:${PORT}/fake-ad/`)
      : String(body).replace(/src: '[^']*', key: '[^']*'/g, "src: '', key: ''"))
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  res.end(body)
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
if (!pw) { console.error('Playwright is not available on this machine; nothing driven.'); server.close(); process.exit(0) }
const { chromium } = pw.default || pw
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

async function open({ width = 1280, height = 800, decisions = 0, premium = false, askFirst = false, consent = null, saveData = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: width < 700, isMobile: width < 700 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('PAGEERROR ' + e.message); fails += 1 })
  // Playwright tries the most recently added route first, so the specific one goes last.
  await page.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.route(/\/api\/region/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ askFirst }) }))
  await page.route(/\/api\/premium-status/, (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ signedIn: premium, hasPremium: premium, username: premium ? 'tester' : '', userId: premium ? 'u1' : null }),
  }))
  await page.addInitScript(([k, n, c, sd]) => {
    if (window.top !== window) return // the ad's own frame: no storage there, by design
    if (c && !localStorage.getItem('m45-consent')) localStorage.setItem('m45-consent', c)
    if (sd) Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })
    if (n && !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify({ decisions: n, onboarded: true, langAsked: true }))
    window.__ad = []
    window.addEventListener('message', (e) => { if (e.data && e.data.fakeAd) window.__ad.push(e.data.fakeAd) })
  }, [KEY, decisions, consent, saveData])
  await page.goto(APP, { waitUntil: 'load' })
  await page.waitForTimeout(800)
  for (let i = 0; i < 6 && (await page.locator('#welcome').isVisible()); i++) {
    const next = page.locator('#welcome-next')
    if (await next.isVisible()) await next.click({ force: true })
    await page.waitForTimeout(300)
  }
  await page.waitForTimeout(500)
  return page
}
const go = (page, v) => page.evaluate((v) => window.M45.setView(v), v).then(() => page.waitForTimeout(500))
const frames = (page) => page.evaluate(() => [...document.querySelectorAll('.ad-wrap iframe')].map((f) => ({ w: f.width, h: f.height, sandbox: f.getAttribute('sandbox'), where: f.closest('.ad-wrap').id })))

/* ------------------------------------------------ nothing configured */
configured = false
{
  adRequests.length = 0
  const page = await open({ decisions: 5 })
  await go(page, 'dishes'); await page.evaluate(() => window.scrollTo(0, 0))
  await go(page, 'profile')
  ok('with no unit configured nothing is drawn', (await frames(page)).length === 0)
  ok('and nothing is requested from any network', adRequests.length === 0, adRequests.join(', '))
  ok('and no slot takes up room', await page.evaluate(() => [...document.querySelectorAll('.ad-wrap')].every((e) => e.offsetHeight === 0)))
  await page.context().close()
}

/* ------------------------------------------------ configured */
configured = true
{
  // From the first visit: no decisions finished at all, and the browser asks to save data.
  const page = await open({ decisions: 0, saveData: true })
  await go(page, 'nearby'); await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(900)
  ok('with no decisions finished and Save-Data on, an ad is still drawn', (await frames(page)).length >= 2, JSON.stringify(await frames(page)))
  ok('and the cookie notice is there to change that', await page.locator('.consent:not([hidden])').count() === 1)
  await page.context().close()
}
{
  // Where the law says to ask first.
  adRequests.length = 0
  const page = await open({ decisions: 0, askFirst: true })
  await go(page, 'nearby'); await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(900)
  ok('opt-in region: nothing is drawn before the visitor has said yes', (await frames(page)).length === 0)
  ok('and nothing is requested from the network', adRequests.length === 0, adRequests.join(', '))
  ok('the two buttons are equally easy to reach', await page.locator('.consent [data-c="all"]').isVisible() && await page.locator('.consent [data-c="essential"]').isVisible())
  adRequests.length = 0
  await page.locator('.consent [data-c="all"]').click(); await page.waitForTimeout(1200)
  ok('Accept all draws the ads, with no reload', (await frames(page)).length >= 2, JSON.stringify(await frames(page)))
  ok('and the notice goes away', await page.locator('.consent:not([hidden])').count() === 0)
  await page.evaluate(() => Consent.show()); await page.waitForTimeout(200)
  await page.locator('.consent [data-c="essential"]').click(); await page.waitForTimeout(500)
  ok('taking it back removes the ads from the page at once', (await frames(page)).length === 0, JSON.stringify(await frames(page)))
  ok('and the choice is kept for next time', await page.evaluate(() => localStorage.getItem('m45-consent') === 'essential'))
  await page.context().close()
}
{
  // A region that cannot be told is treated as opt-in, and so is a failed answer.
  const page = await open({ decisions: 0, askFirst: true, consent: 'essential' })
  await go(page, 'nearby'); await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(700)
  ok('an earlier "Essential only" is respected on the next visit', (await frames(page)).length === 0)
  ok('and the notice does not nag', await page.locator('.consent:not([hidden])').count() === 0)
  await page.context().close()
}
{
  const page = await open({ decisions: 5, premium: true })
  await page.waitForTimeout(600)
  await go(page, 'dishes'); await go(page, 'profile')
  ok('a Premium member sees none', (await frames(page)).length === 0, JSON.stringify(await frames(page)))
  await page.context().close()
}
{
  // Everything that is not a place for one.
  const page = await open({ decisions: 5 })
  await page.click('#landing-start'); await page.waitForTimeout(400)
  let answer = false
  for (let i = 0; i < 30 && !answer; i++) {
    if (await page.locator('#accept-btn').isVisible()) { answer = true; break }
    const yes = page.locator('#choice-yes')
    if (!(await yes.isVisible())) break
    await yes.click(); await page.waitForTimeout(150)
  }
  await page.waitForTimeout(1500)
  ok('none while a question is being answered, or on the answer', (await frames(page)).length === 0)
  await page.locator('#accept-btn').click().catch(() => {}); await page.waitForTimeout(1200)
  ok('none on the reward after accepting', (await frames(page)).length === 0)
  await page.context().close()
}
{
  const page = await open({ decisions: 5 })
  await go(page, 'dishes')
  // On a desktop screen the ninth row is within 400px of the fold, so it may well be drawn already.
  // Laziness is asserted on the profile below, where the slot is far down the page.
  // Scroll the ninth row into view, which is where the ad sits.
  await page.evaluate(() => document.querySelectorAll('#dish-grid .dish')[8].scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(900)
  const f = await frames(page)
  ok('scrolling to it draws a cluster of two, not one and not a wall', f.length === 2, JSON.stringify(f))
  ok('under one label, not one each', await page.evaluate(() => document.querySelectorAll('#dish-ad .ad-label').length === 1))
  ok('desktop width gets the 728x90 and the 468x60 together', f.length === 2 && f[0].w === '728' && f[0].h === '90' && f[1].w === '468' && f[1].h === '60', JSON.stringify(f))
  ok('it is the ninth thing in the list, after eight dishes', await page.evaluate(() => {
    const kids = [...document.getElementById('dish-grid').children].filter((e) => !e.hidden)
    return kids.findIndex((e) => e.id === 'dish-ad') === 8
  }))
  ok('the label offers Premium as the way out', await page.evaluate(() => /Remove ads with Premium/.test(document.querySelector('#dish-ad .ad-label').textContent)))
  ok('and calls itself an advertisement to assistive tech', await page.evaluate(() => document.getElementById('dish-ad').getAttribute('aria-label') === 'Advertisement'))

  // The creative is hostile; the sandbox is what stops it.
  await page.waitForTimeout(600)
  const rep = await page.evaluate(() => window.__ad[0])
  ok('the creative ran', !!rep, 'no report came back from the fake ad')
  ok('and could not read this page’s storage', rep && rep.storage === 'blocked', JSON.stringify(rep))
  ok('or reach into its DOM', rep && rep.parentDom === 'blocked', JSON.stringify(rep))
  ok('or redirect the tab', rep && rep.top === 'blocked' && page.url().startsWith(APP), `${JSON.stringify(rep)} ${page.url()}`)
  ok('the sandbox has neither forbidden flag', f[0] && !/allow-same-origin|allow-top-navigation/.test(f[0].sandbox), f[0] && f[0].sandbox)

  // Filtering rebuilds the list around it; it must not be reloaded or counted again.
  const requestsBefore = adRequests.length
  const reportsBefore = await page.evaluate(() => window.__ad.length)
  await page.evaluate(() => { window.__adNode = document.querySelector('#dish-ad iframe') })
  for (const t of ['Sweet', 'Savoury', 'Everything']) {
    await page.locator('.filter', { hasText: new RegExp('^' + t) }).first().click().catch(() => {})
    await page.waitForTimeout(300)
  }
  ok('filtering the list does not reload the ad', await page.evaluate(() => window.__adNode === document.querySelector('#dish-ad iframe') && window.__ad.length === 2), `reports ${await page.evaluate(() => window.__ad.length)}`)
  ok('or ask the network for another', adRequests.length === requestsBefore, `${adRequests.length} vs ${requestsBefore}`)
  await page.fill('.find input, #dish-search', 'pizza').catch(() => {}); await page.waitForTimeout(300)
  ok('a short result list has no ad in it', await page.evaluate(() => document.getElementById('dish-ad').hidden === true))
  await page.context().close()
}
{
  const page = await open({ width: 390, height: 800, decisions: 5 })
  await go(page, 'dishes')
  await page.evaluate(() => document.querySelectorAll('#dish-grid .dish')[8].scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(900)
  const f = await frames(page)
  ok('a phone gets the slim 320x50 and a 300x250, two together', f.length === 2 && f[0].w === '320' && f[0].h === '50' && f[1].w === '300' && f[1].h === '250', JSON.stringify(f))
  ok('and never sideways overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await go(page, 'profile')
  await page.waitForTimeout(500)
  ok('at the end of a long page nothing loads until it is near the viewport', (await frames(page)).filter((x) => x.where === 'profile-ad').length === 0)
  await page.evaluate(() => document.getElementById('profile-ad').scrollIntoView())
  await page.waitForTimeout(900)
  const p = (await frames(page)).filter((x) => x.where === 'profile-ad')
  ok('the end of the profile on a phone gets two: 300x250 and 320x50', p.length === 2 && p[0].w === '300' && p[1].w === '320', JSON.stringify(p))
  await page.context().close()
}
{
  const page = await open({ decisions: 5 })
  await go(page, 'profile')
  await page.evaluate(() => document.getElementById('profile-ad').scrollIntoView())
  await page.waitForTimeout(900)
  const p = (await frames(page)).filter((x) => x.where === 'profile-ad')
  ok('the end of the profile on a wide screen gets three: 300x250, 160x300, 468x60', p.length === 3 && p.map((x) => x.w).join() === '300,160,468', JSON.stringify(p))
  await page.context().close()
}

/* ------------------------------------------------ the sponsor page, for more questions */
async function chatScenario({ left, premium = false, claimsLeft = 3 }) {
  const page = await open({ decisions: 5, premium })
  const calls = []
  await page.context().route(/araplhn\.org/, (r) => { calls.push('sponsor:' + r.request().url()); return r.fulfill({ status: 200, contentType: 'text/html', body: '<p>sponsor</p>' }) })
  await page.route(/\/api\/chat$/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ left, limit: 3, account: false, bonus: { per: 2, claimsLeft } }) }))
  await page.route(/\/api\/chat-bonus/, async (r) => {
    const sent = JSON.parse(r.request().postData() || '{}')
    calls.push('bonus:' + sent.step)
    if (sent.step === 'start') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: '1800000000000.' + 'a'.repeat(32), per: 2 }) })
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ left: 2, limit: 5, claimsLeft: claimsLeft - 1 }) })
  })
  await go(page, 'chat'); await page.waitForTimeout(700)
  return { page, calls }
}
{
  const { page } = await chatScenario({ left: 2 })
  ok('with questions left there is no offer', await page.evaluate(() => document.getElementById('chat-bonus-wrap').hidden))
  await page.context().close()
}
{
  const { page } = await chatScenario({ left: 0, premium: true })
  ok('a Premium member is never offered it', await page.evaluate(() => document.getElementById('chat-bonus-wrap').hidden))
  await page.context().close()
}
{
  const { page } = await chatScenario({ left: 0, claimsLeft: 0 })
  ok('with no claims left today there is no offer', await page.evaluate(() => document.getElementById('chat-bonus-wrap').hidden))
  await page.context().close()
}
{
  const { page, calls } = await chatScenario({ left: 0 })
  ok('out of questions: the offer is there, says what it is, and nothing has opened', await page.evaluate(() => !document.getElementById('chat-bonus-wrap').hidden && /sponsor page/i.test(document.getElementById('chat-bonus-note').textContent)) && calls.length === 0, calls.join(', '))
  const popup = page.waitForEvent('popup', { timeout: 4000 }).catch(() => null)
  await page.click('#chat-bonus')
  const opened = await popup
  ok('one tap opens the sponsor page in a new tab, and only then', !!opened && /araplhn\.org\/4\/c3b5fbe9/.test(opened.url() || ''), opened ? opened.url() : 'no popup')
  await page.waitForTimeout(500)
  ok('and asks the server to start the clock', calls.includes('bonus:start'), calls.join(', '))
  ok('the claim cannot be pressed straight away', await page.evaluate(() => document.getElementById('chat-bonus').disabled))
  await page.waitForTimeout(11000)
  ok('after the wait it can', await page.evaluate(() => !document.getElementById('chat-bonus').disabled && /Add my 2 questions/.test(document.getElementById('chat-bonus').textContent)), await page.evaluate(() => document.getElementById('chat-bonus').textContent))
  await page.click('#chat-bonus'); await page.waitForTimeout(700)
  ok('claiming asks the server, and the number shown is the server’s', calls.includes('bonus:claim') && await page.evaluate(() => /2 of 5 free questions left/.test(document.getElementById('chat-left').textContent)), await page.evaluate(() => document.getElementById('chat-left').textContent))
  ok('then the offer goes, because there are questions again', await page.evaluate(() => document.getElementById('chat-bonus-wrap').hidden))
  await page.context().close()
}

{
  // Every section but the questions and Profile has one under it; the questions have none.
  const page = await open({ decisions: 0 })
  for (const v of ['nearby', 'menu', 'planner', 'kitchen', 'scan', 'chat', 'news', 'radio', 'daily', 'help', 'dishes']) {
    await go(page, v)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(500)
    const shown = await page.evaluate(() => { const s = document.getElementById('view-ad'); return { hidden: s.hidden, frames: s.querySelectorAll('iframe').length } })
    ok(`${v}: a cluster of two or three sits under the section`, !shown.hidden && shown.frames >= 2 && shown.frames <= 3, JSON.stringify(shown))
  }
  await go(page, 'decide')
  ok('decide: the slot is gone', await page.evaluate(() => document.getElementById('view-ad').hidden))
  await go(page, 'profile'); await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(900)
  ok('profile: only its own cluster, not a second one', await page.evaluate(() => document.getElementById('view-ad').hidden && document.querySelectorAll('#profile-ad iframe').length >= 2))
  await page.context().close()
}
{
  // The front page.
  const page = await open({ decisions: 0 })
  // Scrolled the way a person does, so each slot is passed on the way down.
  for (let y = 0; y < 6000; y += 500) { await page.evaluate((y) => { document.getElementById('landing').scrollTop = y }, y); await page.waitForTimeout(120) }
  await page.waitForTimeout(900)
  const n = await page.evaluate(() => ({ a: document.querySelectorAll('#landing-ad-a iframe').length, b: document.querySelectorAll('#landing-ad-b iframe').length }))
  ok('the front page has a cluster in the middle and one at the end', n.a >= 2 && n.b >= 2, JSON.stringify(n))
  await page.context().close()
}
{
  // Premium: none anywhere, on any of them.
  const page = await open({ decisions: 0, premium: true })
  await page.waitForTimeout(500)
  for (const v of ['nearby', 'chat', 'dishes', 'profile']) { await go(page, v); await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300) }
  ok('Premium: no frame on any section', (await frames(page)).length === 0 && await page.evaluate(() => [...document.querySelectorAll('.ad-wrap')].every((e) => e.offsetHeight === 0)))
  await page.context().close()
}

console.log(`\n${pass} passed, ${fails} failed`)
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
