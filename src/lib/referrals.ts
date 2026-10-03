import { db } from '#/lib/db'

/*
 * REFERRAL CREDIT: invite a friend, they sign in and play ten minutes, you
 * get a day of Premium. Two tables, created lazily on first use — there is
 * no migration runner here, and these two did not pre-exist the way
 * feature_usage did (see lib/db.ts).
 *
 * THE CODE IS THE REFERRER'S OWN WHOP USER ID. Not a separate generated code
 * in its own table: a Whop user id (`sub`) is already a stable, hard-to-guess
 * opaque string, and a visitor following `?ref=<id>` learns nothing about
 * that account beyond its existence — which /account already shows anybody
 * signed in as them.
 *
 * ONE CREDIT PER REFERRED PERSON, EVER. `referrals` is keyed by the referred
 * person's own user id, so the same friend cannot be replayed for a second
 * day. Whichever code first created their row is the one honoured even if a
 * later ping arrives with a different one — closing the obvious way to
 * redirect an already-counted friend's credit elsewhere.
 *
 * SELF-REFERRAL IS REFUSED AT THE WRITE, not detected and apologised for:
 * recordPlay never credits a row where referrer and referred are the same
 * id. Two different free accounts belonging to the same person is not
 * something this can detect, and is the same limitation every referral
 * program has.
 */

const QUALIFY_SECONDS = 600 // ten minutes
const BONUS_MS = 24 * 60 * 60 * 1000 // one day, stacked onto whichever is later: now or an existing bonus

let ready: Promise<void> | null = null

// A rejected attempt is never cached — only a successful one — so a single
// transient failure (the schema not existing yet and the write to create it
// timing out, say) does not wedge every call for the rest of this worker
// isolate's life behind one remembered rejection.
function ensureSchema(client: NonNullable<ReturnType<typeof db>>) {
  if (!ready) {
    ready = client
      .batch(
        [
          `create table if not exists referrals (
            referred_id text primary key,
            referrer_id text not null,
            seconds_played integer not null default 0,
            credited integer not null default 0,
            created_at text not null,
            updated_at text not null
          )`,
          `create table if not exists premium_bonus (
            user_id text primary key,
            until text not null
          )`,
        ],
        'write',
      )
      .then(() => undefined)
      .catch((err) => {
        ready = null
        throw err
      })
  }
  return ready
}

/** Whether this user currently has a free-earned Premium bonus active. */
export async function bonusActive(userId: string): Promise<boolean> {
  const client = db()
  if (!client) return false
  try {
    await ensureSchema(client)
    const rs = await client.execute({
      sql: 'select until from premium_bonus where user_id = ?',
      args: [userId],
    })
    const until = rs.rows[0]?.until as string | undefined
    return !!until && Date.parse(until) > Date.now()
  } catch (err) {
    console.error('referrals: bonus read failed', err)
    return false
  }
}

async function extendBonus(client: NonNullable<ReturnType<typeof db>>, userId: string): Promise<void> {
  const current = await client.execute({
    sql: 'select until from premium_bonus where user_id = ?',
    args: [userId],
  })
  const existing = current.rows[0]?.until as string | undefined
  const base = existing && Date.parse(existing) > Date.now() ? Date.parse(existing) : Date.now()
  await client.execute({
    sql: `insert into premium_bonus (user_id, until) values (?, ?)
          on conflict (user_id) do update set until = excluded.until`,
    args: [userId, new Date(base + BONUS_MS).toISOString()],
  })
}

/**
 * One heartbeat from a signed-in, referred visitor: `seconds` more of real
 * play time, under whichever referrer first referred them. Credits that
 * referrer once, the moment this ping is the one that crosses ten minutes.
 */
export async function recordPlay(
  referredId: string,
  code: string,
  seconds: number,
): Promise<{ secondsPlayed: number; qualified: boolean; justQualified: boolean }> {
  const idle = { secondsPlayed: 0, qualified: false, justQualified: false }
  const client = db()
  if (!client || !referredId || !code || referredId === code) return idle

  try {
    await ensureSchema(client)
    const now = new Date().toISOString()

    // Only takes if this is the first time this person has ever been seen —
    // see the note above on why a later, different code never overwrites it.
    await client.execute({
      sql: `insert into referrals (referred_id, referrer_id, seconds_played, credited, created_at, updated_at)
            values (?, ?, 0, 0, ?, ?)
            on conflict (referred_id) do nothing`,
      args: [referredId, code, now, now],
    })

    const updated = await client.execute({
      sql: `update referrals set seconds_played = seconds_played + ?, updated_at = ?
            where referred_id = ?
            returning referrer_id, seconds_played, credited`,
      args: [Math.max(0, Math.round(seconds)), now, referredId],
    })
    const row = updated.rows[0]
    if (!row) return idle

    const secondsPlayed = Number(row.seconds_played) || 0
    const referrerId = String(row.referrer_id)
    const qualified = secondsPlayed >= QUALIFY_SECONDS
    let justQualified = false

    if (qualified && Number(row.credited) !== 1 && referrerId !== referredId) {
      await client.execute({
        sql: 'update referrals set credited = 1 where referred_id = ?',
        args: [referredId],
      })
      await extendBonus(client, referrerId)
      justQualified = true
    }

    return { secondsPlayed, qualified, justQualified }
  } catch (err) {
    console.error('referrals: play record failed', err)
    return idle
  }
}

/** For /account: how this person's own invite code has done. */
export async function referralStats(
  userId: string,
): Promise<{ invited: number; qualified: number; bonusUntil: string | null }> {
  const empty = { invited: 0, qualified: 0, bonusUntil: null }
  const client = db()
  if (!client) return empty
  try {
    await ensureSchema(client)
    const counts = await client.execute({
      sql: 'select count(*) as invited, coalesce(sum(credited), 0) as qualified from referrals where referrer_id = ?',
      args: [userId],
    })
    const row = counts.rows[0]
    const bonus = await client.execute({
      sql: 'select until from premium_bonus where user_id = ?',
      args: [userId],
    })
    const until = bonus.rows[0]?.until as string | undefined
    return {
      invited: Number(row?.invited ?? 0),
      qualified: Number(row?.qualified ?? 0),
      bonusUntil: until && Date.parse(until) > Date.now() ? until : null,
    }
  } catch (err) {
    console.error('referrals: stats read failed', err)
    return empty
  }
}
