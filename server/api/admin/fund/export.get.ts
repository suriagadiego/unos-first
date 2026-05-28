import { useSupabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const sb = useSupabase()
  const { data: rows, error } = await sb
    .from('contributions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })

  const headers = ['ID', 'Name', 'Amount', 'Message', 'Show on Public', 'Date']
  const csv = [
    headers.join(','),
    ...(rows ?? []).map((r: any) => [
      r.id,
      `"${(r.submitter_name || '').replace(/"/g, '""')}"`,
      r.amount,
      `"${(r.message || '').replace(/"/g, '""')}"`,
      r.show_on_public ? 'Yes' : 'No',
      r.created_at,
    ].join(',')),
  ].join('\n')

  setHeader(event, 'Content-Type', 'text/csv')
  setHeader(event, 'Content-Disposition', 'attachment; filename="fund.csv"')
  return csv
})
