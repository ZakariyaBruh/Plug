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
  'js/recipes.js', 'js/sound.js', 'js/taste.js',
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
        writeFileSync(page, stampUrls(readFileSync(page, 'utf8'), id, '"'))
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
            'Update DISH_COUNT in src/lib/site.ts (and the two counts in public/decide/index.html).',
        )
      }
      if (count !== dishCount) {
        throw new Error(`recipe-book: ${dishCount} dishes but ${count} recipes — they must be 1:1`)
      }

      this.info(`recipe-book: ${count} dishes, ${count} recipes`)
      return `export default ${JSON.stringify(book)}`
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
