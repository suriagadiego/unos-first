import { useSupabase, toActivity } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const sb = useSupabase()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const map: Record<string, string> = {
    label: 'label',
    time: 'time',
    venueName: 'venue_name',
    address: 'address',
    note: 'note',
    isVisible: 'is_visible',
    sortOrder: 'sort_order',
    lapNumber: 'lap_number',
  }
  for (const [camel, snake] of Object.entries(map)) {
    if (camel in body) updates[snake] = body[camel]
  }

  const { data, error } = await sb
    .from('activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw createError({ statusCode: 404, message: 'Activity not found' })

  void logAction('updated', 'activity', `Updated activity: ${data.label}`, id)
  return toActivity(data)
})
