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
import tasteJs from '../../../public/decide/js/taste.js?raw'
import manifestJson from '../../../public/decide/manifest.webmanifest?raw'
import iconSvg from '../../../public/decide/icon.svg?raw'
import iconMaskableSvg from '../../../public/decide/icon-maskable.svg?raw'
import swJsRaw from '../../../public/decide/sw.js?raw'

/*
 * A build id for the service worker's cache name.
 *
 * The stamping that matters happens at build time, in vite.config.ts: the host
 * serves public/decide/** from its own static asset layer, so the copy people
 * actually get never passes through this file. This is the fallback for the
 * case this route exists to cover at all — the static layer missing — so that
 * a worker served from here is versioned too rather than shipping the literal
 * placeholder.
 *
 * A plain FNV-1a over the concatenated sources. It is not a security hash and
 * does not need to be one: it needs to change when the bytes change, be cheap
 * enough to run at startup, and be the same for every instance of one build.
 */
function buildId(...sources: string[]) {
  let hash = 0x811c9dc5
  for (const source of sources) {
    for (let i = 0; i < source.length; i++) {
      hash ^= source.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
  }
  return hash.toString(36)
}

const BUILD = buildId(
  indexHtml, stylesCss, appJs, confettiJs, configJs, dataJs, engineJs, flavorJs,
  mapviewJs, placesJs, premiumJs, progressJs, recipesJs, soundJs, tasteJs,
  manifestJson, iconSvg, iconMaskableSvg, swJsRaw,
)

const swJs = swJsRaw.replace('__BUILD__', BUILD)

const FILES: Record<string, { body: string; type: string }> = {
  '': { body: indexHtml, type: 'text/html; charset=utf-8' },
  'index.html': { body: indexHtml, type: 'text/html; charset=utf-8' },
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
