import { createFileRoute } from '@tanstack/react-router'
import { getCookie, setCookie } from '@tanstack/react-start/server'

import { failedSignIn, oauthOrigin, signInContext } from '#/lib/oauth'
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
        const savedReturn = getCookie('oauth_return')
        const returnTo = savedReturn ?? '/'

        for (const name of ['oauth_verifier', 'oauth_state', 'oauth_nonce', 'oauth_return']) {
          setCookie(name, '', { path: '/', maxAge: 0 })
        }

        /*
         * A sign-in that did not finish goes back where it started, saying so
         * (lib/oauth.ts), rather than to the home page with nothing said. And
         * why is written down: Whop refusing, or the cookies from the start
         * missing here — which is what an app that opens Whop's page in a
         * separate browser looks like, the start and the end each with their
         * own cookies.
         */
        const fail = (why: string) => {
          console.error('[oauth] sign-in did not finish:', why, JSON.stringify(signInContext(request)))
          return new Response(null, { status: 302, headers: { Location: failedSignIn(savedReturn), 'Cache-Control': 'no-store' } })
        }

        const refused = url.searchParams.get('error')
        if (refused) return fail(`whop said ${refused}: ${url.searchParams.get('error_description') ?? ''}`.slice(0, 200))

        // Compared before either is used: a missing or mismatched state is a
        // forged callback, not something to retry.
        if (!code || !state) return fail('no code or state in the callback')
        if (!verifier || !expectedState) return fail('the cookies from the start of sign-in are not here')
        if (state !== expectedState) return fail('state does not match')

        const response = await fetch(`${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/oauth/token`, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.APP_ID ?? '',
            code,
            code_verifier: verifier,
            redirect_uri: `${oauthOrigin(url)}/api/oauth/callback`,
          }),
        })

        if (!response.ok) return fail(`token exchange ${response.status}: ${(await response.text()).slice(0, 200)}`)

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
