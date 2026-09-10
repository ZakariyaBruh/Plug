#!/usr/bin/env node
/*
 * Tell the search engines that take a push which pages changed.
 *
 * Run it after a deploy:
 *
 *     node scripts/indexnow.mjs            # submit everything in the sitemap
 *     node scripts/indexnow.mjs --dry-run  # show what would be sent
 *     node scripts/indexnow.mjs /decide/ /premium
 *
 * Google is not in this. It retired its sitemap ping and takes no submissions
 * of this kind, so it is left to the sitemap's lastmod and its own crawl —
 * nothing here changes anything Google reads. Bing, Yandex, Seznam and Naver
 * share the one endpoint below, so a single POST reaches all of them.
 *
 * The URL list is read from the live sitemap rather than written out here, so
 * a dish added to the catalogue is submitted without anybody remembering to
 * update this file.
 */
const SITE = 'https://morsels45-app.whop.site'
const KEY = '4789aa678bed52e5688945e5babdb139'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

// What the endpoint's replies mean, in its own words rather than a bare number.
const MEANING = {
  200: 'accepted',
  202: 'accepted — key still being validated',
  400: 'bad request — the payload was malformed',
  403: 'rejected — the key file did not check out',
  422: 'rejected — those URLs do not belong to this host',
  429: 'too many requests — try again later',
}

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`)
  if (!res.ok) throw new Error(`sitemap: ${res.status}`)
  const xml = await res.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const paths = args.filter((a) => !a.startsWith('--'))

  const urlList = paths.length
    ? paths.map((p) => (p.startsWith('http') ? p : SITE + (p.startsWith('/') ? p : '/' + p)))
    : await sitemapUrls()

  if (!urlList.length) throw new Error('nothing to submit')

  // The key has to be readable at the URL claimed below, or the whole
  // submission is refused. Checking first turns a silent 403 into a sentence.
  const keyUrl = `${SITE}/${KEY}.txt`
  const keyRes = await fetch(keyUrl)
  const served = keyRes.ok ? (await keyRes.text()).trim() : ''
  if (served !== KEY) {
    throw new Error(`key at ${keyUrl} reads ${JSON.stringify(served)} (${keyRes.status}), expected the key`)
  }
  console.log(`key       : ${keyUrl} ✓`)
  console.log(`submitting: ${urlList.length} urls`)
  console.log(`  ${urlList.slice(0, 3).join('\n  ')}${urlList.length > 3 ? `\n  … and ${urlList.length - 3} more` : ''}`)

  if (dryRun) return console.log('\n--dry-run: nothing sent')

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key: KEY,
      keyLocation: keyUrl,
      urlList,
    }),
  })
  const body = await res.text().catch(() => '')
  console.log(`\n${ENDPOINT} -> ${res.status} ${MEANING[res.status] || 'unexpected'}`)
  if (body.trim()) console.log(body.trim().slice(0, 300))
  if (res.status >= 400) process.exitCode = 1
}

main().catch((err) => {
  console.error('failed:', err.message)
  process.exitCode = 1
})
