import { AwsClient } from 'aws4fetch'
import { useSupabase } from '../../utils/supabase'

// September 6, 2026 at 12:00 AM in Asia/Manila (UTC+8).
// Keep this filter on the public API so pre-event test uploads are never exposed.
const PUBLIC_GALLERY_START = '2026-09-05T16:00:00.000Z'

export default defineEventHandler(async () => {
  const sb = useSupabase()
  const endpoint = process.env.RUSTFS_ENDPOINT!
  const bucket = process.env.RUSTFS_BUCKET!

  const { data, error } = await sb
    .from('camera_uploads')
    .select('id, storage_key, guest_id, created_at')
    .is('deleted_at', null)
    .gte('created_at', PUBLIC_GALLERY_START)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const aws = new AwsClient({
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
    region: process.env.RUSTFS_REGION ?? 'us-east-1',
    service: 's3',
  })

  const photos = await Promise.all(
    (data ?? []).map(async (row) => {
      const objectUrl = `${endpoint}/${bucket}/${row.storage_key}`
      const signed = await aws.sign(new Request(objectUrl, { method: 'GET' }), {
        aws: { signQuery: true, expiresIn: 3600 },
      })
      return {
        id: row.id,
        url: signed.url,
        guestId: row.guest_id,
        createdAt: row.created_at,
      }
    })
  )

  return photos
})
