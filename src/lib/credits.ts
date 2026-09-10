import { createClient, type Client } from "@libsql/client/web";

/*
 * credits.ts — the points ledger.
 *
 * WHY THIS IS NOT IN localStorage, WHICH IS WHERE THE REST OF THE GAME'S STATE
 * LIVES. progress.js keeps streaks and history in the browser because nothing
 * is riding on them: a person who edits their own streak has only cheated
 * themselves. Points are different — they buy Premium features. A balance the
 * browser owns is a balance anybody can set to a million, so this one lives on
 * the server and the browser is only ever told what it is.
 *
 * The worker has no KV or Durable Object binding (see wrangler.jsonc), and
 * Whop's hosted runtime injects secrets as env vars and nothing else. So the
 * store is Turso, reached over HTTP with credentials from `whop apps secrets`.
 *
 * THE LEDGER IS THE TRUTH. credit_accounts.balance is a cache of it. Nothing
 * here ever updates or deletes a ledger row: a reversal is a new row with a
 * negative delta, so the history of a disputed payout survives.
 */

export const POINTS_PER_USD = 100; // 1 point = $0.01 of gross revenue
export const USER_SHARE = 0.3; // the user's 30%

/** Free allowances per UTC day, before credits are charged. */
export const FREE_PER_DAY = { chat: 12, news: 10 } as const;

/** What a metered action costs once the free allowance is gone. */
export const COST = { chat: 1, news: 1, premium_action: 5 } as const;

export type Feature = keyof typeof COST;

let cached: Client | null = null;

/**
 * Test seam. scripts/credits-test.mjs points this at a local SQLite file so
 * the ledger rules can be exercised for real — concurrent spends, replayed
 * postbacks, reversals — rather than mocked and assumed.
 */
export function useClient(client: Client | null) {
  cached = client;
}

/** null when Turso is not configured — callers must treat that as "no credits system". */
export function db(): Client | null {
  if (cached) return cached;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  cached = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return cached;
}

export function utcDay(at = new Date()): string {
  return at.toISOString().slice(0, 10);
}

/**
 * Points owed to the user for revenue we booked.
 * Deliberately a formula: network payouts run from about $0.20 to $5.00
 * depending on geo and survey length, so a fixed per-survey number would be
 * wrong nearly always.
 */
export function pointsFor(netRevenueUsd: number): number {
  if (!Number.isFinite(netRevenueUsd) || netRevenueUsd <= 0) return 0;
  return Math.round(netRevenueUsd * POINTS_PER_USD * USER_SHARE);
}

/*
 * Write transactions retry when the store says "busy".
 *
 * Two requests writing at once is not an edge case here — it is a person
 * tapping send twice, or a survey postback landing while they are spending.
 * libSQL answers the loser with SQLITE_BUSY, which is a "try again", not a
 * failure: nothing was written, so trying again is safe.
 *
 * Only a handful of attempts, and only for this error. Anything else is a
 * real fault and must surface rather than be retried into a timeout.
 */
const BUSY = /SQLITE_BUSY|database is locked|conflict/i;

async function writing<T>(run: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await run();
    } catch (err) {
      last = err;
      if (!BUSY.test(String((err as Error)?.message ?? err))) throw err;
      await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
    }
  }
  throw last;
}

export type Account = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
};

const EMPTY: Account = { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 };

export async function getAccount(userId: string): Promise<Account> {
  const client = db();
  if (!client) return EMPTY;
  const { rows } = await client.execute({
    sql: "SELECT balance, lifetime_earned, lifetime_spent FROM credit_accounts WHERE user_id = ?",
    args: [userId],
  });
  const row = rows[0];
  if (!row) return EMPTY;
  return {
    balance: Number(row.balance ?? 0),
    lifetimeEarned: Number(row.lifetime_earned ?? 0),
    lifetimeSpent: Number(row.lifetime_spent ?? 0),
  };
}

export type LedgerEntry = {
  delta: number;
  reason: string;
  feature: string | null;
  createdAt: number;
};

export async function recentLedger(
  userId: string,
  limit = 20,
): Promise<LedgerEntry[]> {
  const client = db();
  if (!client) return [];
  const { rows } = await client.execute({
    sql: "SELECT delta, reason, feature, created_at FROM credit_ledger WHERE user_id = ? ORDER BY id DESC LIMIT ?",
    args: [userId, limit],
  });
  return rows.map((row) => ({
    delta: Number(row.delta ?? 0),
    reason: String(row.reason ?? ""),
    feature: row.feature == null ? null : String(row.feature),
    createdAt: Number(row.created_at ?? 0),
  }));
}

/*
 * Crediting a survey completion.
 *
 * Called only from the provider postback, never from anything the browser can
 * reach. The unique index on (provider, provider_txn_id) is what makes it safe
 * to call twice: the INSERT loses, rowsAffected is 0, and the balance is left
 * alone. That matters because networks retry postbacks aggressively.
 */
export async function credit(opts: {
  userId: string;
  points: number;
  reason: "survey_complete" | "survey_screenout" | "signup_bonus" | "manual";
  provider?: string;
  providerTxnId?: string;
  netRevenueUsd?: number;
  metadata?: unknown;
}): Promise<{ credited: boolean; duplicate: boolean }> {
  const client = db();
  if (!client) return { credited: false, duplicate: false };
  if (opts.points <= 0) return { credited: false, duplicate: false };

  const now = Date.now();
  return writing(async () => {
    const tx = await client.transaction("write");
    try {
      const inserted = await tx.execute({
        sql: `INSERT OR IGNORE INTO credit_ledger
              (user_id, delta, reason, provider, provider_txn_id, net_revenue_usd, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          opts.userId,
          opts.points,
          opts.reason,
          opts.provider ?? null,
          opts.providerTxnId ?? null,
          opts.netRevenueUsd ?? null,
          opts.metadata ? JSON.stringify(opts.metadata) : null,
          now,
        ],
      });

      if (inserted.rowsAffected === 0) {
        await tx.rollback();
        return { credited: false, duplicate: true };
      }

      await tx.execute({
        sql: `INSERT INTO credit_accounts (user_id, balance, lifetime_earned, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              balance         = balance + excluded.balance,
              lifetime_earned = lifetime_earned + excluded.lifetime_earned,
              updated_at      = excluded.updated_at`,
        args: [opts.userId, opts.points, opts.points, now],
      });
      await tx.commit();
      return { credited: true, duplicate: false };
    } catch (err) {
      await tx.rollback().catch(() => {});
      throw err;
    }
  });
}

/*
 * A clawback from the network — fraud, a duplicate, answers thrown out.
 *
 * The balance is allowed to go negative. Clamping it at zero would let someone
 * spend the points, take the reversal, and come out ahead; leaving the debt in
 * place means they have to earn back through it. Spending is what gets blocked
 * (see spend()), not the balance itself.
 */
export async function reverse(opts: {
  userId: string;
  points: number;
  provider: string;
  providerTxnId: string;
  metadata?: unknown;
}): Promise<{ reversed: boolean; duplicate: boolean }> {
  const client = db();
  if (!client) return { reversed: false, duplicate: false };

  const now = Date.now();
  return writing(async () => {
    const tx = await client.transaction("write");
    try {
      const inserted = await tx.execute({
        sql: `INSERT OR IGNORE INTO credit_ledger
              (user_id, delta, reason, provider, provider_txn_id, metadata, created_at)
            VALUES (?, ?, 'reversal', ?, ?, ?, ?)`,
        args: [
          opts.userId,
          -Math.abs(opts.points),
          opts.provider,
          // Namespaced so a reversal never collides with the completion it undoes.
          `reversal:${opts.providerTxnId}`,
          opts.metadata ? JSON.stringify(opts.metadata) : null,
          now,
        ],
      });
      if (inserted.rowsAffected === 0) {
        await tx.rollback();
        return { reversed: false, duplicate: true };
      }
      await tx.execute({
        sql: `INSERT INTO credit_accounts (user_id, balance, reversals, updated_at)
            VALUES (?, ?, 1, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              balance    = balance - ?,
              reversals  = reversals + 1,
              updated_at = ?`,
        args: [
          opts.userId,
          -Math.abs(opts.points),
          now,
          Math.abs(opts.points),
          now,
        ],
      });
      await tx.commit();
      return { reversed: true, duplicate: false };
    } catch (err) {
      await tx.rollback().catch(() => {});
      throw err;
    }
  });
}

export type Charge =
  | { ok: true; how: "free"; remainingFree: number; balance: number }
  | { ok: true; how: "credits"; remainingFree: 0; balance: number }
  | { ok: false; how: "insufficient"; remainingFree: 0; balance: number }
  | { ok: true; how: "unmetered"; remainingFree: number; balance: number };

/*
 * One gate for every metered feature: free allowance first, then points.
 *
 * The whole check and both writes happen in one transaction, because the
 * alternative — read the count, decide, write it back — lets two requests in
 * flight at once each see the same "you have one left".
 */
export async function charge(
  userId: string,
  feature: Feature,
): Promise<Charge> {
  const client = db();
  // No database configured: the feature stays free rather than breaking. A
  // missing credit system must not take away something that worked yesterday.
  if (!client)
    return { ok: true, how: "unmetered", remainingFree: 0, balance: 0 };

  const free = FREE_PER_DAY[feature as keyof typeof FREE_PER_DAY] ?? 0;
  const cost = COST[feature];
  const day = utcDay();
  const now = Date.now();

  return writing(async () => {
    const tx = await client.transaction("write");
    try {
      const seen = await tx.execute({
        sql: "SELECT used FROM feature_usage WHERE user_id = ? AND feature = ? AND day = ?",
        args: [userId, feature, day],
      });
      const used = Number(seen.rows[0]?.used ?? 0);

      if (used < free) {
        await tx.execute({
          sql: `INSERT INTO feature_usage (user_id, feature, day, used) VALUES (?, ?, ?, 1)
              ON CONFLICT(user_id, feature, day) DO UPDATE SET used = used + 1`,
          args: [userId, feature, day],
        });
        const account = await tx.execute({
          sql: "SELECT balance FROM credit_accounts WHERE user_id = ?",
          args: [userId],
        });
        await tx.commit();
        return {
          ok: true,
          how: "free",
          remainingFree: free - used - 1,
          balance: Number(account.rows[0]?.balance ?? 0),
        };
      }

      // Allowance spent — pay points. The `balance >= ?` in the WHERE clause is
      // the atomic part: if it does not match, rowsAffected is 0 and nothing moved.
      const paid = await tx.execute({
        sql: `UPDATE credit_accounts
               SET balance = balance - ?, lifetime_spent = lifetime_spent + ?, updated_at = ?
             WHERE user_id = ? AND balance >= ?`,
        args: [cost, cost, now, userId, cost],
      });

      if (paid.rowsAffected === 0) {
        const account = await tx.execute({
          sql: "SELECT balance FROM credit_accounts WHERE user_id = ?",
          args: [userId],
        });
        await tx.rollback();
        return {
          ok: false,
          how: "insufficient",
          remainingFree: 0,
          balance: Number(account.rows[0]?.balance ?? 0),
        };
      }

      await tx.execute({
        sql: `INSERT INTO credit_ledger (user_id, delta, reason, feature, created_at)
            VALUES (?, ?, 'spend', ?, ?)`,
        args: [userId, -cost, feature, now],
      });
      const account = await tx.execute({
        sql: "SELECT balance FROM credit_accounts WHERE user_id = ?",
        args: [userId],
      });
      await tx.commit();
      return {
        ok: true,
        how: "credits",
        remainingFree: 0,
        balance: Number(account.rows[0]?.balance ?? 0),
      };
    } catch (err) {
      await tx.rollback().catch(() => {});
      throw err;
    }
  });
}

/** How much of today's free allowance is left, without consuming any of it. */
export async function allowanceLeft(
  userId: string,
  feature: Feature,
): Promise<number> {
  const client = db();
  if (!client) return 0;
  const free = FREE_PER_DAY[feature as keyof typeof FREE_PER_DAY] ?? 0;
  const { rows } = await client.execute({
    sql: "SELECT used FROM feature_usage WHERE user_id = ? AND feature = ? AND day = ?",
    args: [userId, feature, utcDay()],
  });
  return Math.max(0, free - Number(rows[0]?.used ?? 0));
}
