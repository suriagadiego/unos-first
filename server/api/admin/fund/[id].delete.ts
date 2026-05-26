import { useDb } from '../../../db/index'
import { contributions } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = useDb()

  const [deleted] = await db.delete(contributions).where(eq(contributions.id, id)).returning()
  if (!deleted) throw createError({ statusCode: 404, message: 'Contribution not found' })

  logAction('deleted', 'contribution', `Deleted contribution ${id}`, id)
  return { ok: true }
})
