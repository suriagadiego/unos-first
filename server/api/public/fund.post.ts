import { useSupabase } from '../../utils/supabase'
import { logAction } from '../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.submitterName?.trim() || !body.amount) {
    throw createError({ statusCode: 400, message: 'Name and amount are required' })
  }

  const amount = Number(body.amount)
  if (isNaN(amount) || amount <= 0) {
    throw createError({ statusCode: 400, message: 'Amount must be a positive number' })
  }

  const sb = useSupabase()
  const now = new Date().toISOString()

  const { data, error } = await sb
    .from('contributions')
    .insert({
      submitter_name: body.submitterName.trim(),
      amount,
      message: body.message?.trim() || null,
      proof_url: body.proofUrl || null,
      // Public submissions are approved immediately so the fund wall and
      // contributor count update as soon as the donor receives their pass.
      show_on_public: true,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('created', 'contribution', `Public submission: ₱${amount} from ${body.submitterName}`, data.id)
  return { ok: true, id: data.id }
})
