import { useSupabase, toRsvp } from '../../../utils/supabase'

export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data, error } = await sb
    .from('rsvps')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(toRsvp)
})
