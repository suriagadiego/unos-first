import { useDb } from '../../db/index'
import { activities } from '../../db/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()
  return db.select().from(activities).where(eq(activities.isVisible, true)).orderBy(asc(activities.sortOrder))
})
