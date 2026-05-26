import { useDb } from '../../../db/index'
import { activities } from '../../../db/schema'
import { sql } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()
  const now = new Date().toISOString()

  const [maxOrder] = await db.select({ max: sql<number>`coalesce(max(sort_order), 0)` }).from(activities)
  const [maxLap] = await db.select({ max: sql<number>`coalesce(max(cast(lap_number as integer)), 0)` }).from(activities)
  const nextLap = String(Number(maxLap.max || 0) + 1).padStart(2, '0')

  const [created] = await db.insert(activities).values({
    lapNumber: nextLap,
    label: body.label,
    time: body.time,
    venueName: body.venueName || null,
    address: body.address || null,
    note: body.note || null,
    isVisible: body.isVisible !== false,
    sortOrder: (Number(maxOrder.max) || 0) + 1,
    createdAt: now,
    updatedAt: now,
  }).returning()

  logAction('created', 'activity', `New activity: ${created.label}`, created.id)
  return created
})
