import { useSupabase, toActivity } from '../../../../utils/supabase'
import { logAction } from '../../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()
  const { data, error } = await sb.from('activities')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id).not('deleted_at', 'is', null).select().single()
  if (error) throw createError({ statusCode: 404, message: 'Deleted activity not found' })
  void logAction('restored', 'activity', `Restored activity: ${data.label}`, id)
  return toActivity(data)
})
