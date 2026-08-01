import { useSupabase, toPhoto } from '../../../../utils/supabase'
import { logAction } from '../../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()
  const { data, error } = await sb.from('photos')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id).not('deleted_at', 'is', null).select().single()
  if (error) throw createError({ statusCode: 404, message: 'Deleted photo not found' })
  void logAction('restored', 'photo', `Restored photo ${id}`, id)
  return toPhoto(data)
})
