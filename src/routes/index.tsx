import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PageShell } from '#/components/PageShell'
import { loadViewer } from '#/lib/viewer'
import { JsonLd } from '#/components/JsonLd'
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_URL, pageHead, track } from '#/lib/site'

export const Route = createFileRoute('/')({
  loader: () => loadViewer(),
  head: () => ({
    ...pageHead({
      path: '/',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    }),
    meta: [
      ...(pageHead({
        path: '/',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
      }).meta || []),
      {
        name: '8c05a9c7e728a9bdcd859b116fa7b4d7c713ac2c',
        content: '8c05a9c7e728a9bdcd859b116fa7b4d7c713ac2c',
      },
    ],
  }),
  component: HomePage,
})

const SITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
}

function HomePage() {
  const viewer = Route.useLoaderData()

  useEffect(() => {
    track('view_content', { page: 'home' })
  }, [])

  return (
    <PageShell user={viewer.user}>
      <JsonLd data={SITE_SCHEMA} />
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% -10%, #e0a34014, transparent 60%)',
            }}
          />
          <div className="relative mx-auto max-w-3xl px-6 pt-16 pb-24 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
              morsels45
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">
              Hungry?
              <br />
              <em className="font-semibold text-[var(--amber)]">Let&rsquo;s decide.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-[var(--text-dim)]">
              Answer a few quick questions. Get one answer. If it&rsquo;s not quite right, point me the way you want and I&rsquo;ll answer again.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/decide/"
                onClick={() => track('go_to_game', { from: 'home' })}
                className="rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
              >
                Start playing
              </a>
              <Link
                to="/info"
                className="text-sm text-[var(--amber)] underline underline-offset-4 hover:text-[var(--amber-dark)]"
              >
                Learn more
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  )
}
