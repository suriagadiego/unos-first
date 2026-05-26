import { useDb } from '../../../db/index'
import { rsvps } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = useDb()

  const [deleted] = await db.delete(rsvps).where(eq(rsvps.id, id)).returning()
  if (!deleted) throw createError({ statusCode: 404, message: 'RSVP not found' })

  logAction('deleted', 'rsvp', `Deleted RSVP: ${deleted.displayName}`, id)
  return { ok: true }
})
