import { useSupabase } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const { key } = await readBody(event)
  if (!key) throw createError({ statusCode: 400, message: 'key is required' })

  const endpoint = process.env.RUSTFS_ENDPOINT!
  const sb = useSupabase()
  const now = new Date().toISOString()
  const [photosRes, cameraRes] = await Promise.all([
    sb.from('photos').update({ deleted_at: now, updated_at: now }).eq('storage_key', key).is('deleted_at', null).select('id'),
    sb.from('camera_uploads').update({ deleted_at: now }).eq('storage_key', key).is('deleted_at', null).select('id'),
  ])
  if (photosRes.error) throw createError({ statusCode: 500, message: photosRes.error.message })
  if (cameraRes.error) throw createError({ statusCode: 500, message: cameraRes.error.message })

  if (!(photosRes.data?.length || cameraRes.data?.length)) {
    const { error } = await sb.from('photos').insert({
      url: `${endpoint}/${process.env.RUSTFS_BUCKET!}/${key}`,
      storage_key: key,
      status: 'rejected',
      is_featured: false,
      show_on_public: false,
      deleted_at: now,
      created_at: now,
      updated_at: now,
    })
    if (error) throw createError({ statusCode: 500, message: error.message })
  }

  void logAction('deleted', 'photo', `Moved photo to trash: ${key}`)
  return { ok: true }
})
