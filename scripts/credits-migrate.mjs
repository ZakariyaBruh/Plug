/*
 * Applies scripts/credits-schema.sql to the Turso database.
 *
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... bun run scripts/credits-migrate.mjs
 *
 * Every statement is IF NOT EXISTS, so this is safe to re-run.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url) {
  console.error('TURSO_DATABASE_URL is not set')
  process.exit(1)
}

/*
 * Comments come out before the split, not after.
 *
 * Splitting the file on ';' and then discarding comment lines looks
 * equivalent and is not: a semicolon inside a comment (there is one) cuts a
 * statement in half, and the back half no longer starts with '--' so nothing
 * downstream can tell it was ever a comment.
 */
function statements(sql) {
  return sql
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

const sql = readFileSync(new URL('./credits-schema.sql', import.meta.url), 'utf8')
const list = statements(sql)

const client = createClient({ url, authToken })
for (const statement of list) {
  await client.execute(statement)
  console.log('ok:', statement.split('\n').find((l) => l.trim())?.slice(0, 70))
}
console.log(`\napplied ${list.length} statements`)
