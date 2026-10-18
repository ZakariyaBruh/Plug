import { db, today } from '#/lib/db'

/*
 * WHAT THE HUB KEEPS, AND AGAINST WHOM.
 *
 *   planner_weeks    one row per account per week: the meal-prep calendar,
 *                    plus which shopping-list lines are ticked. JSON, because
 *                    the page owns its shape and the server only stores it.
 *   cookbook         one row per saved recipe per account (Premium).
 *   hub_usage        how many AI requests an account made today, per
 *                    feature, so one account cannot run up the bill. Rows
 *                    from earlier days are swept as new ones are written.
 *   hub_cache        shared answers that are the same for everybody —
 *                    a dish's nutrition estimate, the day's news briefing —
 *                    keyed by what was asked, never by who.
 *
 * Every one of these is on the privacy page. Keyed on the Whop user id, which
 * is what "follows you between devices" means.
 */
let ready: Promise<void> | null = null

async function client() {
  const c = db()
  if (!c) return null
  if (!ready) {
    ready = c
      .batch(
        [
          `create table if not exists planner_weeks (
            user_id text not null,
            week text not null,
            data text not null,
            updated_at text not null,
            primary key (user_id, week)
          )`,
          `create table if not exists cookbook (
            user_id text not null,
            id text not null,
            data text not null,
            created_at text not null,
            updated_at text not null,
            primary key (user_id, id)
          )`,
          `create table if not exists hub_usage (
            user_id text not null,
            feature text not null,
            day text not null,
            used integer not null,
            primary key (user_id, feature, day)
          )`,
          `create table if not exists hub_cache (
            key text primary key,
            data text not null,
            expires_at integer not null
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
  await ready
  return c
}

/* ---------------------------------------------------------- planner -- */

export async function readWeek(userId: string, week: string): Promise<unknown | null> {
  const c = await client()
  if (!c) return null
  const rs = await c.execute({ sql: 'select data from planner_weeks where user_id = ? and week = ?', args: [userId, week] })
  if (!rs.rows.length) return null
  try {
    return JSON.parse(String(rs.rows[0].data))
  } catch {
    return null
  }
}

export async function writeWeek(userId: string, week: string, data: unknown): Promise<boolean> {
  const c = await client()
  if (!c) return false
  await c.execute({
    sql: `insert into planner_weeks (user_id, week, data, updated_at) values (?, ?, ?, ?)
          on conflict (user_id, week) do update set data = excluded.data, updated_at = excluded.updated_at`,
    args: [userId, week, JSON.stringify(data), new Date().toISOString()],
  })
  return true
}

/* --------------------------------------------------------- cookbook -- */

export const COOKBOOK_MAX = 200

export async function listCookbook(userId: string): Promise<unknown[] | null> {
  const c = await client()
  if (!c) return null
  const rs = await c.execute({
    sql: 'select data from cookbook where user_id = ? order by updated_at desc limit ?',
    args: [userId, COOKBOOK_MAX],
  })
  return rs.rows.flatMap((row) => {
    try {
      return [JSON.parse(String(row.data))]
    } catch {
      return []
    }
  })
}

export async function countCookbook(userId: string): Promise<number> {
  const c = await client()
  if (!c) return 0
  const rs = await c.execute({ sql: 'select count(*) as n from cookbook where user_id = ?', args: [userId] })
  return Number(rs.rows[0]?.n ?? 0)
}

export async function saveCookbook(userId: string, id: string, data: unknown): Promise<boolean> {
  const c = await client()
  if (!c) return false
  const now = new Date().toISOString()
  await c.execute({
    sql: `insert into cookbook (user_id, id, data, created_at, updated_at) values (?, ?, ?, ?, ?)
          on conflict (user_id, id) do update set data = excluded.data, updated_at = excluded.updated_at`,
    args: [userId, id, JSON.stringify(data), now, now],
  })
  return true
}

export async function deleteCookbook(userId: string, id: string): Promise<boolean> {
  const c = await client()
  if (!c) return false
  await c.execute({ sql: 'delete from cookbook where user_id = ? and id = ?', args: [userId, id] })
  return true
}

/* ------------------------------------------------------------ usage -- */

/*
 * One more AI request today for this account and feature, if it is still
 * under the limit. Answers true when it may go ahead. A ledger that cannot be
 * reached lets it through: refusing everybody for our outage is worse than a
 * few unmetered requests.
 */
export async function takeAllowance(userId: string, feature: string, perDay: number): Promise<boolean> {
  const c = await client().catch(() => null)
  if (!c) return true
  const day = today()
  try {
    const rs = await c.execute({
      sql: 'select used from hub_usage where user_id = ? and feature = ? and day = ?',
      args: [userId, feature, day],
    })
    const used = rs.rows.length ? Number(rs.rows[0].used) || 0 : 0
    if (used >= perDay) return false
    await c.batch(
      [
        {
          sql: `insert into hub_usage (user_id, feature, day, used) values (?, ?, ?, 1)
                on conflict (user_id, feature, day) do update set used = used + 1`,
          args: [userId, feature, day],
        },
        { sql: 'delete from hub_usage where day < ?', args: [day] },
      ],
      'write',
    )
    return true
  } catch (err) {
    console.error('hub: usage ledger failed', err)
    return true
  }
}

/*
 * The same ledger read and written without a limit attached, for a feature
 * that shows the count (the assistant's three free questions) rather than
 * only refusing past it. Both answer null when the ledger cannot be reached,
 * which callers treat as "not counting" and never as "none left".
 */
export async function usageToday(userId: string, feature: string): Promise<number | null> {
  const c = await client().catch(() => null)
  if (!c) return null
  try {
    const rs = await c.execute({
      sql: 'select used from hub_usage where user_id = ? and feature = ? and day = ?',
      args: [userId, feature, today()],
    })
    return rs.rows.length ? Number(rs.rows[0].used) || 0 : 0
  } catch (err) {
    console.error('hub: usage read failed', err)
    return null
  }
}

export async function spendOne(userId: string, feature: string): Promise<number | null> {
  const c = await client().catch(() => null)
  if (!c) return null
  const day = today()
  try {
    const [rs] = await c.batch(
      [
        {
          sql: `insert into hub_usage (user_id, feature, day, used) values (?, ?, ?, 1)
                on conflict (user_id, feature, day) do update set used = used + 1
                returning used`,
          args: [userId, feature, day],
        },
        { sql: 'delete from hub_usage where day < ?', args: [day] },
      ],
      'write',
    )
    return rs.rows.length ? Number(rs.rows[0].used) || 0 : null
  } catch (err) {
    console.error('hub: usage write failed', err)
    return null
  }
}

/* ------------------------------------------------------------ cache -- */

export async function cacheGet<T>(key: string): Promise<T | null> {
  const c = await client().catch(() => null)
  if (!c) return null
  try {
    const rs = await c.execute({ sql: 'select data, expires_at from hub_cache where key = ?', args: [key] })
    if (!rs.rows.length || Number(rs.rows[0].expires_at) < Date.now()) return null
    return JSON.parse(String(rs.rows[0].data)) as T
  } catch {
    return null
  }
}

export async function cacheGetMany<T>(keys: string[]): Promise<Map<string, T>> {
  const out = new Map<string, T>()
  const c = await client().catch(() => null)
  if (!c || !keys.length) return out
  try {
    const rs = await c.execute({
      sql: `select key, data, expires_at from hub_cache where key in (${keys.map(() => '?').join(',')})`,
      args: keys,
    })
    for (const row of rs.rows) {
      if (Number(row.expires_at) < Date.now()) continue
      try {
        out.set(String(row.key), JSON.parse(String(row.data)) as T)
      } catch {}
    }
  } catch {}
  return out
}

export async function cachePut(key: string, data: unknown, ttlMs: number): Promise<void> {
  const c = await client().catch(() => null)
  if (!c) return
  try {
    await c.execute({
      sql: `insert into hub_cache (key, data, expires_at) values (?, ?, ?)
            on conflict (key) do update set data = excluded.data, expires_at = excluded.expires_at`,
      args: [key, JSON.stringify(data), Date.now() + ttlMs],
    })
  } catch (err) {
    console.error('hub: cache write failed', err)
  }
}
