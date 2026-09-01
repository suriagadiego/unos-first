import { requireGuest } from '../../utils/camAuth'
import { useSupabase } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const guestId = requireGuest(event)

  const { data, error } = await useSupabase()
    .rpc('reserve_camera_upload', { p_guest_id: guestId })
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    taken: Number(data.taken),
    remaining: Number(data.remaining),
    limit: Number(data.shot_limit),
  }
})
