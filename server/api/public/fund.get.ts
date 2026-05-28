import { useSupabase } from '../../utils/supabase'

export default defineEventHandler(async () => {
  const sb = useSupabase()

  const [publicRes, allAmountsRes, settingsRes] = await Promise.all([
    sb.from('contributions').select('id, submitter_name, amount, message, created_at').eq('show_on_public', true),
    sb.from('contributions').select('amount'),
    sb.from('fund_settings').select('goal').limit(1).maybeSingle(),
  ])

  const contributions = ((publicRes.data ?? []) as any[]).map(r => ({
    id: r.id,
    submitterName: r.submitter_name,
    amount: r.amount,
    message: r.message,
    createdAt: r.created_at,
  }))

  const total = ((allAmountsRes.data ?? []) as any[]).reduce((sum, r) => sum + (r.amount ?? 0), 0)

  return {
    contributions,
    total,
    goal: settingsRes.data?.goal ?? 100000,
  }
})
