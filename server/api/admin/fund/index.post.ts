import { useSupabase, toContribution } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.submitterName || !body.amount) {
    throw createError({ statusCode: 400, message: 'submitterName and amount are required' })
  }

  const sb = useSupabase()
  const now = new Date().toISOString()

  const { data, error } = await sb
    .from('contributions')
    .insert({
      submitter_name: body.submitterName,
      amount: Number(body.amount),
      message: body.message || null,
      show_on_public: body.showOnPublic !== false,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('created', 'contribution', `New contribution: ₱${body.amount} from ${body.submitterName}`, data.id)
  return toContribution(data)
})
