import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const sb = useSupabase()

  const { data, error } = await sb
    .from('rsvps')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()
  if (error) throw createError({ statusCode: 404, message: 'RSVP not found' })

  void logAction('deleted', 'rsvp', `Moved RSVP to trash: ${data.display_name}`, id)
  return { ok: true }
})
