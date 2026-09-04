import { useSupabase } from '../../utils/supabase'
import { getObjectStorage } from '../../utils/storage'
import { CAMERA_MODERATION_ENABLED } from '../../../utils/cameraConfig'

export default defineEventHandler(async (event) => {
  const sb = useSupabase()
  const storage = getObjectStorage()
  const pageSize = 500
  const rows: Array<{
    id: string
    guest_id: string
    storage_key: string
    thumbnail_storage_key: string | null
    guest_name: string | null
    created_at: string
  }> = []

  // Fetch every visible photo in stable pages. Supabase caps individual responses,
  // so a single limit would eventually hide older parts of the shared album.
  for (let from = 0; ; from += pageSize) {
    let query = sb
      .from('camera_uploads')
      .select('id, guest_id, storage_key, thumbnail_storage_key, guest_name, created_at')
      .is('deleted_at', null)
      .eq('upload_state', 'ready')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + pageSize - 1)

    query = CAMERA_MODERATION_ENABLED ? query.eq('status', 'approved') : query.neq('status', 'rejected')
    const { data, error } = await query

    if (error) throw createError({ statusCode: 500, message: error.message })
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }

  setHeader(event, 'Cache-Control', 'public, max-age=5, s-maxage=5, stale-while-revalidate=30')

  const photos = await Promise.all(
    rows.map(async (row) => {
      const objectUrl = `${storage.endpoint}/${storage.bucket}/${row.storage_key}`
      const thumbnailUrl = row.thumbnail_storage_key
        ? `${storage.endpoint}/${storage.bucket}/${row.thumbnail_storage_key}`
        : objectUrl
      const [signed, signedThumbnail] = await Promise.all([
        storage.aws.sign(new Request(objectUrl, { method: 'GET' }), {
          aws: { signQuery: true, expiresIn: 3600 },
        }),
        storage.aws.sign(new Request(thumbnailUrl, { method: 'GET' }), {
          aws: { signQuery: true, expiresIn: 3600 },
        }),
      ])
      return {
        id: row.id,
        url: signed.url,
        thumbnailUrl: signedThumbnail.url,
        guestId: row.guest_id,
        guestName: row.guest_name,
        createdAt: row.created_at,
      }
    })
  )

  return photos
})
