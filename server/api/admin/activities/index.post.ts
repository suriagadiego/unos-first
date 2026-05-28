import { useSupabase, toActivity } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sb = useSupabase()
  const now = new Date().toISOString()

  const [maxOrderRes, allLapsRes] = await Promise.all([
    sb.from('activities').select('sort_order').order('sort_order', { ascending: false }).limit(1),
    sb.from('activities').select('lap_number'),
  ])

  const maxOrder = (maxOrderRes.data?.[0]?.sort_order ?? 0) as number
  const maxLap = Math.max(
    0,
    ...((allLapsRes.data ?? []) as any[])
      .map((r: any) => parseInt(r.lap_number || '0'))
      .filter((n: number) => !isNaN(n)),
  )
  const nextLap = String(maxLap + 1).padStart(2, '0')

  const { data, error } = await sb
    .from('activities')
    .insert({
      lap_number: nextLap,
      label: body.label,
      time: body.time,
      venue_name: body.venueName || null,
      address: body.address || null,
      note: body.note || null,
      is_visible: body.isVisible !== false,
      sort_order: maxOrder + 1,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('created', 'activity', `New activity: ${data.label}`, data.id)
  return toActivity(data)
})
