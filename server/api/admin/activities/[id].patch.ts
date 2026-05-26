import { useDb } from '../../../db/index'
import { activities } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const db = useDb()

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  const allowed = ['label', 'time', 'venueName', 'address', 'note', 'isVisible', 'sortOrder', 'lapNumber']
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const [updated] = await db.update(activities).set(updates).where(eq(activities.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Activity not found' })

  logAction('updated', 'activity', `Updated activity: ${updated.label}`, id)
  return updated
})
