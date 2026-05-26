import { useDb } from '../../../db/index'
import { contributions } from '../../../db/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const rows = await db.select().from(contributions).orderBy(desc(contributions.createdAt))

  const headers = ['ID', 'Name', 'Amount', 'Message', 'Show on Public', 'Date']
  const csv = [
    headers.join(','),
    ...rows.map(r => [
      r.id,
      `"${(r.submitterName || '').replace(/"/g, '""')}"`,
      r.amount,
      `"${(r.message || '').replace(/"/g, '""')}"`,
      r.showOnPublic ? 'Yes' : 'No',
      r.createdAt,
    ].join(',')),
  ].join('\n')

  setHeader(event, 'Content-Type', 'text/csv')
  setHeader(event, 'Content-Disposition', 'attachment; filename="fund.csv"')
  return csv
})
