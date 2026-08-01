import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()

  const { data, error } = await sb.from('contributions')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id).is('deleted_at', null).select('id').single()
  if (error) throw createError({ statusCode: 404, message: 'Contribution not found' })

  void logAction('deleted', 'contribution', `Moved contribution ${data.id} to trash`, id)
  return { ok: true }
})
