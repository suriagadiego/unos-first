import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()

  const { data, error } = await sb
    .from('activities')
    .delete()
    .eq('id', id)
    .select()
    .single()
  if (error) throw createError({ statusCode: 404, message: 'Activity not found' })

  void logAction('deleted', 'activity', `Deleted activity: ${data.label}`, id)
  return { ok: true }
})
