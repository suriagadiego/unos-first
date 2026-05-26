import { useDb } from '../../../db/index'
import { photos } from '../../../db/schema'
import { inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { ids, action } = await readBody(event)
  if (!ids?.length) throw createError({ statusCode: 400, message: 'No IDs provided' })

  const db = useDb()
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = { updatedAt: now }
  if (action === 'approve') { updates.status = 'approved'; updates.showOnPublic = true }
  else if (action === 'reject') { updates.status = 'rejected'; updates.showOnPublic = false }
  else throw createError({ statusCode: 400, message: 'Invalid action' })

  await db.update(photos).set(updates).where(inArray(photos.id, ids))
  return { ok: true, count: ids.length }
})
