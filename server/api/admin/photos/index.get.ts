import { useSupabase, toPhoto } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sb = useSupabase()

  let q = sb.from('photos').select('*')
  if (query.trashed === 'true') q = (q as any).not('deleted_at', 'is', null)
  else q = (q as any).is('deleted_at', null)
  if (query.status) q = (q as any).eq('status', String(query.status))

  const { data, error } = await (q as any).order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(toPhoto)
})
