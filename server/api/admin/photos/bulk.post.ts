import { useSupabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { ids, action } = await readBody(event)
  if (!ids?.length) throw createError({ statusCode: 400, message: 'No IDs provided' })

  const sb = useSupabase()
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = { updated_at: now }
  if (action === 'approve') { updates.status = 'approved'; updates.show_on_public = true }
  else if (action === 'reject') { updates.status = 'rejected'; updates.show_on_public = false }
  else throw createError({ statusCode: 400, message: 'Invalid action' })

  const { error } = await sb.from('photos').update(updates).in('id', ids)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true, count: ids.length }
})
