import { useDb } from '../../../db/index'
import { contributions } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const db = useDb()

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  const allowed = ['submitterName', 'amount', 'message', 'showOnPublic']
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const [updated] = await db.update(contributions).set(updates).where(eq(contributions.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Contribution not found' })

  logAction('updated', 'contribution', `Updated contribution ${id}`, id)
  return updated
})
