import { useDb } from '../../../db/index'
import { rsvps } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const db = useDb()

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  const allowed = ['displayName', 'submitterName', 'contact', 'headcount', 'dietaryNotes', 'status', 'showOnPublic', 'sortOrder']
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const [updated] = await db.update(rsvps).set(updates).where(eq(rsvps.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, message: 'RSVP not found' })

  logAction('updated', 'rsvp', `Updated RSVP: ${updated.displayName}`, id)
  return updated
})
