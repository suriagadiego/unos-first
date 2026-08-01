import { useSupabase, toContribution } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const sb = useSupabase()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const map: Record<string, string> = {
    submitterName: 'submitter_name',
    amount: 'amount',
    message: 'message',
    showOnPublic: 'show_on_public',
  }
  for (const [camel, snake] of Object.entries(map)) {
    if (camel in body) updates[snake] = body[camel]
  }

  const { data, error } = await sb
    .from('contributions')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()
  if (error) throw createError({ statusCode: 404, message: 'Contribution not found' })

  void logAction('updated', 'contribution', `Updated contribution ${id}`, id)
  return toContribution(data)
})
