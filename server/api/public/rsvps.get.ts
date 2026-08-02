import { useSupabase } from '../../utils/supabase'
import { titleCaseNames, toNameTitleCase } from '../../../utils/nameFormat'

export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data, error } = await sb
    .from('rsvps')
    .select('id, display_name, grid_name, headcount, sort_order, guest_names, kids_names')
    .is('deleted_at', null)
    .eq('show_on_public', true)
    .eq('status', 'confirmed')
    .order('sort_order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return ((data ?? []) as any[]).map(r => ({
    id: r.id,
    displayName: toNameTitleCase(r.display_name),
    gridName: r.grid_name ? toNameTitleCase(r.grid_name) : null,
    headcount: r.headcount,
    sortOrder: r.sort_order,
    guestNames: titleCaseNames(r.guest_names),
    kidsNames: titleCaseNames(r.kids_names),
  }))
})
