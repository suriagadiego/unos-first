import { useDb } from '../../../db/index'
import { activities } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { order } = await readBody(event)
  if (!Array.isArray(order)) throw createError({ statusCode: 400, message: 'order must be an array' })

  const db = useDb()
  const now = new Date().toISOString()

  await Promise.all(
    order.map((id, index) =>
      db.update(activities)
        .set({ sortOrder: index, lapNumber: String(index + 1).padStart(2, '0'), updatedAt: now })
        .where(eq(activities.id, id))
    )
  )

  return { ok: true }
})
