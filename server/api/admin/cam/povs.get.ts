import { AwsClient } from 'aws4fetch'
import { useSupabase } from '../../../utils/supabase'

export default defineEventHandler(async () => {
  const sb = useSupabase()
  const endpoint = process.env.RUSTFS_ENDPOINT!
  const bucket = process.env.RUSTFS_BUCKET!

  const { data, error } = await sb
    .from('camera_uploads')
    .select('id, guest_id, guest_name, storage_key, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const aws = new AwsClient({
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
    region: process.env.RUSTFS_REGION ?? 'us-east-1',
    service: 's3',
  })

  // Sign every photo URL
  const signed = await Promise.all(
    (data ?? []).map(async (row) => {
      const objectUrl = `${endpoint}/${bucket}/${row.storage_key}`
      const s = await aws.sign(new Request(objectUrl, { method: 'GET' }), {
        aws: { signQuery: true, expiresIn: 3600 },
      })
      return {
        id: row.id,
        guestId: row.guest_id,
        guestName: row.guest_name,
        storageKey: row.storage_key,
        url: s.url,
        createdAt: row.created_at,
      }
    })
  )

  // Group by guest
  const groups = new Map<string, { guestId: string; guestName: string | null; photos: typeof signed }>()
  for (const p of signed) {
    if (!groups.has(p.guestId)) {
      groups.set(p.guestId, { guestId: p.guestId, guestName: p.guestName, photos: [] })
    }
    const g = groups.get(p.guestId)!
    if (!g.guestName && p.guestName) g.guestName = p.guestName
    g.photos.push(p)
  }

  // Most photos first
  return [...groups.values()].sort((a, b) => b.photos.length - a.photos.length)
})
