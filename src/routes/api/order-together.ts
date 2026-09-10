import { createFileRoute } from '@tanstack/react-router'

import { checkProductAccess } from '#/lib/session'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'

/*
 * The shared browser — one Chromium, somewhere else, that two people drive at
 * once, opened on whatever the dish in hand calls for.
 *
 * Four destinations share this one machine, because the difference between
 * them is a search string and nothing else: ordering the dish you landed on,
 * cooking along with a video from two kitchens, filling one shopping basket
 * between you, and ordering from a particular place you picked in Nearby.
 *
 * The game answers "what should we eat"; it has never had an answer to "right,
 * so how do we get it". Maps-near-me is one tab on one phone, which is fine
 * alone and useless for two people: whoever is holding the phone does the
 * ordering and the other one reads over their shoulder. This is one browser
 * that both of them drive, from their own devices, with one cursor each — the
 * natural end of Together mode, where two people have just agreed on a dish
 * and now have to agree on where to get it from.
 *
 * Hyperbeam runs the browser. The key that starts one is a live secret and
 * lives in the app's secret store, injected as an env binding at runtime; it
 * is read here and nowhere else, and never leaves the worker. What the browser
 * gets back is the embed URL and nothing else — in particular not the admin
 * token, which can terminate the session and is kept server-side.
 *
 * Sessions cost real money for as long as they are up, so:
 *   - only subscribers can start one,
 *   - closing the panel ends it (DELETE below),
 *   - so does closing the tab, which is why POST also takes a { close } from
 *     navigator.sendBeacon — the one request a page can still make on its way
 *     out, and it can only POST, and
 *   - the session timeout is the backstop for the times neither arrives:
 *     one minute after the last person disconnects, it stops on its own.
 */

const ENGINE = 'https://engine.hyperbeam.com/v0/vm'

/*
 * TWO LIMITS THAT HAVE NOTHING TO DO WITH WHO IS PAYING.
 *
 * This is the only thing in the app that bills by the minute, and a Premium
 * subscription is not a licence to run up an unbounded bill — a tab left open
 * on a forgotten phone costs exactly as much as one somebody is using.
 *
 * SESSION_MAX is a hard stop enforced by Hyperbeam rather than by the page, so
 * no session can outlive it however the browser behaves. Two hours is far
 * longer than anybody sits in one of these on purpose and far shorter than a
 * tab left open overnight. Proved rather than assumed: a session created with
 * a sixty-second cap was alive at forty-five seconds and gone at sixty.
 *
 * The start limit is the second one, and it is per address rather than per
 * account because it guards against a loop rather than against a person. Same
 * in-memory caveat as everywhere else here: it stops the obvious case and
 * would not survive a flood spread across isolates, because this worker has no
 * KV binding to count in.
 */
const SESSION_MAX = 2 * 60 * 60
const START_WINDOW_MS = 10 * 60_000
const STARTS_PER_WINDOW = 6
const starts = new Map<string, { n: number; until: number }>()

function tooManyStarts(who: string): boolean {
  const now = Date.now()
  if (starts.size > 5000) {
    for (const [key, hit] of starts) if (hit.until < now) starts.delete(key)
  }
  const hit = starts.get(who)
  if (!hit || hit.until < now) {
    starts.set(who, { n: 1, until: now + START_WINDOW_MS })
    return false
  }
  hit.n += 1
  return hit.n > STARTS_PER_WINDOW
}

/*
 * Four things two people might want to do about a dish — or, in the last case,
 * about a place — and where each one opens.
 *
 * Searches rather than one company's site throughout: which supermarket, which
 * delivery app and whose recipe are all local questions, and picking one on
 * somebody's behalf answers them wrong nearly everywhere.
 */
const KINDS = {
  // After a verdict: get it brought to you.
  order: {
    label: 'Order it together',
    query: (dish: string) => `${dish} delivery near me`,
  },
  // In cook mode: two kitchens, one video, and Hyperbeam keeps playback in
  // step, so "wait, go back" means the same frame for both of you.
  cook: {
    label: 'Cook along',
    query: (dish: string) => `how to make ${dish} recipe video`,
  },
  // With the shopping list open: one basket, filled by both of you.
  shop: {
    label: 'Shop the list together',
    query: (dish: string) => `${dish} ingredients grocery delivery`,
  },
  // From Nearby: the place is already chosen, so this is not "look at it
  // together" — it opens on that place's own ordering, which is the thing you
  // actually wanted to do about it. "order online" rather than a delivery app
  // by name: which app a place is on is a local question, and picking one on
  // somebody's behalf answers it wrong nearly everywhere.
  venue: {
    label: 'Order from here',
    query: (name: string) => `${name} order online delivery`,
  },
} as const

type Kind = keyof typeof KINDS

function isKind(value: unknown): value is Kind {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(KINDS, value)
}

function startUrl(kind: Kind, dish: string) {
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(KINDS[kind].query(dish))
}

/*
 * The shape of the browser that gets started.
 *
 * It was 1280x720 for everybody, which is a desktop window. Shown on a phone
 * held upright that is a wide strip letterboxed into a tall panel: the text is
 * too small to read, the links are too small to hit, and the whole thing reads
 * as broken rather than as the wrong aspect ratio. The browser can be any
 * shape, so the page says what shape the space is and this decides whether to
 * believe it.
 *
 * Bounded hard, because these are the dimensions of something that costs money
 * to run and the numbers arrive from a browser. Rounded to even numbers: video
 * encoders subsample chroma in 2x2 blocks and an odd dimension is a class of
 * bug nobody wants to go looking for.
 */
const DEFAULT_SIZE = { width: 1280, height: 720 }
const MIN_W = 640
const MIN_H = 480
const MAX_W = 1920
const MAX_H = 1080

function sizeFrom(value: unknown) {
  if (!value || typeof value !== 'object') return DEFAULT_SIZE
  const asked = value as { w?: unknown; h?: unknown }
  const w = asked.w
  const h = asked.h
  if (typeof w !== 'number' || typeof h !== 'number') return DEFAULT_SIZE
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) return DEFAULT_SIZE

  /*
   * SCALED, NOT CLAMPED PER AXIS, which is the whole point and easy to get
   * wrong: a phone asking for 366x581 clamped axis by axis comes out 640x582,
   * a shape nobody's screen is, and the browser inside it is stretched to fit
   * — which looks exactly like the letterboxing this was meant to end.
   * Growing it until it clears both floors, then shrinking if it breaks a
   * ceiling, keeps the proportions somebody is actually holding.
   */
  const up = Math.max(1, MIN_W / w, MIN_H / h)
  const grown = { w: w * up, h: h * up }
  const down = Math.min(1, MAX_W / grown.w, MAX_H / grown.h)

  // The last clamp is for shapes so extreme that no single scale satisfies all
  // four bounds — a very tall, very narrow window. The proportions lose, since
  // the bounds are what Hyperbeam and the bill can actually take.
  const even = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, Math.round(n / 2) * 2))

  return {
    width: even(grown.w * down, MIN_W, MAX_W),
    height: even(grown.h * down, MIN_H, MAX_H),
  }
}

// The nearest of Hyperbeam's three regions, so the stream does not cross an
// ocean before it reaches whoever is ordering. Cloudflare puts the visitor's
// country in front of us for free; anything unrecognised takes the default.
const EU = new Set(['GB','IE','FR','DE','ES','PT','IT','NL','BE','LU','DK','SE','NO','FI','IS','PL','CZ','SK','AT','CH','HU','RO','BG','GR','HR','SI','EE','LV','LT','MT','CY','UA','RS','BA','AL','MK','ME','MD','TR','IL','AE','SA','QA','KW','BH','OM','EG','MA','TN','DZ','ZA','NG','KE','GH'])
const AS = new Set(['IN','PK','BD','LK','NP','CN','HK','TW','JP','KR','SG','MY','TH','VN','PH','ID','AU','NZ','KZ','UZ'])

function regionFor(country: string | null) {
  if (!country) return 'EU'
  if (EU.has(country)) return 'EU'
  if (AS.has(country)) return 'AS'
  return 'NA'
}

// Ending one, from either door. The id is checked against the shape Hyperbeam
// issues before it is put in a URL — this string arrives from a browser.
async function endSession(key: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'bad_session' }, 400)
  const ended = await fetch(`${ENGINE}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${key}` },
  }).catch(() => null)
  return json({ ended: !!ended?.ok })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export const Route = createFileRoute('/api/order-together')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.HYPERBEAM_API_KEY
        if (!key) {
          console.error('order-together: HYPERBEAM_API_KEY is not set')
          return json({ error: 'unavailable' }, 503)
        }

        let dish = ''
        let kind: Kind = 'order'
        let closing = ''
        let size = DEFAULT_SIZE
        try {
          const body = (await request.json()) as {
            dish?: unknown
            kind?: unknown
            close?: unknown
            size?: unknown
          }
          if (typeof body?.dish === 'string') dish = body.dish.slice(0, 80).trim()
          if (isKind(body?.kind)) kind = body.kind
          if (typeof body?.close === 'string') closing = body.close
          size = sizeFrom(body?.size)
        } catch {
          // A missing or unreadable body just means we open on a plain search.
        }

        // A closing beacon, not a request for a new browser. navigator
        // .sendBeacon is the only thing a page can send while it is being
        // closed that the browser promises to deliver, and it can only POST —
        // so ending a session has to be possible here as well as on DELETE.
        //
        // DELIBERATELY BEFORE THE PREMIUM CHECK, which is the one place in this
        // file that is not gated. This app is served inside Whop's frame, so
        // its cookies are third-party: a browser that blocks those — Safari
        // always, and Chrome increasingly — sends the closing beacon with no
        // session attached. Gating this would turn every such close into a 403
        // and leave the browser running, billing, until the idle timeout. The
        // thing being asked for is "stop spending my money", the id is a v4
        // UUID nobody can guess, and the worst an attacker with one could do is
        // end a session early. Refusing it is the expensive mistake.
        if (closing) return endSession(key, closing)

        // Premium, and only Premium. This is the one thing here that costs real
        // money per minute somebody is using it, so it is the one thing the
        // subscription actually buys rather than merely unlocks.
        const { signedIn, hasAccess } = await checkProductAccess(PREMIUM_PRODUCT_ID)
        if (!hasAccess) {
          return json({ error: signedIn ? 'premium_required' : 'sign_in_required' }, 403)
        }
        if (tooManyStarts(request.headers.get('cf-connecting-ip') ?? 'unknown')) {
          return json({ error: 'too_fast' }, 429)
        }

        const create = (shape: { width: number; height: number }) =>
          fetch(ENGINE, {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              start_url: startUrl(kind, dish || 'food'),
              width: shape.width,
              height: shape.height,
              /*
               * `offline` is the backstop for a tab that vanished without
               * saying so: short, because this bills for as long as it is up
               * whether or not anybody is looking. `absolute` is the hard stop
               * that no browser can talk its way out of.
               *
               * BOTH GO IN THIS ONE OBJECT. Sending the older offline_timeout
               * field alongside a timeout object is rejected outright with a
               * 400, which is how the first version of this failed every time.
               */
              timeout: { absolute: SESSION_MAX, offline: 60 },
              region: regionFor(request.headers.get('cf-ipcountry')),
              // The app refuses ad formats that misbehave in its own pages; a
              // browser it opens on somebody's behalf gets the same treatment.
              ublock: true,
            }),
          }).catch(() => null)

        let made = await create(size)

        // A shape Hyperbeam will not run is a bad reason to have no browser at
        // all. If a size taken from somebody's phone is refused, the desktop
        // default is tried once — a letterboxed browser beats none, and the
        // refusal is logged so an unhappy shape can be found rather than
        // silently absorbed forever.
        if (made?.status === 400 && (size.width !== DEFAULT_SIZE.width || size.height !== DEFAULT_SIZE.height)) {
          console.error('order-together: hyperbeam refused', size.width + 'x' + size.height)
          made = await create(DEFAULT_SIZE)
        }

        if (!made?.ok) {
          console.error('order-together: hyperbeam refused', made?.status ?? 'network error')
          return json({ error: 'unavailable' }, 502)
        }

        const session = (await made.json()) as {
          session_id?: string
          embed_url?: string
          admin_token?: string
        }
        if (!session.embed_url || !session.session_id) {
          console.error('order-together: hyperbeam returned no session')
          return json({ error: 'unavailable' }, 502)
        }

        // admin_token is deliberately not in this response: it ends the
        // session, and the browser has no business being able to do that to
        // anybody's but its own — which the DELETE below already handles.
        return json({ embedUrl: session.embed_url, sessionId: session.session_id })
      },

      // Closing the panel ends the session rather than leaving it to time out,
      // because an idle shared browser bills exactly like a used one. Ungated
      // for the same reason as the closing branch of POST above.
      DELETE: async ({ request }) => {
        const key = process.env.HYPERBEAM_API_KEY
        if (!key) return json({ error: 'unavailable' }, 503)

        return endSession(key, new URL(request.url).searchParams.get('session') ?? '')
      },
    },
  },
})
