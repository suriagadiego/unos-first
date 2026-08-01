import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const { key } = await readBody(event)
  if (!key) throw createError({ statusCode: 400, message: 'key is required' })

  const sb = useSupabase()
  const now = new Date().toISOString()
  const [photosRes, cameraRes] = await Promise.all([
    sb.from('photos').update({ deleted_at: null, updated_at: now }).eq('storage_key', key).not('deleted_at', 'is', null).select('id'),
    sb.from('camera_uploads').update({ deleted_at: null }).eq('storage_key', key).not('deleted_at', 'is', null).select('id'),
  ])
  if (photosRes.error) throw createError({ statusCode: 500, message: photosRes.error.message })
  if (cameraRes.error) throw createError({ statusCode: 500, message: cameraRes.error.message })
  if (!(photosRes.data?.length || cameraRes.data?.length)) {
    throw createError({ statusCode: 404, message: 'Deleted photo not found' })
  }

  void logAction('restored', 'photo', `Restored photo: ${key}`)
  return { ok: true }
})
