import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { SITE_DESCRIPTION, SITE_TITLE, WHOP_PIXEL } from '#/lib/site'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      // Only the fallback, for anything rendered without a route of its own —
      // the not-found page. Every real page builds its own card with pageHead(),
      // which is also where og:url and the canonical link come from; leaving a
      // second set here would have every page claiming to be the homepage.
      {
        title: SITE_TITLE,
      },
      {
        name: 'description',
        content: SITE_DESCRIPTION,
      },
      // Without these, an icon added to the Home Screen on iOS opens in a
      // normal Safari view with the address bar. iOS 16.4 and later reads
      // display:standalone from the manifest, but older iOS needs the apple-
      // names, and an old phone is exactly the case this has to work for.
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'morsels45' },
      // Opaque, not translucent: nothing here reserves the safe area, and
      // translucent would put the top of the page under the clock.
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
      {
        name: 'google-site-verification',
        content: 'YT-zbWsGz2AoR70Rw4I3Ur9lvRcoa-4O4xGqDsnkkR0',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      // The favicon used to be the wordmark image — the full "🍴 morsels45"
      // banner — shrunk into a tab-sized square, which is illegible at that
      // size. icon.svg is the "45" mark, drawn to survive exactly that shrink.
      //
      // The SVG is for browsers, which prefer it and scale it perfectly. The
      // PNGs are for everything that does not: Google's favicon pipeline wants
      // a square raster at a multiple of 48px and takes whichever it finds on
      // the homepage for the whole site, and iOS wants a 180px PNG for a
      // home-screen icon. An SVG-only site gives both of them nothing to use.
      { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
      { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/icon-48.png' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/icon-96.png' },
      { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/icon-180.png' },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <Link to="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
            morsels45
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 text-center fade-in-up">
        <div>
          <h1 className="text-3xl font-bold">That page is not here</h1>
          <p className="mt-3 text-[var(--text-dim)]">The game still is.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/decide/"
              className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              Play
            </a>
            <Link to="/" className="text-sm text-[var(--amber)] underline underline-offset-4">
              Back home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* The Whop pixel, in the head of every page on the marketing site.
            Every conversion number Whop reports about an ad is attributed by
            this and not by the ad network, so without it a campaign reports
            zero however well it does. The game at /decide/ is a separate
            static app and carries its own copy. */}
        <script dangerouslySetInnerHTML={{ __html: WHOP_PIXEL }} />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
