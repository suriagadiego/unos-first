import { useDb } from '../../../db/index'
import { rsvps } from '../../../db/schema'
import { logAction } from '../../../utils/log'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()
  const now = new Date().toISOString()

  const [maxOrder] = await db.select({ max: sql<number>`coalesce(max(sort_order), 0)` }).from(rsvps)

  const [created] = await db.insert(rsvps).values({
    displayName: body.displayName,
    submitterName: body.submitterName,
    contact: body.contact || null,
    headcount: body.headcount || 1,
    dietaryNotes: body.dietaryNotes || null,
    status: 'pending',
    showOnPublic: false,
    sortOrder: (Number(maxOrder.max) || 0) + 1,
    createdAt: now,
    updatedAt: now,
  }).returning()

  logAction('created', 'rsvp', `New RSVP: ${created.displayName}`, created.id)
  return created
})
