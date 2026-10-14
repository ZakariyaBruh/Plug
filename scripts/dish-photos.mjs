/*
 * scripts/dish-photos.mjs — a real, credited photograph for each dish page.
 *
 *   bun scripts/dish-photos.mjs            check and print, write nothing
 *   bun scripts/dish-photos.mjs --write    and write src/lib/dish-photos.json
 *
 * WHY. Google shows a recipe as a rich result — the card with a picture —
 * only when its markup has an image of the dish, and the dish pages had none,
 * because there were no photographs here and a drawing of a bowl is not a
 * photograph of ramen. Wikipedia's article on nearly every dish leads with a
 * freely licensed photograph of it, on Wikimedia Commons. That is a real
 * photograph of the dish, and the licences ask for exactly what a page should
 * do anyway: say whose it is.
 *
 * WHAT HAS TO BE TRUE FOR A PHOTO TO BE USED:
 *
 *   The right article. The dish's name, followed through Wikipedia's
 *   redirects, has to land on an article whose own one-line description is
 *   about food — "Menemen" is also a town, "Causa" a genus of snails, and a
 *   town's photo on a recipe would be worse than none. Disambiguation pages
 *   are skipped.
 *
 *   A free licence, on Commons. Public domain, CC0, or Creative Commons with
 *   attribution (BY or BY-SA, any version), which need nothing more than the
 *   credit the page prints under the photo. GFDL-only files are left out — it
 *   wants its whole licence text reproduced — as is anything Commons marks
 *   with extra restrictions, and files held only on English Wikipedia, which
 *   are the non-free ones.
 *
 *   A photograph worth showing: a JPEG or PNG at least 600 pixels wide.
 *
 * The photos are not copied into this repository or the build. The page
 * shows them through /photos/<slug>.<ext> (routes/photos.$file.ts), which
 * fetches Wikimedia's own resized copy, so visitors only ever talk to this
 * site, and the images are indexed as this site's.
 */
import { writeFileSync } from 'node:fs'

// The site's own list and slugs (run with bun, which reads the TypeScript),
// so a photo can never be filed under a slug the pages do not use.
import { ALL_DISHES } from '../src/lib/dishes.ts'

const OUT = new URL('../src/lib/dish-photos.json', import.meta.url)
const WRITE = process.argv.includes('--write')
const UA = 'morsels45/1.0 (https://morsels45-app.whop.site; dish photos for recipe pages)'
const WIDTH = 1200

const dishes = ALL_DISHES.map((d) => ({ name: d.name, slug: d.slug }))

const FOOD = /dish|food|cuisine|culinary|cooking|soup|bread|cake|dessert|sandwich|pastry|snack|drink|beverage|salad|stew|noodle|rice|meal|sauce|pie|curry|dumpling|dim sum|pasta|cocktail|\btea\b|coffee|breakfast|cheese|fried|grilled|baked|roasted|confection|pudding|biscuit|cookie|porridge|pancake|flatbread|sausage|meat|chicken|beef|pork|lamb|fish|seafood|egg|vegetable|fruit|juice|wine|beer|liqueur|smoothie|milk|yogurt|tart|bun\b|roll\b|wrap|taco|burger|pizza|kebab|chocolate|candy|sweet|ice cream|condiment|dip\b|spread|omelette|toast|cereal|skewer|barbecue|street food|delicacy|appetizer|starter|side dish|preparation|recipe|cooked|baking/i
const FREE = /^(CC0|Public domain|CC BY(-SA)? \d(\.\d)?( [a-z]{2,3})?|Attribution|KOGL Type 1)$/i
// The cuisine, when the article's description names it ("Turkish flatbread").
const CUISINES = ['Afghan', 'African', 'American', 'Andalusian', 'Arab', 'Argentine', 'Armenian', 'Australian', 'Austrian', 'Balkan', 'Bangladeshi', 'Basque', 'Belgian', 'Brazilian', 'British', 'Bulgarian', 'Burmese', 'Cajun', 'Cantonese', 'Caribbean', 'Catalan', 'Chilean', 'Chinese', 'Colombian', 'Croatian', 'Cuban', 'Czech', 'Danish', 'Dutch', 'Egyptian', 'English', 'Ethiopian', 'Filipino', 'Finnish', 'French', 'Georgian', 'German', 'Greek', 'Haitian', 'Hawaiian', 'Hungarian', 'Indian', 'Indonesian', 'Iranian', 'Irish', 'Israeli', 'Italian', 'Jamaican', 'Japanese', 'Jewish', 'Korean', 'Lebanese', 'Levantine', 'Malaysian', 'Mediterranean', 'Mexican', 'Middle Eastern', 'Moroccan', 'Neapolitan', 'Nepali', 'Nigerian', 'North African', 'Norwegian', 'Pakistani', 'Persian', 'Peruvian', 'Polish', 'Portuguese', 'Puerto Rican', 'Romanian', 'Russian', 'Scottish', 'Sicilian', 'Singaporean', 'Spanish', 'Sri Lankan', 'Swedish', 'Swiss', 'Syrian', 'Szechuan', 'Taiwanese', 'Tex-Mex', 'Thai', 'Tibetan', 'Tunisian', 'Turkish', 'Ukrainian', 'Venezuelan', 'Vietnamese', 'Welsh', 'West African']
const CUISINE = new RegExp(`\\b(${CUISINES.join('|')})\\b`)

/*
 * One request at a time, a second and a half apart, as Wikimedia's API
 * etiquette asks — and when it says "too many requests", waiting as long as
 * it says to, then longer, rather than asking again straight away.
 */
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms))
async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params })
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(1500)
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } })
    if (res.ok) return res.json()
    const wait = Number(res.headers.get('retry-after')) || 0
    console.log(`  ${host} answered ${res.status}; waiting ${Math.max(wait, 20 * (attempt + 1))}s`)
    await sleep(Math.max(wait, 20 * (attempt + 1)) * 1000)
  }
  throw new Error(`${host} would not answer`)
}

// 1. Each dish's article, following redirects, with its description and lead image.
const article = {}
for (let i = 0; i < dishes.length; i += 50) {
  const batch = dishes.slice(i, i + 50)
  const q = await api('en.wikipedia.org', {
    action: 'query', titles: batch.map((d) => d.name).join('|'), redirects: '1',
    prop: 'pageimages|description|pageprops', piprop: 'name', ppprop: 'disambiguation',
  })
  const normalized = new Map((q.query.normalized ?? []).map((n) => [n.from, n.to]))
  const redirected = new Map((q.query.redirects ?? []).map((n) => [n.from, n.to]))
  const pages = new Map((q.query.pages ?? []).map((p) => [p.title, p]))
  for (const d of batch) {
    let title = normalized.get(d.name) ?? d.name
    title = redirected.get(title) ?? title
    const p = pages.get(title)
    if (!p || p.missing || p.pageprops?.disambiguation || !p.pageimage) continue
    article[d.slug] = { title, description: p.description ?? '', file: p.pageimage.replace(/_/g, ' ') }
  }
}

// 2. Each lead image's licence and a 1200-pixel copy, from Commons.
const files = [...new Set(Object.values(article).map((a) => a.file))]
const info = {}
for (let i = 0; i < files.length; i += 50) {
  const q = await api('commons.wikimedia.org', {
    action: 'query', titles: files.slice(i, i + 50).map((f) => `File:${f}`).join('|'),
    prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: String(WIDTH),
  })
  for (const p of q.query.pages ?? []) {
    const ii = p.imageinfo?.[0]
    if (!ii) continue
    const m = ii.extmetadata ?? {}
    info[p.title.replace(/^File:/, '')] = {
      mime: ii.mime, width: ii.width, thumb: ii.thumburl, thumbWidth: ii.thumbwidth, thumbHeight: ii.thumbheight,
      page: ii.descriptionurl,
      license: (m.LicenseShortName?.value ?? '').trim(),
      licenseUrl: m.LicenseUrl?.value ?? '',
      artist: (m.Artist?.value ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(),
      restrictions: (m.Restrictions?.value ?? '').trim(),
    }
  }
}

// 3. What passes.
const photos = {}
const skipped = { notFood: [], notFree: [], notPhoto: [], noArticle: [] }
for (const d of dishes) {
  const a = article[d.slug]
  if (!a) { skipped.noArticle.push(d.name); continue }
  if (!FOOD.test(a.description)) { skipped.notFood.push(`${d.name} → ${a.title} (${a.description})`); continue }
  const i = info[a.file]
  if (!i || !FREE.test(i.license) || i.restrictions) { skipped.notFree.push(`${d.name} (${i?.license || 'not on Commons'}${i?.restrictions ? ', ' + i.restrictions : ''})`); continue }
  if (!/^image\/(jpeg|png)$/.test(i.mime) || i.width < 600 || !i.thumb) { skipped.notPhoto.push(`${d.name} (${i.mime}, ${i.width}px)`); continue }
  photos[d.slug] = {
    // Without Wikimedia's tracking parameters.
    src: i.thumb.split('?')[0],
    ext: i.mime === 'image/png' ? 'png' : 'jpg',
    width: i.thumbWidth,
    height: i.thumbHeight,
    // "No machine-readable author provided. Jane Doe assumed (based on
    // copyright claims)." is Commons' way of saying Jane Doe.
    credit: (i.artist.replace(/^No machine-readable author provided\. (.+?) assumed.*$/, '$1').replace(/\s*\(talk\)/g, '').trim() || 'Unknown author').slice(0, 90),
    license: i.license,
    licenseUrl: i.licenseUrl.replace(/^http:\/\//, 'https://'),
    page: i.page,
    cuisine: CUISINE.exec(a.description)?.[1] ?? null,
  }
}

console.log(`${Object.keys(photos).length} of ${dishes.length} dishes have a photo`)
for (const [why, list] of Object.entries(skipped)) console.log(`  skipped, ${why}: ${list.length}${list.length ? ' — e.g. ' + list.slice(0, 6).join('; ') : ''}`)

if (WRITE) {
  const sorted = Object.fromEntries(Object.entries(photos).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), source: 'Wikimedia Commons', photos: sorted }, null, 1) + '\n')
  console.log(`wrote ${OUT.pathname}`)
}
