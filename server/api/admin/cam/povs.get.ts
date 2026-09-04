import { useSupabase } from '../../../utils/supabase'
import { getObjectStorage } from '../../../utils/storage'

export default defineEventHandler(async () => {
  const sb = useSupabase()
  const storage = getObjectStorage()

  const { data, error } = await sb
    .from('camera_uploads')
    .select('id, guest_id, guest_name, storage_key, thumbnail_storage_key, status, upload_state, created_at')
    .is('deleted_at', null)
    .eq('upload_state', 'ready')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Sign every photo URL
  const signed = await Promise.all(
    (data ?? []).map(async (row) => {
      const objectUrl = `${storage.endpoint}/${storage.bucket}/${row.storage_key}`
      const thumbnailUrl = row.thumbnail_storage_key
        ? `${storage.endpoint}/${storage.bucket}/${row.thumbnail_storage_key}`
        : objectUrl
      const [s, thumbnail] = await Promise.all([
        storage.aws.sign(new Request(objectUrl, { method: 'GET' }), {
          aws: { signQuery: true, expiresIn: 3600 },
        }),
        storage.aws.sign(new Request(thumbnailUrl, { method: 'GET' }), {
          aws: { signQuery: true, expiresIn: 3600 },
        }),
      ])
      return {
        id: row.id,
        guestId: row.guest_id,
        guestName: row.guest_name,
        storageKey: row.storage_key,
        status: row.status,
        url: s.url,
        thumbnailUrl: thumbnail.url,
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
