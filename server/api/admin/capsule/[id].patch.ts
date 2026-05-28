import { useSupabase, toCapsule } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const sb = useSupabase()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('status' in body) updates.status = body.status

  const { data, error } = await sb
    .from('time_capsule_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw createError({ statusCode: 404, message: 'Entry not found' })

  void logAction('updated', 'capsule', `Capsule entry ${id} → ${data.status}`, id)
  return toCapsule(data)
})
