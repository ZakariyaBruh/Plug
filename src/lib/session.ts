import { getCookie, setCookie } from '@tanstack/react-start/server'

const COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
} as const

type Token = {
  access_token: string
  refresh_token: string
  expires_in: number
}

/** The only place either session cookie is written. */
export function writeSession(token: Token) {
  setCookie('wa', token.access_token, { ...COOKIE, maxAge: token.expires_in })
  setCookie('wr', token.refresh_token, { ...COOKIE, maxAge: 60 * 60 * 24 * 30 })
}

/** Same attributes as the write, so the browser matches and drops them. */
export function clearSession() {
  for (const name of ['wa', 'wr']) setCookie(name, '', { ...COOKIE, maxAge: 0 })
}

type UserInfo = {
  sub: string
  name?: string
  preferred_username?: string
  picture?: string
  email?: string
  email_verified?: boolean
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getCookie('wr')
  if (!refreshToken) return null

  const response = await fetch(`${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.APP_ID ?? '',
      refresh_token: refreshToken,
    }),
  })
  if (!response.ok) return null

  const token = (await response.json()) as Token
  writeSession(token)
  return token.access_token
}

async function fetchUserinfo(accessToken: string): Promise<UserInfo | null> {
  const response = await fetch(`${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/oauth/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Keeps the header above: otherwise the platform replaces it and answers
      // for the company rather than this visitor.
      'x-whop-inject-key': 'none',
    },
  })
  if (!response.ok) return null
  return (await response.json()) as UserInfo
}

/** The signed-in visitor, or null. Refreshes once if the token has expired. */
export async function currentUser(): Promise<UserInfo | null> {
  let accessToken = getCookie('wa')
  if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined
  if (!accessToken) return null

  const profile = await fetchUserinfo(accessToken)
  if (profile) return profile

  const retried = await refreshAccessToken()
  return retried ? await fetchUserinfo(retried) : null
}

export async function accessLevel(userId: string, resourceId: string) {
  const response = await fetch(
    `${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/api/v1/users/${userId}/access/${resourceId}`,
  )
  if (!response.ok) return { has_access: false, access_level: 'no_access' as const }
  return (await response.json()) as { has_access: boolean; access_level: 'no_access' | 'customer' | 'admin' }
}

/** Whether the signed-in visitor already owns a product — no license key involved. */
export async function checkProductAccess(productId: string) {
  const user = await currentUser()
  if (!user) return { signedIn: false as const, hasAccess: false as const, user: null }

  const { has_access } = await accessLevel(user.sub, productId)
  return { signedIn: true as const, hasAccess: has_access, user }
}

/*
 * The same access question, asked about a user id rather than about whoever
 * owns the cookie. Exists for the iframe: in there the cookie is a
 * third-party cookie and may never arrive, so the visitor is identified from
 * Whop's signed header instead (see lib/whop-token.ts) and only the id is in
 * hand — there is no OAuth token to call /oauth/userinfo with.
 *
 * The display name is a nicety and is fetched separately, so a failure there
 * costs a greeting and never the answer about access.
 */
export async function checkProductAccessFor(userId: string, productId: string) {
  const { has_access } = await accessLevel(userId, productId)
  return { signedIn: true as const, hasAccess: has_access }
}

/** Best-effort display name for a user id. Empty string if anything goes wrong. */
export async function usernameFor(userId: string): Promise<string> {
  const key = process.env.WHOP_API_KEY
  if (!key) return ''
  try {
    const response = await fetch(
      `${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/api/v1/users/${userId}`,
      { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } },
    )
    if (!response.ok) return ''
    const user = (await response.json()) as { username?: string; name?: string }
    return user.username ?? user.name ?? ''
  } catch {
    return ''
  }
}
