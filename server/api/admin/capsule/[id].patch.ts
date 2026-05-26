import { useDb } from '../../../db/index'
import { timeCapsuleEntries } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const db = useDb()

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if ('status' in body) updates.status = body.status

  const [updated] = await db.update(timeCapsuleEntries).set(updates).where(eq(timeCapsuleEntries.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Entry not found' })

  logAction('updated', 'capsule', `Capsule entry ${id} → ${updated.status}`, id)
  return updated
})
