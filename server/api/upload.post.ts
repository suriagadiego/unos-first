import { AwsClient } from 'aws4fetch'
import { useSupabase } from '../utils/supabase'
import { logAction } from '../utils/log'

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as File
  const uploaderName = form.get('uploaderName') as string | null

  if (!file) throw createError({ statusCode: 400, message: 'No file provided' })

  const key = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
  const endpoint = process.env.RUSTFS_ENDPOINT!
  const bucket = process.env.RUSTFS_BUCKET!

  const aws = new AwsClient({
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
    region: process.env.RUSTFS_REGION ?? 'us-east-1',
    service: 's3',
  })

  const url = `${endpoint}/${bucket}/${key}`
  const buffer = await file.arrayBuffer()

  const res = await aws.fetch(url, {
    method: 'PUT',
    body: buffer,
    headers: { 'Content-Type': file.type },
  })

  if (!res.ok) {
    const text = await res.text()
    throw createError({ statusCode: 500, message: `RustFS error: ${text}` })
  }

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
