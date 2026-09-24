import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect } from 'react'

import { CLARITY_ID, GA4_ID, GA4_ON, REPLAY_ON, SITE_DESCRIPTION, SITE_TITLE } from '#/lib/site'
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
      /*
       * The font, asked for from here rather than through an @import at the
       * top of styles.css — see the comment there. The preconnects matter more
       * than they look: Google serves the stylesheet from one host and the
       * font file from another, and opening both connections while this
       * document is still arriving takes a DNS lookup, a TCP handshake and a
       * TLS handshake off the front of the first paint. crossOrigin is
       * required on the gstatic one, and it is what makes the preconnect
       * actually get reused rather than thrown away.
       */
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;500;600;700;800&display=swap',
      },
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
  useEffect(() => {
    const initializeAdvisor = async () => {
      try {
        const advisorConfig = await fetch('/advisor.txt').then((res) => res.text())
        if (advisorConfig) {
          window.__ADVISOR_TOKEN__ = advisorConfig.trim()
        }
      } catch (error) {
        console.warn('Advisor configuration not loaded')
      }
    }

    initializeAdvisor()
  }, [])

  return (
    <html lang="en">
      {/* No Whop pixel here: the host injects one into every response at
          request time, already scoped and already tracking page views. See
          the note in public/decide/index.html. */}
      <head>
        <HeadContent />
        {/*
          SESSION REPLAY, ONLY WHILE IT IS SWITCHED ON.
          One constant in lib/site.ts decides whether this script exists,
          whether Clarity is listed on the privacy page, and whether that page
          says replay is running. Empty id, no script, no claim. See the long
          note over CLARITY_ID for why they are tied together.
        */}
        {REPLAY_ON ? (
          <script
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html:
                `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};` +
                `t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;` +
                `y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);` +
                `})(window,document,"clarity","script",${JSON.stringify(CLARITY_ID)});`,
            }}
          />
        ) : null}
        {/*
          GOOGLE ANALYTICS 4, ONLY WHILE IT IS SWITCHED ON.
          Same arrangement as the replay tag above and for the same reason:
          one constant in lib/site.ts decides whether this exists, whether
          the funnel events are mirrored to it, whether Google Analytics is
          named on the privacy page, and what that page's tracking card says.
          Empty id, no script, no claim. See the long note over GA4_ID.

          `send_page_view` is left on, which is the whole of what GA gets for
          free here; everything else it learns is an event this app decided
          to send. See track() in lib/site.ts.
        */}
        {GA4_ON ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} />
            <script
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html:
                  `window.dataLayer=window.dataLayer||[];` +
                  `function gtag(){dataLayer.push(arguments);}` +
                  `gtag('js',new Date());` +
                  `gtag('config',${JSON.stringify(GA4_ID)},{anonymize_ip:true});`,
              }}
            />
          </>
        ) : null}
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
