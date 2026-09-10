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
 * It has to be stamped into the file that ships, not substituted when the file
 * is served: public/decide/** is handed to the host's static asset layer and
 * goes out byte for byte, so nothing on the request path ever sees it.
 *
 * The id is a hash of everything the worker precaches. Change any of those and
 * the cache name changes, so the old cache is swept on activate rather than
 * left to serve a stale app.js alongside a fresh index.html. Change none of
 * them and the id holds, so a deploy that does not touch the game does not
 * throw away a cache that is still correct.
 */
const SHELL = [
  'index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg', 'icon-maskable.svg',
  'js/app.js', 'js/confetti.js', 'js/config.js', 'js/data.js', 'js/engine.js',
  'js/flavor.js', 'js/mapview.js', 'js/places.js', 'js/premium.js', 'js/progress.js',
  'js/recipes.js', 'js/sound.js', 'js/taste.js',
]

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

      const hash = createHash('sha256')
      for (const file of SHELL) {
        try {
          hash.update(readFileSync(join(dir, file)))
        } catch {
          // A file the worker lists but the build does not have is worth
          // knowing about: it would be precached as a 404 at install time.
          this.warn(`stamp-sw: ${file} is in the precache list but not in the build`)
        }
      }

      const id = hash.digest('hex').slice(0, 12)
      writeFileSync(worker, source.replace('__BUILD__', id))
      this.info(`stamp-sw: cache is morsels45-${id}`)
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
