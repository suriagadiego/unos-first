import { useSupabase } from '../../utils/supabase'
import { logAction } from '../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.submitterName || !body.message) {
    throw createError({ statusCode: 400, message: 'submitterName and message are required' })
  }

  const sb = useSupabase()
  const now = new Date().toISOString()

  const { data, error } = await sb
    .from('time_capsule_entries')
    .insert({
      submitter_name: body.submitterName,
      message: body.message,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('created', 'capsule', `New time capsule from ${body.submitterName}`, data.id)
  return { ok: true }
})
