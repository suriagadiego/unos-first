import { useDb } from '../../../db/index'
import { rsvps } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // body: { order: number[] } — array of IDs in new order
  const { order } = await readBody(event)
  if (!Array.isArray(order)) throw createError({ statusCode: 400, message: 'order must be an array' })

  const db = useDb()
  const now = new Date().toISOString()

  await Promise.all(
    order.map((id, index) =>
      db.update(rsvps).set({ sortOrder: index, updatedAt: now }).where(eq(rsvps.id, id))
    )
  )

  return { ok: true }
})
