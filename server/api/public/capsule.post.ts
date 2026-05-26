import { useDb } from '../../db/index'
import { timeCapsuleEntries } from '../../db/schema'
import { logAction } from '../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.submitterName || !body.message) {
    throw createError({ statusCode: 400, message: 'submitterName and message are required' })
  }

  const db = useDb()
  const now = new Date().toISOString()

  const [created] = await db.insert(timeCapsuleEntries).values({
    submitterName: body.submitterName,
    message: body.message,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }).returning()

  logAction('created', 'capsule', `New time capsule from ${body.submitterName}`, created.id)
  return { ok: true }
})
