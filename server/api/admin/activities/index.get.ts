import { useSupabase, toActivity } from '../../../utils/supabase'

export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data, error } = await sb
    .from('activities')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(toActivity)
})
