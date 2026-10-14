/*
 * Where "Sign in with Whop" starts and finishes.
 *
 * ONE ADDRESS TO COME BACK TO. Whop only sends people back to a redirect
 * address registered for the app, and answers anything else with "redirect_uri
 * is invalid". Both ends used to build it from whatever host the request
 * happened to arrive on — fine on morsels45-app.whop.site, and broken on every
 * other address Whop can serve this app from (its proxy inside a whop, a
 * preview build). So it is always the registered one, and a sign-in that
 * starts anywhere else is moved there first, so the cookies it sets are on the
 * same site as the callback that reads them. Local development keeps its own
 * origin, which is registered separately.
 */
export const CANONICAL_ORIGIN = 'https://morsels45-app.whop.site'

export function isLocal(url: URL): boolean {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
}

export function oauthOrigin(url: URL): string {
  return isLocal(url) ? url.origin : CANONICAL_ORIGIN
}

/*
 * Where a sign-in was, when it went wrong: which host, whether it was the
 * whole page or a frame, and which kind of app — the Android app (a Median
 * web view), some other in-app browser, or a browser. Nothing about the
 * person. Logged at error level only because that is all the host keeps.
 */
export function signInContext(request: Request) {
  const ua = request.headers.get('user-agent') ?? ''
  let from = ''
  try {
    from = new URL(request.headers.get('referer') ?? '').host
  } catch {}
  return {
    host: new URL(request.url).host,
    from,
    dest: request.headers.get('sec-fetch-dest') ?? '',
    site: request.headers.get('sec-fetch-site') ?? '',
    app: /median/i.test(ua) ? 'android-app' : /; wv\)|FBAN|FBAV|Instagram|Whop/i.test(ua) ? 'in-app-browser' : 'browser',
  }
}

/*
 * Where to send somebody whose sign-in did not finish: back where they
 * started, told so. The game and the account page both explain it in plain
 * words and offer to try again; anywhere else goes to the account page, which
 * does.
 */
export function failedSignIn(returnTo: string | undefined): string {
  const back = returnTo && /^\/(decide|account)(\/|\?|$)/.test(returnTo) ? returnTo : '/account'
  return back + (back.includes('?') ? '&' : '?') + 'signin=failed'
}
