import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { whop } from '@whop/cli/vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

/*
 * The service worker names its cache after a build id, and this is where it
 * gets one.
 *
 * The id is a hash of everything the worker precaches. Change any of those and
 * the cache name changes, so the old cache is swept on activate rather than
 * left to serve a stale app.js alongside a fresh index.html. Change none of
 * them and the id holds, so a deploy that does not touch the game does not
 * throw away a cache that is still correct.
 *
 * HASHED FROM THE SOURCES, not from the build output, because there are two
 * ways a file under /decide/ reaches a browser and they have to agree on the
 * number. Some of them come from the host's static asset layer, which serves
 * the built copy; index.html comes from routes/decide/$.ts, which inlines the
 * source with ?raw. Hashing dist gave those two different ids — the worker
 * precached js/app.js?v=<one> while the page asked for js/app.js?v=<other>,
 * so the precache was never once used. The sources are what both start from,
 * so the sources are what the id is taken from, and everything that needs it
 * reads it from here.
 */
const SHELL = [
  'index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg', 'icon-maskable.svg',
  'js/app.js', 'js/confetti.js', 'js/config.js', 'js/data.js', 'js/engine.js',
  'js/flavor.js', 'js/mapview.js', 'js/places.js', 'js/premium.js', 'js/progress.js',
  'js/recipes.js', 'js/sound.js',
  'js/taste.js',
]

/*
 * EVERY SCRIPT THE PAGE ASKS FOR MUST BE IN THE SHELL, and the build says so
 * rather than letting a missing one be discovered in production.
 *
 * There are three lists of these files and they have to agree: SHELL here,
 * VERSIONED in routes/decide/$.ts (which serves the game from ?raw at request
 * time), and the worker's own precache. A script added to the markup and to
 * only two of the three ships with no ?v= on it — the stale-HTML-with-old-JS
 * pairing this build id exists to prevent. That has happened twice.
 *
 * Checked against the markup rather than against the other lists, because the
 * markup is the only one that says what the page actually loads.
 */
function checkShell() {
  const html = readFileSync(join(process.cwd(), 'public', 'decide', 'index.html'), 'utf8')
  const asked = [...html.matchAll(/<script src="([^"?]+)"/g)].map((m) => m[1])
  const missing = asked.filter((f) => !SHELL.includes(f))
  if (missing.length) {
    throw new Error(
      `decide/index.html loads ${missing.join(', ')}, which ${missing.length === 1 ? 'is' : 'are'} ` +
        `not in SHELL (vite.config.ts). Add ${missing.length === 1 ? 'it' : 'them'} there, to ` +
        `VERSIONED and FILES in src/routes/decide/$.ts, and to the worker's precache in ` +
        `public/decide/sw.js — all three, or the file ships unversioned.`,
    )
  }
}

/** The one build id, taken from the shell's sources. */
function shellId(): string {
  checkShell()
  const hash = createHash('sha256')
  for (const file of SHELL) {
    hash.update(readFileSync(join(process.cwd(), 'public', 'decide', file)))
  }
  return hash.digest('hex').slice(0, 12)
}

/** The files whose URL carries the id. index.html is deliberately not one. */
const VERSIONED = SHELL.filter((f) => f.endsWith('.js') || f.endsWith('.css'))

/**
 * Put `?v=<id>` on every reference to a versioned file. `quote` is whichever
 * character delimits them in the text being stamped — double for the markup's
 * attributes, single for the worker's own SHELL array.
 */
export function stampUrls(text: string, id: string, quote: string): string {
  let out = text
  for (const file of VERSIONED) {
    out = out.split(`${quote}${file}${quote}`).join(`${quote}${file}?v=${id}${quote}`)
  }
  return out
}

/*
 * The build id, handed to the code that runs at request time.
 *
 * routes/decide/$.ts serves the game from ?raw imports of the same sources,
 * and has to stamp the same id onto the same URLs — a second, independent
 * hash there would disagree with this one every time.
 */
function buildId(): Plugin {
  const VIRTUAL = 'virtual:build-id'
  const RESOLVED = '\0' + VIRTUAL
  return {
    name: 'morsels45-build-id',
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : null
    },
    load(id) {
      if (id !== RESOLVED) return null
      return `export const BUILD = ${JSON.stringify(shellId())}`
    },
  }
}

/*
 * The session-replay id, read out of lib/site.ts rather than imported.
 *
 * This file cannot import from src/ — it is the config that sets up the
 * aliases — so the value is read the same way DISH_COUNT is checked further
 * down: by looking at the source. One constant still governs the script on
 * every page and both sentences on the privacy page, which is the whole
 * point of it. See the long note over CLARITY_ID.
 */
function clarityId(): string {
  try {
    const site = readFileSync(join(process.cwd(), 'src', 'lib', 'site.ts'), 'utf8')
    return /export const CLARITY_ID = '([^']*)'/.exec(site)?.[1] ?? ''
  } catch {
    return ''
  }
}

/*
 * The GA4 measurement id, read the same way and for the same reason.
 *
 * This file cannot import from src/, so the value is taken out of the source.
 * One constant still governs the tag on every page, the events mirrored to
 * it, and what the privacy page says about it. See the long note over GA4_ID.
 */
function ga4Id(): string {
  try {
    const site = readFileSync(join(process.cwd(), 'src', 'lib', 'site.ts'), 'utf8')
    return /export const GA4_ID = '([^']*)'/.exec(site)?.[1] ?? ''
  } catch {
    return ''
  }
}

function stampServiceWorker(): Plugin {
  return {
    name: 'morsels45-stamp-sw',
    apply: 'build',
    writeBundle() {
      const dir = join(process.cwd(), 'dist', 'client', 'decide')
      const worker = join(dir, 'sw.js')

      let source: string
      try {
        source = readFileSync(worker, 'utf8')
      } catch {
        return // no worker in this output (the server build); nothing to stamp
      }
      if (!source.includes('__BUILD__')) return

      for (const file of SHELL) {
        try {
          readFileSync(join(dir, file))
        } catch {
          // A file the worker lists but the build does not have is worth
          // knowing about: it would be precached as a 404 at install time.
          this.warn(`stamp-sw: ${file} is in the precache list but not in the build`)
        }
      }

      const id = shellId()

      /*
       * The same id goes onto the URL of every script and stylesheet, in the
       * page that asks for them and in the worker's precache list alike.
       *
       * WHY, given the cache is already named after the build. Because the
       * sweep happens too late. index.html is fetched network-first, so a
       * deploy reaches the browser on the next visit — but the page that
       * arrives is still controlled by the PREVIOUS worker, and that worker
       * answers `js/app.js` from its own cache and refreshes it in the
       * background. So the first load after every deploy ran a brand new
       * index.html against the previous build's JavaScript, and only the
       * visit after that got a matching pair. New markup driven by old code:
       * a panel nothing opens, a button nothing is listening to, a query
       * parameter the script has never heard of.
       *
       * With the id on the URL there is nothing to get wrong. The new page
       * asks for js/app.js?v=<new>, which no old cache can contain, so it
       * misses and goes to the network — correct on the first load, not the
       * second. A repeat visit still hits an exact match and still starts
       * instantly, and the worker still precaches the lot for offline.
       *
       * index.html itself is deliberately left unversioned: it is the one
       * file whose URL people type, link to and pin to a home screen.
       */
      const page = join(dir, 'index.html')
      try {
        /*
         * SESSION REPLAY GOES IN HERE, NOT IN THE ROUTE.
         *
         * routes/decide/$.ts also builds a copy of this page and also
         * injects the snippet — and in production nothing ever sees it,
         * because the static file written right here is served by the asset
         * handler before any request reaches the worker. Two hours went into
         * finding that out: the route's stamps and this file's stamps are
         * identical, so the served page looked like the route's output and
         * was not.
         *
         * Whatever the page needs has to be written HERE, at build time.
         * Same constant as everywhere else — empty id, nothing injected, and
         * the privacy page says nothing about replay. See CLARITY_ID.
         */
        let html = stampUrls(readFileSync(page, 'utf8'), id, '"')
        const replayId = clarityId()
        if (replayId) {
          const tag =
            '<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};' +
            't=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;' +
            'y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);' +
            `})(window,document,"clarity","script",${JSON.stringify(replayId)});</script>`
          html = html.replace('</head>', `${tag}\n</head>`)
        }
        // And GA4, on the same terms. Written here for the same reason the
        // replay tag is: this file's output is the page that gets served.
        const gaId = ga4Id()
        if (gaId) {
          const tag =
            `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>` +
            `<script>window.dataLayer=window.dataLayer||[];` +
            `function gtag(){dataLayer.push(arguments);}` +
            `gtag('js',new Date());` +
            `gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});</script>`
          html = html.replace('</head>', `${tag}\n</head>`)
        }
        writeFileSync(page, html)
      } catch {
        this.warn('stamp-sw: no index.html to version')
      }

      // The worker's own SHELL list, so what it precaches is what the page
      // will ask for. Single quotes there; double quotes in the markup.
      writeFileSync(worker, stampUrls(source, id, "'").replace('__BUILD__', id))
      this.info(`stamp-sw: cache is morsels45-${id}, ${VERSIONED.length} assets versioned`)
    },
  }
}

/*
 * The recipe book, lifted out of the game's own script at build time.
 *
 * public/decide/js/recipes.js is a UMD bundle the browser loads by <script>
 * tag — there is no module to import from it, and it is the only place a
 * recipe is written down. lib/dishes.ts has the same problem and solves it by
 * regex, which works because an item() call is one flat line. A recipe is not:
 * it is nested objects with arrays of prose, and a regex that appears to parse
 * that would go wrong quietly, on one dish, months from now.
 *
 * So it is evaluated instead — here, in Node, at build time, where evaluating
 * our own source file is ordinary. It could not be done in the worker even if
 * that were wise: the Workers runtime refuses eval and new Function outright.
 *
 * The result is inlined as JSON through a virtual module, so nothing is read
 * from disk at request time and nothing is committed that could drift from
 * recipes.js — change a recipe and the next build carries it.
 */
function recipeBook(): Plugin {
  const VIRTUAL = 'virtual:recipe-book'
  const RESOLVED = '\0' + VIRTUAL

  return {
    name: 'morsels45-recipe-book',
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : null
    },
    load(id) {
      if (id !== RESOLVED) return null

      const path = join(process.cwd(), 'public', 'decide', 'js', 'recipes.js')
      const source = readFileSync(path, 'utf8')

      // The UMD header prefers module.exports when it is given one, so handing
      // it a module object is enough to get the factory's return value out.
      const shim = { exports: {} as Record<string, unknown> }
      new Function('module', 'exports', source)(shim, shim.exports)

      const book = shim.exports.BOOK
      if (!book || typeof book !== 'object') {
        throw new Error('recipe-book: recipes.js did not export a BOOK')
      }
      const count = Object.keys(book).length
      if (count < 100) {
        // A silently half-empty book would take every dish page back down to a
        // stub without anything failing, which is the exact failure this plugin
        // is meant to make impossible.
        throw new Error(`recipe-book: only ${count} recipes parsed, expected the whole book`)
      }

      /*
       * And while data.js is open anyway: check that the number the site tells
       * people matches the number of dishes there actually are.
       *
       * DISH_COUNT is a literal in lib/site.ts rather than a count of
       * ALL_DISHES, because importing the catalogue to get one integer would
       * bundle the catalogue into every page that prints it. A literal can
       * drift, and "112" did — it survived three batches of new dishes and was
       * still on the front page, the FAQ, the premium feature list and both
       * social cards after the catalogue had reached 133. Nobody noticed
       * because nothing could fail. Now something can.
       */
      const dishes = readFileSync(join(process.cwd(), 'public', 'decide', 'js', 'data.js'), 'utf8')
      const dishCount = (dishes.match(/^\s*item\(/gm) ?? []).length
      const site = readFileSync(join(process.cwd(), 'src', 'lib', 'site.ts'), 'utf8')
      const claimed = Number(/export const DISH_COUNT = (\d+)/.exec(site)?.[1])
      if (!dishCount || !claimed) {
        throw new Error('recipe-book: could not read the dish count from data.js or site.ts')
      }
      if (dishCount !== claimed) {
        throw new Error(
          `recipe-book: the site says ${claimed} dishes, data.js has ${dishCount}. ` +
            'Update DISH_COUNT in src/lib/site.ts. The other places that print it are checked below.',
        )
      }
      if (count !== dishCount) {
        throw new Error(`recipe-book: ${dishCount} dishes but ${count} of them have recipes — must be 1:1`)
      }

      /*
       * 1:1 IS NOT THE SAME AS "HAS A RECIPE".
       *
       * The count above is satisfied by `recipes('Ramen', [])`, and by a
       * version with a name and nothing else. Both would pass every check in
       * this file and then hand somebody who tapped through to cook an empty
       * page — which is a worse outcome than the missing-recipe case this
       * plugin was written for, because nothing anywhere would look wrong.
       *
       * So the shape is checked as well as the key. Deliberately low bars:
       * one ingredient and one step, because a two-line variant that leans on
       * the one above it ("Gyudon as above", "Leftover polenta") is a real
       * entry and this must not start rejecting them. What it catches is
       * empty, which is the failure that actually happens when a batch of
       * dishes is added faster than the recipes for them.
       */
      const hollow: string[] = []
      for (const [dish, versions] of Object.entries(book as Record<string, unknown>)) {
        if (!Array.isArray(versions) || versions.length === 0) {
          hollow.push(`${dish}: no versions at all`)
          continue
        }
        versions.forEach((version, at) => {
          const v = version as { name?: string; ingredients?: unknown[]; steps?: unknown[] }
          const where = `${dish} (${v.name ?? `version ${at + 1}`})`
          if (!v.name) hollow.push(`${where}: no name`)
          const ingredients = (v.ingredients ?? []).filter((x) => typeof x === 'string' && x.trim())
          const steps = (v.steps ?? []).filter((x) => typeof x === 'string' && x.trim())
          if (!ingredients.length) hollow.push(`${where}: nothing to buy`)
          if (!steps.length) hollow.push(`${where}: nothing to do`)
        })
      }
      if (hollow.length) {
        throw new Error(
          'recipe-book: a dish has a recipe entry with nothing in it —\n  ' + hollow.join('\n  '),
        )
      }

      /*
       * And every OTHER place the app writes one of these numbers down.
       *
       * The error above used to tell whoever hit it to "update DISH_COUNT (and
       * the two counts in public/decide/index.html)" — an instruction nothing
       * enforced, on a file this plugin never opened. So the shell's counts
       * happened to be right and the web manifest, which nobody thinks of as
       * copy, sat on "All 112 dishes" through three batches of new ones. It is
       * the shortcut menu you get from long-pressing the installed icon: as
       * user-visible as the front page and a great deal easier to forget.
       *
       * Checked by anchor rather than by sweeping for "N dishes", because the
       * page legitimately says "8 dishes enter a bracket" and "0 dishes tried"
       * and neither is a claim about the catalogue.
       */
      const recipeTotal = Object.values(book as Record<string, unknown[]>)
        .reduce((n, list) => n + list.length, 0)

      const shell = readFileSync(join(process.cwd(), 'public', 'decide', 'index.html'), 'utf8')
      const manifest = readFileSync(join(process.cwd(), 'public', 'decide', 'manifest.webmanifest'), 'utf8')

      const claims: [string, RegExpMatchArray | null, number][] = [
        ['index.html landing stat', /<b id="landing-dishes">(\d+)<\/b>/.exec(shell), dishCount],
        ['index.html landing stat', /<b id="landing-recipes">(\d+)<\/b>/.exec(shell), recipeTotal],
      ]
      for (const label of ['og:description', 'twitter:description']) {
        const meta = new RegExp(`(?:property|name)="${label}" content="([^"]*)"`).exec(shell)
        claims.push([`index.html ${label}`, /(\d+) dishes/.exec(meta?.[1] ?? ''), dishCount])
      }
      for (const m of manifest.matchAll(/(\d+) dishes/g)) {
        claims.push(['manifest.webmanifest', m, dishCount])
      }

      for (const [where, match, want] of claims) {
        if (!match) throw new Error(`recipe-book: could not find the count in ${where}`)
        if (Number(match[1]) !== want) {
          throw new Error(
            `recipe-book: ${where} says ${match[1]}, but there are ${want}. Update it.`,
          )
        }
      }

      this.info(`recipe-book: ${dishCount} dishes, ${recipeTotal} recipes`)
      return `export default ${JSON.stringify(book)}`
    },
  }
}

/*
 * THE PREVIEW'S COPY OF THE CATALOGUE, checked against the real one.
 *
 * lib/preview.ts writes out twenty-four dishes by hand, because importing
 * ALL_DISHES would bundle a hundred and thirty-three into the landing page to
 * show one. That is the right trade and it comes with the obvious hazard: a
 * second list of dishes is a list that drifts, and this one is in the shop
 * window. A preview offering something the app no longer has, or describing it
 * differently from the page it links to, is worse than no preview.
 *
 * So every entry is checked against data.js: the name has to exist, and the
 * icon, the blurb and the level of each of the five tags it claims have to
 * match exactly. A dish renamed, retagged or rewritten in the catalogue fails
 * the build here rather than going quietly out of date.
 */
/*
 * THE DIETARY PROMISE, CHECKED AT BUILD TIME.
 *
 * "Everything you don't eat, off the menu" is the one claim on this site that
 * somebody could be harmed by trusting, and until now nothing checked it. The
 * invariants live in item() in data.js and throw when a dish is built — but
 * data.js is only ever EXECUTED in the browser. lib/dishes.ts reads it with a
 * regex, so a catalogue that would throw on load still shipped, and the first
 * thing to notice would have been a vegetarian being offered a chicken curry.
 *
 * That is not hypothetical. Khao soi was tagged chicken:1, and because
 * "chicken" is not a diet tag and implied nothing, it derived veg:1 and was
 * served to every vegetarian, Jain, Sattvic, Buddhist, Sikh and Ital profile
 * in the app. It had been that way for as long as the tag existed.
 *
 * So the catalogue is executed here, which runs every check in item(), and
 * then two things are asserted that item() cannot see on its own because they
 * are facts about the whole catalogue rather than about one dish:
 *
 *   - nothing counts as vegetarian while carrying an animal tag, at any
 *     strength; and
 *   - every diet preset still has something to offer, because a rule that
 *     empties the menu is a rule the engine quietly stops enforcing, and a
 *     silently unenforced dietary rule is the worst outcome available.
 */
function dietCheck(): Plugin {
  return {
    name: 'morsels45-diet-check',
    buildStart() {
      const load = (file: string) => {
        const source = readFileSync(join(process.cwd(), 'public', 'decide', 'js', file), 'utf8')
        const shim = { exports: {} as Record<string, unknown> }
        new Function('module', 'exports', source)(shim, shim.exports)
        return shim.exports
      }

      // Executing it is most of the test: every per-dish invariant in item()
      // throws from here, and a throw fails the build.
      const data = load('data.js') as { ITEMS?: { name: string; tags: Record<string, number> }[] }
      const progress = load('progress.js') as {
        DIETS?: { id: string; label: string; tags: string[] }[]
      }

      const items = data.ITEMS
      const diets = progress.DIETS
      if (!Array.isArray(items) || !items.length) throw new Error('diet-check: no dishes')
      if (!Array.isArray(diets) || !diets.length) throw new Error('diet-check: no diets')

      const ANIMAL = ['meat', 'seafood', 'chicken', 'pork', 'beef', 'shellfish']
      for (const item of items) {
        const veg = item.tags.veg ?? 0
        if (veg <= 0) continue
        const worst = Math.max(0, ...ANIMAL.map((tag) => item.tags[tag] ?? 0))
        if (veg > 1 - worst) {
          throw new Error(
            `diet-check: ${item.name} counts as vegetarian (veg ${veg}) while carrying ` +
              ANIMAL.filter((tag) => (item.tags[tag] ?? 0) > 0)
                .map((tag) => `${tag} ${item.tags[tag]}`)
                .join(', '),
          )
        }
      }

      /*
       * AND THE RECIPES HAVE TO KEEP THE DISH'S PROMISE TOO.
       *
       * The tags say what is in a dish and the dietary rules are applied to
       * them. The recipe underneath is prose and nothing was reading it — so
       * a dish tagged without egg could carry a recipe whose sauce is
       * mayonnaise, and somebody avoiding egg would be handed it by a rule
       * they set precisely so they would not have to read the ingredients.
       *
       * This is a word search, which means it is crude, and crude is the
       * right shape here: a false positive costs a tag or a reworded line,
       * and a false negative costs somebody their dietary rule. EXCEPT is
       * for the compounds that contain an animal word and are not the animal
       * — coconut milk, oat milk, butternut, eggplant — and it is checked
       * before the words are, so "coconut milk" never reads as milk.
       */
      const WORDS: [string, string[]][] = [
        ['dairy', ['milks?', 'butter', 'buttermilk', 'creams?', 'cheeses?', 'yogh?urt',
                   'parmesan', 'mozzarella', 'pecorino', 'gruyère', 'cheddar', 'ghee',
                   'mascarpone', 'provolone', 'curd', 'cotija', 'feta']],
        ['egg', ['eggs?', 'mayonnaise', 'mayo', 'meringues?', 'hollandaise']],
        ['meat', ['beef', 'pork', 'bacon', 'hams?', 'lamb', 'chicken', 'ducks?', 'sausages?',
                  'chorizo', 'pancetta', 'guanciale', 'lard', 'minces?', 'brisket', 'ribeye',
                  'sirloin', 'pâté', 'gelatine']],
        ['seafood', ['fish', 'prawns?', 'crab', 'salmon', 'tuna', 'anchov\\w*', 'sardines?',
                     'mussels?', 'squid', 'haddock', 'cod', 'bonito', 'dashi', 'oysters?']],
        ['alcohol', ['wine', 'whisk(?:y|ey)', 'beer', 'rum', 'sherry', 'shaoxing', 'vodka',
                     'brandy', 'amaretto', 'tej']],
      ]

      /*
       * Matched on whole words, because the first run of this said gomen was
       * cooked in lard (collard greens), risotto contained mince (a minced
       * shallot) and gazpacho was alcoholic (sherry vinegar). A check that
       * cries wolf gets switched off, so it matches \b...\b and nothing else.
       */
      const EXCEPT = [
        'coconut milk', 'coconut cream', 'coconut yoghurt', 'oat milk', 'almond milk',
        'soy milk', 'rice milk', 'plant milk', 'cream of tartar', 'peanut butter',
        'nut butter', 'butter bean', 'butternut', 'eggplant', 'sherry vinegar',
        'wine vinegar', 'vegetarian oyster sauce', 'creamed corn', 'collard',
        'minced', 'cocoa butter', 'shea butter',
      ]

      const book = load('recipes.js') as {
        BOOK?: Record<string, { name?: string; ingredients?: string[]; steps?: string[] }[]>
      }
      const recipes = book.BOOK ?? {}
      const byName = new Map(items.map((item) => [item.name, item]))
      const smuggled: string[] = []

      for (const [dish, versions] of Object.entries(recipes)) {
        const item = byName.get(dish)
        if (!item) continue
        for (const version of versions) {
          // Ingredients only. A step may mention a thing it is served WITH,
          // and the ingredient list is what actually goes in.
          let text = (version.ingredients ?? []).join(' ; ').toLowerCase()
          for (const safe of EXCEPT) text = text.split(safe).join(' ')
          for (const [tag, words] of WORDS) {
            if ((item.tags[tag] ?? 0) > 0) continue
            const hit = words.find((word) => new RegExp(`\\b${word}\\b`).test(text))
            if (hit) smuggled.push(`${dish} ("${version.name ?? '?'}") uses "${hit}" but is not tagged ${tag}`)
          }
        }
      }

      if (smuggled.length) {
        throw new Error(
          'diet-check: a recipe reaches past its dish\'s tags —\n  ' +
            smuggled.join('\n  ') +
            '\nTag the dish for it, or take it out of the recipe.',
        )
      }

      /*
       * A rule bites on anything above zero — a dish that MIGHT have pork in
       * it is not an answer you can give somebody who does not eat pork, so
       * the menu left to a diet is counted the same strict way the engine
       * counts it (see countBans in engine.js).
       */
      const starved = diets
        .map((diet) => ({
          diet,
          left: items.filter((item) => !diet.tags.some((tag) => (item.tags[tag] ?? 0) > 0)).length,
        }))
        .filter((row) => row.left < 10)

      if (starved.length) {
        throw new Error(
          'diet-check: too little left to offer — ' +
            starved.map((row) => `${row.diet.label} has ${row.left}`).join('; ') +
            '. Add dishes they can eat, or the rule stops being enforced.',
        )
      }
    },
  }
}

function previewCheck(): Plugin {
  const PREVIEW_TAGS = ['sweet', 'hot', 'quick', 'handheld', 'crunchy']

  return {
    name: 'morsels45-preview-check',
    buildStart() {
      const data = readFileSync(join(process.cwd(), 'public', 'decide', 'js', 'data.js'), 'utf8')
      const preview = readFileSync(join(process.cwd(), 'src', 'lib', 'preview.ts'), 'utf8')

      /*
       * item('Name', '\u{1F355}', 'blurb…', 'yes tags', 'maybe tags')
       *
       * The same shape lib/dishes.ts reads, and for the same reason: data.js is
       * a plain script with no module to import from, and this runs at build
       * time so nothing is parsed at request time.
       */
      const ITEM =
        /item\('((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'(?:,\s*'((?:[^'\\]|\\.)*)')?(?:,\s*'((?:[^'\\]|\\.)*)')?/g

      const decode = (literal: string) =>
        literal
          .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
          .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
          .replace(/\\'/g, "'")

      type Real = { icon: string; blurb: string; level: Record<string, number> }
      const real = new Map<string, Real>()
      for (const [, name, icon, blurb, yes, maybe] of data.matchAll(ITEM)) {
        const level: Record<string, number> = {}
        for (const tag of (yes ?? '').split(/\s+/).filter(Boolean)) level[tag] = 1
        for (const tag of (maybe ?? '').split(/\s+/).filter(Boolean)) level[tag] = 0.5
        real.set(decode(name), { icon: decode(icon), blurb: decode(blurb), level })
      }
      if (real.size < 100) throw new Error('preview-check: could not read the catalogue from data.js')

      // { name: 'Pizza', icon: '…', blurb: '…', tags: { hot: 1, quick: 0.5 } },
      const ROW = /\{ name: '((?:[^'\\]|\\.)*)', icon: '([^']*)', blurb: '((?:[^'\\]|\\.)*)', tags: \{([^}]*)\} \}/g
      const rows = [...preview.matchAll(ROW)]
      if (!rows.length) throw new Error('preview-check: no preview dishes found in lib/preview.ts')

      for (const [, rawName, icon, rawBlurb, tagList] of rows) {
        const name = rawName.replace(/\\'/g, "'")
        const blurb = rawBlurb.replace(/\\'/g, "'")
        const dish = real.get(name)
        if (!dish) {
          throw new Error(`preview-check: the preview offers "${name}", which is not in the catalogue`)
        }
        if (dish.icon !== icon) {
          throw new Error(`preview-check: ${name} is ${dish.icon} in the catalogue, ${icon} in the preview`)
        }
        if (dish.blurb !== blurb) {
          throw new Error(`preview-check: ${name}'s blurb does not match the catalogue`)
        }

        const claimed: Record<string, number> = {}
        for (const pair of tagList.split(',')) {
          const [tag, value] = pair.split(':').map((x) => x.trim())
          if (tag) claimed[tag] = Number(value)
        }
        for (const tag of PREVIEW_TAGS) {
          const mine = claimed[tag] ?? 0
          const theirs = dish.level[tag] ?? 0
          if (mine !== theirs) {
            throw new Error(
              `preview-check: ${name} is ${theirs} on "${tag}" in the catalogue, ${mine} in the preview`,
            )
          }
        }
      }

      /*
       * And the one number the preview writes down about the real game.
       *
       * The answer screen tells people this is five questions out of the real
       * bank's twenty-eight. Nothing on this side can count that bank, so it
       * is a literal — and an unchecked literal on this site is how "112
       * dishes" survived three batches of new ones.
       */
      /*
       * Counted inside the QUESTIONS array and at its own indent only. A sweep
       * of the whole file counted 44: every question may carry two or three
       * alternative wordings, which are objects of the same shape nested one
       * level in, and the tag lists below look similar again.
       */
      const bank = data.slice(data.indexOf('var QUESTIONS = ['), data.indexOf('\n  ];', data.indexOf('var QUESTIONS = [')))
      const asked = (bank.match(/^ {4}\{ /gm) ?? []).length
      const claimed = Number(/export const REAL_QUESTIONS = (\d+)/.exec(preview)?.[1])
      if (!asked || !claimed) {
        throw new Error('preview-check: could not read the question count from data.js or preview.ts')
      }
      if (asked !== claimed) {
        throw new Error(
          `preview-check: the preview says the game asks ${claimed} questions, data.js has ${asked}`,
        )
      }

      this.info(
        `preview-check: ${rows.length} preview dishes match the catalogue, ${asked} questions`,
      )
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // When this build was made, for the sitemap's <lastmod>. It has to be baked
  // in at build time: the worker has no memory of when it was deployed, and
  // reading the clock at request time would report the moment of the request —
  // a sitemap claiming every page changed seconds ago, every time it is read,
  // which is exactly the pattern that gets lastmod ignored.
  define: { __BUILT_AT__: JSON.stringify(new Date().toISOString()) },
  plugins: [
    recipeBook(),
    dietCheck(),
    previewCheck(),
    buildId(),
    whop({ disableTanstackDevtools: true }),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    stampServiceWorker(),
  ],
})

export default config
