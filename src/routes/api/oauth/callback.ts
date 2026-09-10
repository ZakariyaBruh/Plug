import { createFileRoute } from '@tanstack/react-router'
import { getCookie, setCookie } from '@tanstack/react-start/server'

import { writeSession } from '#/lib/session'

export const Route = createFileRoute('/api/oauth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const verifier = getCookie('oauth_verifier')
        const expectedState = getCookie('oauth_state')
        const returnTo = getCookie('oauth_return') ?? '/'

        for (const name of ['oauth_verifier', 'oauth_state', 'oauth_nonce', 'oauth_return']) {
          setCookie(name, '', { path: '/', maxAge: 0 })
        }

        // Compared before either is used: a missing or mismatched state is a
        // forged callback, not something to retry.
        if (!code || !state || !verifier || state !== expectedState) {
          return new Response(null, {
            status: 302,
            headers: { Location: '/?error=auth_failed' },
          })
        }

        const response = await fetch(`${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/oauth/token`, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.APP_ID ?? '',
            code,
            code_verifier: verifier,
            redirect_uri: `${url.origin}/api/oauth/callback`,
          }),
        })

        if (!response.ok) {
          console.error('[oauth] token exchange failed', response.status, await response.text())
          return new Response(null, {
            status: 302,
            headers: { Location: '/?error=auth_failed' },
          })
        }

        const token = (await response.json()) as {
          access_token: string
          refresh_token: string
          expires_in: number
        }

        writeSession(token)

        // returnTo came from our own httpOnly cookie, which login already
        // checked — nothing between the two could have rewritten it.
        return new Response(null, { status: 302, headers: { Location: returnTo } })
      },
    },
  },
})
