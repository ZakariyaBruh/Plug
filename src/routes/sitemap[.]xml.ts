import { createFileRoute } from '@tanstack/react-router'

import { ALL_DISHES } from '#/lib/dishes'
import { SITE_URL } from '#/lib/site'

/*
 * /sitemap.xml
 *
 * Until now this path returned the app shell as a 200 — an HTML page where a
 * crawler asked for XML, which is worse than a 404 because it looks like an
 * answer. The pages worth finding are the four that explain the product, the
 * game itself, and one per dish: 112 pages that each answer a question
 * somebody actually types.
 *
 * The private pages (account, checkout, order-complete) are deliberately not
 * here; they carry noindex and belong to one person mid-purchase.
 */
const PAGES: Array<[path: string, priority: string]> = [
  ['/', '1.0'],
  ['/decide/', '0.9'],
  ['/premium', '0.8'],
  ['/how-it-works', '0.7'],
  ['/faq', '0.6'],
]

// Injected by vite at build time — see vite.config.ts.
declare const __BUILT_AT__: string

/*
 * <lastmod> is the only honest lever left for asking to be recrawled. Google
 * retired the sitemap ping endpoint, so what is left is telling the truth
 * about when a page changed and being believed — and being believed is the
 * hard part. A lastmod that reads "just now" every time it is fetched is
 * noise, and a sitemap that behaves that way gets its dates ignored
 * altogether. This one is the build time: it moves when a deploy actually
 * changes the pages, and not otherwise.
 */
const LASTMOD = __BUILT_AT__

function urlEntry(path: string, priority: string) {
  return `  <url><loc>${SITE_URL}${path}</loc><lastmod>${LASTMOD}</lastmod>` +
    `<priority>${priority}</priority></url>`
}

function sitemap() {
  const entries = [
    ...PAGES.map(([path, priority]) => urlEntry(path, priority)),
    ...ALL_DISHES.map((dish) => urlEntry(`/eat/${dish.slug}`, '0.4')),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        new Response(sitemap(), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        }),
    },
  },
})
