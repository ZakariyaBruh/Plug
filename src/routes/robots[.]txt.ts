import { createFileRoute } from '@tanstack/react-router'

import { SITE_URL } from '#/lib/site'

/*
 * /robots.txt
 *
 * Nothing here is closed off — the pages that should stay out of an index say
 * so themselves with a noindex tag, which is the instruction that actually
 * works (a Disallow only stops the crawl, so a blocked URL can still be listed
 * on the strength of links to it). What this file is really for is the last
 * line: a sitemap has to be found before it can be read.
 */
const ROBOTS = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(ROBOTS, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        }),
    },
  },
})
