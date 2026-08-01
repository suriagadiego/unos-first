import { useSupabase } from '../utils/supabase'
import { logAction } from '../utils/log'
import { uploadToStorage, useStorage } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as File
  const uploaderName = form.get('uploaderName') as string | null

  if (!file) throw createError({ statusCode: 400, message: 'No file provided' })

  const key = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
  const storage = useStorage()
  const url = await uploadToStorage(storage, key, await file.arrayBuffer(), file.type)

  const now = new Date().toISOString()
  const sb = useSupabase()
  const { data: photo, error } = await sb
    .from('photos')
    .insert({
      url,
      storage_key: key,
      uploader_name: uploaderName || null,
      status: 'pending',
      is_featured: false,
      show_on_public: false,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('created', 'photo', `Photo uploaded by ${uploaderName || 'guest'}`, photo.id)

  return { key, url, photoId: photo.id }
})
