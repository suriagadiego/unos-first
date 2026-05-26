import { useDb } from '../../db/index'
import { contributions, fundSettings } from '../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()

  const publicContributions = await db.select({
    id: contributions.id,
    submitterName: contributions.submitterName,
    amount: contributions.amount,
    message: contributions.message,
    createdAt: contributions.createdAt,
  }).from(contributions).where(eq(contributions.showOnPublic, true))

  const [totals] = await db.select({
    total: sql<number>`coalesce(sum(amount), 0)`,
  }).from(contributions)

  const [settings] = await db.select().from(fundSettings).limit(1)

  return {
    contributions: publicContributions,
    total: Number(totals.total) || 0,
    goal: settings?.goal || 100000,
  }
})
