import { useDb } from '../../../db/index'
import { activities } from '../../../db/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()
  return db.select().from(activities).orderBy(asc(activities.sortOrder))
})
