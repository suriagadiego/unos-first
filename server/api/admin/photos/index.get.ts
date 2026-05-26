import { useDb } from '../../../db/index'
import { photos } from '../../../db/schema'
import { desc, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const db = useDb()

  let q = db.select().from(photos).$dynamic()
  if (query.status) {
    q = q.where(eq(photos.status, String(query.status)))
  }

  return q.orderBy(desc(photos.createdAt))
})
