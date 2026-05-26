import { useDb } from '../../../db/index'
import { photos } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const db = useDb()

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  const allowed = ['status', 'isFeatured', 'showOnPublic', 'caption', 'uploaderName']
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  // when approving, auto-set showOnPublic
  if (body.status === 'approved') updates.showOnPublic = true
  if (body.status === 'rejected') updates.showOnPublic = false

  const [updated] = await db.update(photos).set(updates).where(eq(photos.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Photo not found' })

  logAction('updated', 'photo', `Photo ${id} status → ${updated.status}`, id)
  return updated
})
