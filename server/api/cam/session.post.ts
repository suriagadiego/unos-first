import { requireGuest } from '../../utils/camAuth'
import { useSupabase } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const uid = await requireGuest(event)
  const body = await readBody(event).catch(() => ({}))
  const displayName: string | null = body?.displayName?.trim() || null

  await useSupabase()
    .from('guests')
    .upsert({ id: uid, display_name: displayName }, { onConflict: 'id' })

  return { ok: true }
})
