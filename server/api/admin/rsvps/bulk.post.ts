import { useDb } from '../../../db/index'
import { rsvps } from '../../../db/schema'
import { inArray } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  // body: { ids: number[], action: 'confirm' | 'decline' | 'hide' | 'show' }
  const { ids, action } = body
  if (!ids?.length) throw createError({ statusCode: 400, message: 'No IDs provided' })

  const db = useDb()
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = { updatedAt: now }
  if (action === 'confirm') updates.status = 'confirmed'
  else if (action === 'decline') updates.status = 'declined'
  else if (action === 'hide') updates.showOnPublic = false
  else if (action === 'show') updates.showOnPublic = true
  else throw createError({ statusCode: 400, message: 'Invalid action' })

  await db.update(rsvps).set(updates).where(inArray(rsvps.id, ids))

  logAction('bulk_' + action, 'rsvp', `Bulk ${action} on ${ids.length} RSVPs`)
  return { ok: true, count: ids.length }
})
