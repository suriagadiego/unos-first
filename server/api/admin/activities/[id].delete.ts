import { useDb } from '../../../db/index'
import { activities } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = useDb()

  const [deleted] = await db.delete(activities).where(eq(activities.id, id)).returning()
  if (!deleted) throw createError({ statusCode: 404, message: 'Activity not found' })

  logAction('deleted', 'activity', `Deleted activity: ${deleted.label}`, id)
  return { ok: true }
})
