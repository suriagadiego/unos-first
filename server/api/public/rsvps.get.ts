import { useSupabase } from '../../utils/supabase'

export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data, error } = await sb
    .from('rsvps')
    .select('id, display_name, headcount, sort_order, guest_names')
    .eq('show_on_public', true)
    .eq('status', 'confirmed')
    .order('sort_order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return ((data ?? []) as any[]).map(r => ({
    id: r.id,
    displayName: r.display_name,
    headcount: r.headcount,
    sortOrder: r.sort_order,
    guestNames: r.guest_names ?? [],
  }))
})
