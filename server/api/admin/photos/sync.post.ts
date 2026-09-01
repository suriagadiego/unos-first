import { useSupabase } from '../../../utils/supabase'
import { getObjectStorage, listStorageObjects } from '../../../utils/storage'

// The photos table only owns bucket-root keys (`<timestamp>-<name>`). Guest shots
// live under cam/ and are tracked in camera_uploads; fund-proofs/ holds donors'
// private transfer screenshots and must never surface as an event photo.
const isEventPhotoKey = (key: string) => key.length > 0 && !key.includes('/')

const INSERT_CHUNK = 500

export default defineEventHandler(async () => {
  const storage = getObjectStorage()
  const keys = (await listStorageObjects(storage)).map(object => object.key).filter(isEventPhotoKey)

  const sb = useSupabase()
  const { data: existing } = await sb.from('photos').select('storage_key')
  const existingKeys = new Set((existing ?? []).map((p: any) => p.storage_key).filter(Boolean))

  const now = new Date().toISOString()
  const newKeys = keys.filter(k => !existingKeys.has(k))

  for (let i = 0; i < newKeys.length; i += INSERT_CHUNK) {
    const { error } = await sb.from('photos').insert(
      newKeys.slice(i, i + INSERT_CHUNK).map(key => ({
        url: `${storage.endpoint}/${storage.bucket}/${key}`,
        storage_key: key,
        uploader_name: null,
        status: 'pending',
        is_featured: false,
        show_on_public: false,
        created_at: now,
        updated_at: now,
      }))
    )
    if (error) throw createError({ statusCode: 500, message: error.message })
  }

  return { synced: newKeys.length, total: keys.length }
})
