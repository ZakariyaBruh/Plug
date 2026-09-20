import { createFileRoute } from '@tanstack/react-router'

// The "Decide for me" game is a self-contained static app (public/decide/**),
// not a TanStack page. Cloudflare's static-asset layer is expected to serve
// it directly, but on this host every request reaches the SSR worker first —
// so without an explicit route here, anything under /decide/ falls through
// to the router's default Not Found page instead of the game.
//
// This route serves those files itself. The content is inlined at build
// time via `?raw` imports, so no filesystem access happens at request time.

import indexHtml from '../../../public/decide/index.html?raw'
import stylesCss from '../../../public/decide/styles.css?raw'
import appJs from '../../../public/decide/js/app.js?raw'
import confettiJs from '../../../public/decide/js/confetti.js?raw'
import configJs from '../../../public/decide/js/config.js?raw'
import dataJs from '../../../public/decide/js/data.js?raw'
import engineJs from '../../../public/decide/js/engine.js?raw'
import flavorJs from '../../../public/decide/js/flavor.js?raw'
import mapviewJs from '../../../public/decide/js/mapview.js?raw'
import placesJs from '../../../public/decide/js/places.js?raw'
import premiumJs from '../../../public/decide/js/premium.js?raw'
import progressJs from '../../../public/decide/js/progress.js?raw'
import recipesJs from '../../../public/decide/js/recipes.js?raw'
import soundJs from '../../../public/decide/js/sound.js?raw'
import syncJs from '../../../public/decide/js/sync.js?raw'
import tasteJs from '../../../public/decide/js/taste.js?raw'
import manifestJson from '../../../public/decide/manifest.webmanifest?raw'
import iconSvg from '../../../public/decide/icon.svg?raw'
import iconMaskableSvg from '../../../public/decide/icon-maskable.svg?raw'
import swJsRaw from '../../../public/decide/sw.js?raw'

/*
 * The build id, and the versioned URLs that go with it.
 *
 * BUILD comes from vite.config.ts, which hashes these same source files — one
 * number, computed once, used by everything that needs it. This file used to
 * compute its own with a small FNV-1a over the same bytes, which was fine
 * while the id only had to name a cache. It is not fine now that the id is
 * also on the URL of every script: there are two ways a file under /decide/
 * reaches a browser — the host's static asset layer for most of them, this
 * route for the page itself — and two different hashes meant the worker
 * precached js/app.js?v=<one> while the page asked for js/app.js?v=<other>.
 * Everything still worked, and the precache was never used once.
 *
 * WHY THE URLS CARRY IT AT ALL. index.html is fetched network-first, so a
 * deploy arrives on the next visit — but that page is still controlled by the
 * PREVIOUS service worker, which answers js/app.js out of its own cache. The
 * first load after every deploy therefore ran new markup against the previous
 * build's JavaScript. With the id on the URL the request simply cannot match
 * an old cache entry: it misses, goes to the network, and the page and its
 * code are the same build on the first load rather than the second.
 *
 * The route matches on pathname, so ?v= never has to be understood here — it
 * exists to be different, not to be read.
 */
import { BUILD } from 'virtual:build-id'

const VERSIONED = [
  'styles.css', 'js/app.js', 'js/confetti.js', 'js/config.js', 'js/data.js',
  'js/engine.js', 'js/flavor.js', 'js/mapview.js', 'js/places.js', 'js/premium.js',
  'js/progress.js', 'js/recipes.js', 'js/sound.js', 'js/sync.js',
  'js/taste.js',
]

function stampUrls(text: string, quote: string): string {
  let out = text
  for (const file of VERSIONED) {
    out = out.split(`${quote}${file}${quote}`).join(`${quote}${file}?v=${BUILD}${quote}`)
  }
  return out
}

const page = stampUrls(indexHtml, '"')
const swJs = stampUrls(swJsRaw, "'").replace('__BUILD__', BUILD)

const FILES: Record<string, { body: string; type: string }> = {
  '': { body: page, type: 'text/html; charset=utf-8' },
  'index.html': { body: page, type: 'text/html; charset=utf-8' },
  'styles.css': { body: stylesCss, type: 'text/css; charset=utf-8' },
  'js/app.js': { body: appJs, type: 'text/javascript; charset=utf-8' },
  'js/confetti.js': { body: confettiJs, type: 'text/javascript; charset=utf-8' },
  'js/config.js': { body: configJs, type: 'text/javascript; charset=utf-8' },
  'js/data.js': { body: dataJs, type: 'text/javascript; charset=utf-8' },
  'js/engine.js': { body: engineJs, type: 'text/javascript; charset=utf-8' },
  'js/flavor.js': { body: flavorJs, type: 'text/javascript; charset=utf-8' },
  'js/mapview.js': { body: mapviewJs, type: 'text/javascript; charset=utf-8' },
  'js/places.js': { body: placesJs, type: 'text/javascript; charset=utf-8' },
  'js/premium.js': { body: premiumJs, type: 'text/javascript; charset=utf-8' },
  'js/progress.js': { body: progressJs, type: 'text/javascript; charset=utf-8' },
  'js/recipes.js': { body: recipesJs, type: 'text/javascript; charset=utf-8' },
  'js/sound.js': { body: soundJs, type: 'text/javascript; charset=utf-8' },
  'js/sync.js': { body: syncJs, type: 'text/javascript; charset=utf-8' },
  'js/taste.js': { body: tasteJs, type: 'text/javascript; charset=utf-8' },
  'manifest.webmanifest': { body: manifestJson, type: 'application/manifest+json; charset=utf-8' },
  'icon.svg': { body: iconSvg, type: 'image/svg+xml; charset=utf-8' },
  'icon-maskable.svg': { body: iconMaskableSvg, type: 'image/svg+xml; charset=utf-8' },
  'sw.js': { body: swJs, type: 'text/javascript; charset=utf-8' },
}

export const Route = createFileRoute('/decide/$')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const key = params._splat ?? ''
        const file = FILES[key]
        if (!file) return new Response('Not Found', { status: 404 })
        // The worker itself is never cached: it is the thing that decides what
        // else is, and a stale copy would keep deciding with the old rules.
        const cacheControl = key === 'sw.js' ? 'no-cache' : 'public, max-age=300'
        return new Response(file.body, {
          headers: { 'Content-Type': file.type, 'Cache-Control': cacheControl },
        })
      },
    },
  },
})
