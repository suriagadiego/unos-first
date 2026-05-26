import { useDb } from '../../../db/index'
import { photos } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = useDb()

  const [deleted] = await db.delete(photos).where(eq(photos.id, id)).returning()
  if (!deleted) throw createError({ statusCode: 404, message: 'Photo not found' })

  logAction('deleted', 'photo', `Deleted photo ${id}`, id)
  return { ok: true }
})
