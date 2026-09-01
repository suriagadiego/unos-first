import { useSupabase } from '../../utils/supabase'
import { getObjectStorage } from '../../utils/storage'
import { CAMERA_MODERATION_ENABLED } from '../../../utils/cameraConfig'

export default defineEventHandler(async (event) => {
  const sb = useSupabase()
  const storage = getObjectStorage()
  // September 6, 2026 at 12:00 AM in Asia/Manila (UTC+8).
  // Read this per request so the Worker sees its runtime binding.
  const publicGalleryStart = process.env.CAMERA_GALLERY_START || '2026-09-05T16:00:00.000Z'

  let query = sb
    .from('camera_uploads')
    .select('id, storage_key, created_at')
    .is('deleted_at', null)
    .eq('upload_state', 'ready')
    .gte('created_at', publicGalleryStart)
    .order('created_at', { ascending: false })
    .limit(200)

  query = CAMERA_MODERATION_ENABLED ? query.eq('status', 'approved') : query.neq('status', 'rejected')
  const { data, error } = await query

  if (error) throw createError({ statusCode: 500, message: error.message })

  setHeader(event, 'Cache-Control', 'public, max-age=5, s-maxage=5, stale-while-revalidate=30')

  const photos = await Promise.all(
    (data ?? []).map(async (row) => {
      const objectUrl = `${storage.endpoint}/${storage.bucket}/${row.storage_key}`
      const signed = await storage.aws.sign(new Request(objectUrl, { method: 'GET' }), {
        aws: { signQuery: true, expiresIn: 3600 },
      })
      return {
        id: row.id,
        url: signed.url,
        createdAt: row.created_at,
      }
    })
  )

  return photos
})
