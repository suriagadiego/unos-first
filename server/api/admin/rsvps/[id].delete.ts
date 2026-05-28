import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()

  const { data, error } = await sb
    .from('rsvps')
    .delete()
    .eq('id', id)
    .select()
    .single()
  if (error) throw createError({ statusCode: 404, message: 'RSVP not found' })

  void logAction('deleted', 'rsvp', `Deleted RSVP: ${data.display_name}`, id)
  return { ok: true }
})
