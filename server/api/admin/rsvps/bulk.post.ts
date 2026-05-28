import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const { ids, action } = await readBody(event)
  if (!ids?.length) throw createError({ statusCode: 400, message: 'No IDs provided' })

  const sb = useSupabase()
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = { updated_at: now }
  if (action === 'confirm') updates.status = 'confirmed'
  else if (action === 'decline') updates.status = 'declined'
  else if (action === 'hide') updates.show_on_public = false
  else if (action === 'show') updates.show_on_public = true
  else throw createError({ statusCode: 400, message: 'Invalid action' })

  const { error } = await sb.from('rsvps').update(updates).in('id', ids)
  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('bulk_' + action, 'rsvp', `Bulk ${action} on ${ids.length} RSVPs`)
  return { ok: true, count: ids.length }
})
