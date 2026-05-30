import { useSupabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const sb = useSupabase()
  const { data: rows, error } = await sb
    .from('rsvps')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })

  const headers = ['ID', 'Display Name', 'Submitter Name', 'Contact', 'Headcount', 'Guest Names', 'Kids Names', 'Dietary Notes', 'Status', 'Show on Public', 'Sort Order', 'Created At']
  const csv = [
    headers.join(','),
    ...(rows ?? []).map((r: any) => [
      r.id,
      `"${(r.display_name || '').replace(/"/g, '""')}"`,
      `"${(r.submitter_name || '').replace(/"/g, '""')}"`,
      `"${(r.contact || '').replace(/"/g, '""')}"`,
      r.headcount,
      `"${(r.guest_names ?? []).join('; ')}"`,
      `"${(r.kids_names ?? []).join('; ')}"`,
      `"${(r.dietary_notes || '').replace(/"/g, '""')}"`,
      r.status,
      r.show_on_public ? 'Yes' : 'No',
      r.sort_order,
      r.created_at,
    ].join(',')),
  ].join('\n')

  setHeader(event, 'Content-Type', 'text/csv')
  setHeader(event, 'Content-Disposition', 'attachment; filename="rsvps.csv"')
  return csv
})
