import { useSupabase, toPhoto } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sb = useSupabase()

  let q = sb.from('photos').select('*')
  if (query.status) q = (q as any).eq('status', String(query.status))

  const { data, error } = await (q as any).order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(toPhoto)
})
