import { useSupabase } from '../../../utils/supabase'
import { getObjectStorage, listStorageObjects } from '../../../utils/storage'

// This browser owns event photos stored at the bucket root. Camera shots and
// private fund proofs have dedicated admin views and must never appear here.
const isEventPhotoKey = (key: string) => key.length > 0 && !key.includes('/')
const BUCKET_BROWSER_LIMIT = 100

export default defineEventHandler(async (event) => {
  const showTrashed = getQuery(event).trashed === 'true'
  const storage = getObjectStorage()
  const objects = (await listStorageObjects(storage, {
    delimiter: '/',
    maxObjects: BUCKET_BROWSER_LIMIT,
  })).filter(object => isEventPhotoKey(object.key))
  const sb = useSupabase()
  const objectKeys = objects.map(object => object.key)
  const photosRes = objectKeys.length
    ? await sb.from('photos').select('storage_key, deleted_at').in('storage_key', objectKeys)
    : { data: [], error: null }
  if (photosRes.error) throw createError({ statusCode: 500, message: photosRes.error.message })

  const tracked = new Map<string, boolean>()
  for (const row of photosRes.data ?? []) {
    if (row.storage_key) tracked.set(row.storage_key, Boolean(row.deleted_at))
  }

  const expiresIn = 3600 // 1 hour

  const files = await Promise.all(
    objects
      .filter(f => /\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(f.key))
      .filter(f => showTrashed ? tracked.get(f.key) === true : tracked.get(f.key) !== true)
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified))
      .map(async f => {
        const objectUrl = `${storage.endpoint}/${storage.bucket}/${f.key}`
        const signed = await storage.aws.sign(new Request(objectUrl, { method: 'GET' }), {
          aws: { signQuery: true, expiresIn },
        })
        return { ...f, url: signed.url, deleted: tracked.get(f.key) === true }
      })
  )

  return files
})
