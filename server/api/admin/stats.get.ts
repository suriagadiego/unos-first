import { useSupabase, toActivityLog } from '../../utils/supabase'

export default defineEventHandler(async () => {
  const sb = useSupabase()

  const [
    rsvpTotalRes,
    rsvpConfirmedRes,
    photoTotalRes,
    capsuleTotalRes,
    fundDataRes,
    settingsRes,
    recentRes,
  ] = await Promise.all([
    sb.from('rsvps').select('*', { count: 'exact', head: true }),
    sb.from('rsvps').select('headcount').eq('status', 'confirmed'),
    sb.from('photos').select('*', { count: 'exact', head: true }),
    sb.from('time_capsule_entries').select('*', { count: 'exact', head: true }),
    sb.from('contributions').select('amount'),
    sb.from('fund_settings').select('goal').limit(1).maybeSingle(),
    sb.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const confirmedRows = (rsvpConfirmedRes.data ?? []) as any[]
  const confirmedHeadcount = confirmedRows.reduce((sum, r) => sum + (r.headcount ?? 0), 0)
  const fundTotal = ((fundDataRes.data ?? []) as any[]).reduce((sum, r) => sum + (r.amount ?? 0), 0)

  return {
    rsvps: {
      total: rsvpTotalRes.count ?? 0,
      confirmed: confirmedRows.length,
      confirmedHeadcount,
    },
    photos: { total: photoTotalRes.count ?? 0 },
    capsule: { total: capsuleTotalRes.count ?? 0 },
    fund: {
      total: fundTotal,
      goal: settingsRes.data?.goal ?? 100000,
    },
    recentActivity: ((recentRes.data ?? []) as any[]).map(toActivityLog),
  }
})
