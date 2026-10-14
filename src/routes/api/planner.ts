import { createFileRoute } from '@tanstack/react-router'

import { gate, json, readJson } from '#/lib/gate'
import { readWeek, writeWeek } from '#/lib/hub-store'

/*
 * /api/planner — the meal-prep calendar, one week at a time. Free with an
 * account: what it needs is to be the same on every device you sign in on,
 * not to be paid for.
 *
 *   GET /api/planner?week=2026-10-12   that week (weeks start on a Monday)
 *   PUT /api/planner {week, plan}      save it
 *
 * The page owns the plan's shape; this checks it is a reasonable size and an
 * object, and stores it. Nothing in it is ever run or rendered as markup.
 */
const WEEK = /^\d{4}-\d{2}-\d{2}$/
const MAX_PLAN_BYTES = 48 * 1024

function validWeek(week: unknown): week is string {
  if (typeof week !== 'string' || !WEEK.test(week)) return false
  const date = new Date(week + 'T00:00:00Z')
  return !Number.isNaN(date.getTime()) && date.getUTCDay() === 1
}

export const Route = createFileRoute('/api/planner')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const who = await gate(request, 'account')
        if ('refuse' in who) return who.refuse
        const week = new URL(request.url).searchParams.get('week')
        if (!validWeek(week)) return json({ error: 'bad_week' }, 400)
        try {
          return json({ week, plan: await readWeek(who.userId, week) })
        } catch (err) {
          console.error('planner: read failed', err)
          return json({ error: 'storage_unavailable' }, 503)
        }
      },
      PUT: async ({ request }) => {
        const who = await gate(request, 'account')
        if ('refuse' in who) return who.refuse
        const body = await readJson<{ week?: unknown; plan?: unknown }>(request, MAX_PLAN_BYTES)
        if (!body || !validWeek(body.week) || !body.plan || typeof body.plan !== 'object' || Array.isArray(body.plan)) {
          return json({ error: 'bad_request' }, 400)
        }
        try {
          const saved = await writeWeek(who.userId, body.week, body.plan)
          return saved ? json({ ok: true }) : json({ error: 'storage_unavailable' }, 503)
        } catch (err) {
          console.error('planner: write failed', err)
          return json({ error: 'storage_unavailable' }, 503)
        }
      },
    },
  },
})
