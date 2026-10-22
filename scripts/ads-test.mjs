/*
 * The marketing site's ad component, without a browser: which unit a placement
 * gets at which width, what goes into the frame, and that the sandbox is what
 * it says. The browser half (and the fake hostile creative) is
 * scripts/ads-drive.mjs; the files-agree half is scripts/shell-test.mjs.
 */
import { AD_SANDBOX, adHtml, pickUnit } from '../src/components/AdSlot.tsx'
import { AD_UNITS, ADS_ON, adLive } from '../src/lib/site.ts'

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

// As shipped: nothing configured, so nothing can be picked and the page may say there is no advertising.
const shipped = Object.values(AD_UNITS).every((u) => !adLive(u))
check('as committed, no unit is live and ads are off', shipped && ADS_ON === false, JSON.stringify(AD_UNITS))
check('so nothing can be picked at any width', [320, 760, 1200].every((w) => pickUnit('inline', w) === null && pickUnit('end', w) === null))

// Fill the table the way a pasted snippet would.
AD_UNITS.leaderboard.src = 'https://ads.example/l/invoke.js'; AD_UNITS.leaderboard.key = 'LKEY'
AD_UNITS.banner.src = 'https://ads.example/b/invoke.js'; AD_UNITS.banner.key = 'BKEY'
AD_UNITS.rectangle.src = 'https://ads.example/r/invoke.js'; AD_UNITS.rectangle.key = 'RKEY'

check('inline, wide: the 728x90', pickUnit('inline', 1000)?.key === 'LKEY')
check('inline, a phone: the 320x50', pickUnit('inline', 390)?.key === 'BKEY')
check('end of a page: the 300x250', pickUnit('end', 1000)?.key === 'RKEY' && pickUnit('end', 390)?.key === 'RKEY')
check('a slot narrower than 320 is never given anything wider than 320', pickUnit('inline', 300)?.width <= 320)
check('a 728 unit is never put in a 700px slot', pickUnit('inline', 700)?.width !== 728)

// Half a snippet is no snippet.
AD_UNITS.banner.key = ''
check('a unit with no key is not live, and the placement falls back to one that is', pickUnit('inline', 390)?.key === 'RKEY')
AD_UNITS.banner.key = 'BKEY'

const html = adHtml(AD_UNITS.banner)
check('the frame loads the unit’s own script', html.includes('src="https://ads.example/b/invoke.js"'))
check('and sets atOptions from the unit', /atOptions=\{"key":"BKEY","format":"iframe","height":50,"width":320/.test(html))
check('the sandbox grants scripts and real-click popups only', AD_SANDBOX === 'allow-scripts allow-popups allow-popups-to-escape-sandbox', AD_SANDBOX)
check('and neither same-origin nor top navigation', !/same-origin|top-navigation/.test(AD_SANDBOX))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
