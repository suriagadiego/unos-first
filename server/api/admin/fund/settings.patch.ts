import { useSupabase, toFundSettings } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sb = useSupabase()
  const now = new Date().toISOString()

  const { data: existing } = await sb.from('fund_settings').select('id').limit(1).maybeSingle()

  let result: any
  if (!existing) {
    const { data, error } = await sb
      .from('fund_settings')
      .insert({ goal: body.goal, created_at: now, updated_at: now })
      .select()
      .single()
    if (error) throw createError({ statusCode: 500, message: error.message })
    result = data
  } else {
    const { data, error } = await sb
      .from('fund_settings')
      .update({ goal: body.goal, updated_at: now })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw createError({ statusCode: 500, message: error.message })
    result = data
  }

  void logAction('updated', 'fund_settings', `Fund goal updated to ${body.goal}`)
  return toFundSettings(result)
})
