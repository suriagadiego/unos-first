import { useDb } from '../../db/index'
import { rsvps, photos, timeCapsuleEntries, contributions, fundSettings, activityLog } from '../../db/schema'
import { eq, sql, desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()

  const [rsvpStats] = await db.select({
    total: sql<number>`count(*)`,
    confirmed: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)`,
    totalHeadcount: sql<number>`sum(case when status = 'confirmed' then headcount else 0 end)`,
  }).from(rsvps)

  const [photoStats] = await db.select({ total: sql<number>`count(*)` }).from(photos)

  const [capsuleStats] = await db.select({ total: sql<number>`count(*)` }).from(timeCapsuleEntries)

  const [fundStats] = await db.select({
    total: sql<number>`coalesce(sum(amount), 0)`,
  }).from(contributions)

  const [settings] = await db.select().from(fundSettings).limit(1)

  const recentActivity = await db.select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(10)

  return {
    rsvps: {
      total: Number(rsvpStats.total) || 0,
      confirmed: Number(rsvpStats.confirmed) || 0,
      confirmedHeadcount: Number(rsvpStats.totalHeadcount) || 0,
    },
    photos: { total: Number(photoStats.total) || 0 },
    capsule: { total: Number(capsuleStats.total) || 0 },
    fund: {
      total: Number(fundStats.total) || 0,
      goal: settings?.goal || 100000,
    },
    recentActivity,
  }
})
