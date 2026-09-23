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
 * WHAT IS ALREADY IN IT. Three tables were there before this file was
 * written, from another codebase, all empty: credit_accounts, credit_ledger
 * and feature_usage. Nothing here reads or writes them yet, and nothing here
 * should drop them — they are not this app's to delete. feature_usage
 * (user_id, feature, day, used) is shaped exactly like the daily allowance
 * ledger the metered features need, and is the likely first use.
 *
 * WHAT MUST CHANGE BEFORE THE FIRST ROW IS WRITTEN. The privacy page promises
 * that the IP address the AI features rate-limit on is "kept in memory only…
 * never written to a database". Anything stored here about a person — even a
 * hash — makes that sentence false, so the page changes in the same commit as
 * the first write, the way GA4 and Clarity did.
 */
let client: Client | null | undefined

export function db(): Client | null {
  if (client !== undefined) return client
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  client = url && authToken ? createClient({ url, authToken }) : null
  return client
}
