import { type Client, createClient } from '@libsql/client/web'

/*
 * THE DATABASE, AND WHAT IT IS NOT YET FOR.
 *
 * Turso, over HTTP. The `/web` entry is not a style choice: a Cloudflare
 * Worker cannot load libSQL's native binding, and the default import reaches
 * for it and fails at the first query rather than at build time, which is the
 * worst place to find out.
 *
 * The credentials are Whop app secrets (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN),
 * injected as env bindings in the hosted runtime and never in the repository.
 * Without them db() returns null, and every caller has to treat that as "no
 * database" rather than as an error — the same arrangement as the promo
 * endpoint, and for the same reason: a feature that cannot reach its store
 * should go quiet, not break the page around it.
 *
 * WHAT IS IN IT. Three tables were there before this file was written, from
 * another codebase: credit_accounts, credit_ledger and feature_usage. They are
 * not this app's to drop. feature_usage (user_id, feature, day, used) is used
 * as the daily AI allowance ledger — see lib/allowance.ts — with user_id set
 * to a day-keyed hash of the visitor's address, prefixed "ip:" so the rows
 * this app writes, and sweeps, are never confused with anybody else's.
 *
 * Anything stored here about a person has to be on the privacy page, in the
 * same commit that starts storing it. The allowance is, under "Server logs".
 */
let client: Client | null | undefined

export function db(): Client | null {
  if (client !== undefined) return client
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  client = url && authToken ? createClient({ url, authToken }) : null
  return client
}
