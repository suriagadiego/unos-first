import { requireGuest } from '../../utils/camAuth'
import { useSupabase } from '../../utils/supabase'

const SHOT_LIMIT = 24

export default defineEventHandler(async (event) => {
  const guestId = requireGuest(event)

  const { count, error } = await useSupabase()
    .from('camera_uploads')
    .select('*', { count: 'exact', head: true })
    .eq('guest_id', guestId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const taken = count ?? 0
  return { taken, remaining: Math.max(0, SHOT_LIMIT - taken), limit: SHOT_LIMIT }
})
