import { useSupabase, toActivity } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const sb = useSupabase()
  const showTrashed = getQuery(event).trashed === 'true'
  let query = sb.from('activities').select('*')
  query = showTrashed ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null)
  const { data, error } = await query.order('sort_order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(toActivity)
})
