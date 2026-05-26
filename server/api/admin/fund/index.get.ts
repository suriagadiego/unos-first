import { useDb } from '../../../db/index'
import { contributions, fundSettings } from '../../../db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()

  const rows = await db.select().from(contributions).orderBy(desc(contributions.createdAt))

  const [totals] = await db.select({
    grandTotal: sql<number>`coalesce(sum(amount), 0)`,
    visibleTotal: sql<number>`coalesce(sum(case when show_on_public = 1 then amount else 0 end), 0)`,
  }).from(contributions)

  const [settings] = await db.select().from(fundSettings).limit(1)

  return {
    contributions: rows,
    grandTotal: Number(totals.grandTotal) || 0,
    visibleTotal: Number(totals.visibleTotal) || 0,
    goal: settings?.goal || 100000,
  }
})
