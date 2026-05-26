import { useDb } from '../../../db/index'
import { timeCapsuleEntries } from '../../../db/schema'
import { desc, like, or, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const db = useDb()

  let q = db.select().from(timeCapsuleEntries).$dynamic()

  if (query.status) q = q.where(eq(timeCapsuleEntries.status, String(query.status)))
  if (query.search) {
    const term = `%${query.search}%`
    q = q.where(or(
      like(timeCapsuleEntries.submitterName, term),
      like(timeCapsuleEntries.message, term),
    ))
  }

  return q.orderBy(desc(timeCapsuleEntries.createdAt))
})
