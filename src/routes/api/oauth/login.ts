import { createFileRoute } from '@tanstack/react-router'
import { setCookie } from '@tanstack/react-start/server'

const SCOPES = 'openid profile email'

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function randomString(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)))
}

async function challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(new Uint8Array(digest))
}

export const Route = createFileRoute('/api/oauth/login')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const verifier = randomString()
        const state = randomString()
        const nonce = randomString()

        // Lax, not Strict: the browser arrives back from whop.com on a
        // cross-site redirect, and Strict withholds the cookie on exactly that
        // navigation, leaving the callback nothing to verify against.
        const short = {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 600,
        } as const

        // A path on this site and nothing else. `//evil.com` and `/\evil.com`
        // start with a slash but are absolute, so a bare startsWith('/')
        // turns login into an open redirect.
        const wanted = url.searchParams.get('redirect_to') ?? '/'
        setCookie('oauth_return', /^\/(?![/\\])/.test(wanted) ? wanted : '/', short)
        setCookie('oauth_verifier', verifier, short)
        setCookie('oauth_state', state, short)
        setCookie('oauth_nonce', nonce, short)

        const params = new URLSearchParams({
          response_type: 'code',
          client_id: process.env.APP_ID ?? '',
          redirect_uri: `${url.origin}/api/oauth/callback`,
          scope: SCOPES,
          state,
          nonce,
          code_challenge: await challenge(verifier),
          code_challenge_method: 'S256',
        })

        return new Response(null, {
          status: 302,
          headers: { Location: `https://api.whop.com/oauth/authorize?${params}` },
        })
      },
    },
  },
})
