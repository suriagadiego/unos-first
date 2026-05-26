import { useDb } from '../../db/index'
import { rsvps } from '../../db/schema'
import { eq, asc, and } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDb()
  return db.select({
    id: rsvps.id,
    displayName: rsvps.displayName,
    headcount: rsvps.headcount,
    sortOrder: rsvps.sortOrder,
  })
    .from(rsvps)
    .where(and(eq(rsvps.showOnPublic, true), eq(rsvps.status, 'confirmed')))
    .orderBy(asc(rsvps.sortOrder))
})
