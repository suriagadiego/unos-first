import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()

  const { data, error } = await sb
    .from('activities')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()
  if (error) throw createError({ statusCode: 404, message: 'Activity not found' })

  void logAction('deleted', 'activity', `Moved activity to trash: ${data.label}`, id)
  return { ok: true }
})
