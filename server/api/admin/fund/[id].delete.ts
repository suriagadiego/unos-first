import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()

  const { error } = await sb.from('contributions').delete().eq('id', id)
  if (error) throw createError({ statusCode: 404, message: 'Contribution not found' })

  void logAction('deleted', 'contribution', `Deleted contribution ${id}`, id)
  return { ok: true }
})
