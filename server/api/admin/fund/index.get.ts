import { useSupabase, toContribution } from '../../../utils/supabase'

export default defineEventHandler(async () => {
  const sb = useSupabase()

  const [contribRes, settingsRes] = await Promise.all([
    sb.from('contributions').select('*').order('created_at', { ascending: false }),
    sb.from('fund_settings').select('*').limit(1).maybeSingle(),
  ])

  if (contribRes.error) throw createError({ statusCode: 500, message: contribRes.error.message })

  const contributions = (contribRes.data ?? []).map(toContribution)
  const grandTotal = contributions.reduce((sum, c) => sum + (c.amount ?? 0), 0)
  const visibleTotal = contributions.filter(c => c.showOnPublic).reduce((sum, c) => sum + (c.amount ?? 0), 0)

  return {
    contributions,
    grandTotal,
    visibleTotal,
    goal: settingsRes.data?.goal ?? 100000,
  }
})
