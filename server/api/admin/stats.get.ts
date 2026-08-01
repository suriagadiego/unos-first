import { useSupabase, toActivityLog } from '../../utils/supabase'

const BATCH_WINDOW_MS = 2 * 60 * 1000

function batchPhotoUploads(entries: ReturnType<typeof toActivityLog>[]) {
  const out: typeof entries = []
  for (const entry of entries) {
    if (entry.entityType !== 'photo' || entry.action !== 'created') {
      out.push(entry)
      continue
    }
    const last = out.at(-1)
    if (
      last &&
      last.entityType === 'photo' &&
      last.action === 'created' &&
      last.description.startsWith(entry.description.split(' uploaded')[0]) &&
      Math.abs(new Date(last.createdAt).getTime() - new Date(entry.createdAt).getTime()) < BATCH_WINDOW_MS
    ) {
      const match = last.description.match(/uploaded (\d+) photo/)
      const count = match ? parseInt(match[1]) + 1 : 2
      const uploader = entry.description.replace('Photo uploaded by ', '')
      last.description = `${uploader} uploaded ${count} photos`
    } else {
      out.push({ ...entry })
    }
  }
  return out
}

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
    sb.from('rsvps').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    sb.from('rsvps').select('headcount').is('deleted_at', null).eq('status', 'confirmed'),
    sb.from('photos').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    sb.from('time_capsule_entries').select('*', { count: 'exact', head: true }),
    sb.from('contributions').select('amount').is('deleted_at', null),
    sb.from('fund_settings').select('goal').limit(1).maybeSingle(),
    sb.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const confirmedRows = (rsvpConfirmedRes.data ?? []) as any[]
  const confirmedHeadcount = confirmedRows.reduce((sum, r) => sum + (r.headcount ?? 0), 0)
  const fundTotal = ((fundDataRes.data ?? []) as any[]).reduce((sum, r) => sum + (r.amount ?? 0), 0)

  const rawLog = ((recentRes.data ?? []) as any[]).map(toActivityLog)
  const recentActivity = batchPhotoUploads(rawLog)

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
    recentActivity,
  }
})
