import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()

  const { error } = await sb.from('photos')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id).is('deleted_at', null)
  if (error) throw createError({ statusCode: 404, message: 'Photo not found' })

  void logAction('deleted', 'photo', `Moved photo ${id} to trash`, id)
  return { ok: true }
})
