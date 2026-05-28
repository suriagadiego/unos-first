import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()

  const { error } = await sb.from('photos').delete().eq('id', id)
  if (error) throw createError({ statusCode: 404, message: 'Photo not found' })

  void logAction('deleted', 'photo', `Deleted photo ${id}`, id)
  return { ok: true }
})
