import { useDb } from '../../../db/index'
import { rsvps } from '../../../db/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const rows = await db.select().from(rsvps).orderBy(asc(rsvps.sortOrder))

  const headers = ['ID', 'Display Name', 'Submitter Name', 'Contact', 'Headcount', 'Dietary Notes', 'Status', 'Show on Public', 'Sort Order', 'Created At']
  const csv = [
    headers.join(','),
    ...rows.map(r => [
      r.id,
      `"${(r.displayName || '').replace(/"/g, '""')}"`,
      `"${(r.submitterName || '').replace(/"/g, '""')}"`,
      `"${(r.contact || '').replace(/"/g, '""')}"`,
      r.headcount,
      `"${(r.dietaryNotes || '').replace(/"/g, '""')}"`,
      r.status,
      r.showOnPublic ? 'Yes' : 'No',
      r.sortOrder,
      r.createdAt,
    ].join(',')),
  ].join('\n')

  setHeader(event, 'Content-Type', 'text/csv')
  setHeader(event, 'Content-Disposition', 'attachment; filename="rsvps.csv"')
  return csv
})
