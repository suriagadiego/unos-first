import { useDb } from '../../db/index'
import { rsvps } from '../../db/schema'
import { sql } from 'drizzle-orm'
import { logAction } from '../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.displayName || !body.submitterName) {
    throw createError({ statusCode: 400, message: 'displayName and submitterName are required' })
  }

  const db = useDb()
  const now = new Date().toISOString()
  const [maxOrder] = await db.select({ max: sql<number>`coalesce(max(sort_order), 0)` }).from(rsvps)

  const [created] = await db.insert(rsvps).values({
    displayName: body.displayName,
    submitterName: body.submitterName,
    contact: body.contact || null,
    headcount: body.headcount ?? 1,
    dietaryNotes: body.dietaryNotes || null,
    status: body.attending === 'no' ? 'declined' : 'pending',
    showOnPublic: false,
    sortOrder: (Number(maxOrder.max) || 0) + 1,
    createdAt: now,
    updatedAt: now,
  }).returning()

  logAction('created', 'rsvp', `Public RSVP: ${created.displayName}`, created.id)
  return { ok: true, id: created.id }
})
