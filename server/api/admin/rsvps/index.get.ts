import { useDb } from '../../../db/index'
import { rsvps } from '../../../db/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()
  return db.select().from(rsvps).orderBy(asc(rsvps.sortOrder), asc(rsvps.createdAt))
})
