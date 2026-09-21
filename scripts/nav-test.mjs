/*
 * EVERY PAGE HAS TO BE REACHABLE FROM EVERY PAGE.
 *
 * Adding a route is one file. Adding it to the navigation is two more, in a
 * different part of the tree, and nothing has ever failed when somebody
 * skipped them — so pages quietly became typing-the-URL-only and stayed that
 * way. /privacy, /honesty and /eat were footer-only on the marketing site and
 * unreachable from the app entirely, which is where people actually are.
 *
 * So this walks the route directory, works out which routes are pages a
 * person should be able to navigate to, and insists each one is linked from
 * BOTH footers: the site's (components/SiteFooter.tsx, on every marketing
 * page) and the app's (public/decide/index.html, on the screen people spend
 * their time on).
 *
 * Footers rather than headers on purpose. A header cannot hold everything on
 * a phone and should not try; the footer is where people look when they are
 * looking for a page rather than following a flow, and it is the one place
 * that can honestly promise to be complete.
 *
 * WHAT THIS CANNOT SEE. It reads markup, so it proves a link EXISTS and not
 * that a thumb can reach it. Both of the real bugs found while writing it
 * were invisible from here: the app footer sat underneath the landing screen,
 * which is a fixed full-height overlay, and at desktop width its left-hand
 * end sat underneath the fixed rail — so "Home" and "All dishes" were two
 * links you could see and could not press. Those need a browser and a click,
 * and there is one in the scratch tests. Treat a pass here as "nothing has
 * been forgotten", not as "everything works".
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

/*
 * Routes that are pages but not destinations, with the reason each one is
 * exempt written down. A list like this rots into "everything is exempt"
 * unless the reason has to be defensible, so every entry says why somebody
 * arrives there instead of navigating there.
 */
const NOT_NAVIGABLE = {
  '__root': 'the layout, not a page',
  'index': 'the home page — linked as "/" rather than by filename',
  'checkout.$planId': 'reached mid-purchase from a plan button; carries noindex',
  'order-complete': 'reached by Whop after paying',
  'together.$code': 'arrives as a link somebody was handed',
  'seat.$id': 'a tombstone that redirects to /premium',
  'eat.$dish': 'one of 450 dish pages, reached from /eat',
  'eat.index': 'the hub itself — linked as "/eat"',
  'decide': 'the app, served from public/decide and linked as "/decide/"',
  'experiences.$experienceId': 'a Whop iframe entry point, not a page on this site',
  'robots[.]txt': 'for crawlers',
  'sitemap[.]xml': 'for crawlers',
}

/** routes/foo.tsx -> /foo ; routes/eat.index.tsx -> /eat */
function urlFor(file) {
  const name = file.replace(/\.(tsx|ts)$/, '')
  if (name === 'index') return '/'
  if (name === 'eat.index') return '/eat'
  return '/' + name.replace(/\./g, '/')
}

const files = readdirSync(join(root, 'src/routes'), { withFileTypes: true })
  .filter((e) => e.isFile() && /\.(tsx|ts)$/.test(e.name))
  .map((e) => e.name)

const pages = []
for (const file of files) {
  const name = file.replace(/\.(tsx|ts)$/, '')
  if (name in NOT_NAVIGABLE) continue
  pages.push(urlFor(file))
}
// The two hubs that ARE destinations despite their filenames, plus the app.
pages.push('/', '/eat', '/decide/')

const wanted = [...new Set(pages)].sort()

const siteFooter = readFileSync(join(root, 'src/components/SiteFooter.tsx'), 'utf8')
const appShell = readFileSync(join(root, 'public/decide/index.html'), 'utf8')
const appFooter = appShell.slice(appShell.indexOf('<footer class="appfoot"'), appShell.indexOf('</footer>'))

check('the app has a footer at all', appFooter.length > 0,
  'public/decide/index.html has no <footer class="appfoot">')

for (const url of wanted) {
  // The site footer links "/" with <Link to="/"> and the app with href.
  const inSite = new RegExp(`(?:to|href)="${url.replace(/[$/]/g, '\\$&')}"`).test(siteFooter)
  check(`site footer links ${url}`, inSite, `add it to src/components/SiteFooter.tsx`)
}

for (const url of wanted) {
  // The app footer is plain HTML, and it does not link the app to itself.
  if (url === '/decide/') continue
  const inApp = new RegExp(`href="${url.replace(/[$/]/g, '\\$&')}"`).test(appFooter)
  check(`app footer links ${url}`, inApp, `add it to the .appfoot nav in public/decide/index.html`)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
