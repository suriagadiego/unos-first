import { useSupabase, toCapsule } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sb = useSupabase()

  let q = sb.from('time_capsule_entries').select('*')

  if (query.status) q = (q as any).eq('status', String(query.status))
  if (query.search) {
    const term = `%${query.search}%`
    q = (q as any).or(`submitter_name.ilike.${term},message.ilike.${term}`)
  }

  const { data, error } = await (q as any).order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map(toCapsule)
})
