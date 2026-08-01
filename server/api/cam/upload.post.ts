import { requireGuest } from '../../utils/camAuth'
import { useSupabase } from '../../utils/supabase'
import { uploadToStorage, useStorage } from '../../utils/storage'

const SHOT_LIMIT = 24

export default defineEventHandler(async (event) => {
  const guestId = requireGuest(event)
  const sb = useSupabase()

  const { count, error: countErr } = await sb
    .from('camera_uploads')
    .select('*', { count: 'exact', head: true })
    .eq('guest_id', guestId)

  if (countErr) throw createError({ statusCode: 500, message: countErr.message })
  if ((count ?? 0) >= SHOT_LIMIT) throw createError({ statusCode: 403, message: 'Shot limit reached' })

  const form = await readFormData(event)
  const file = form.get('photo') as File
  const guestName = (form.get('guestName') as string | null)?.trim() || null
  if (!file) throw createError({ statusCode: 400, message: 'No photo provided' })

  const key = `cam/${guestId.slice(0, 8)}-${Date.now()}.jpg`
  const storage = useStorage()
  const storageUrl = await uploadToStorage(storage, key, await file.arrayBuffer(), 'image/jpeg')

  const { error } = await sb.from('camera_uploads').insert({
    guest_id: guestId,
    guest_name: guestName,
    storage_key: key,
    url: storageUrl,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { key, url: storageUrl, remaining: Math.max(0, SHOT_LIMIT - (count ?? 0) - 1) }
})
