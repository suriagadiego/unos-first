import { AwsClient } from 'aws4fetch'
import { useSupabase } from '../../../utils/supabase'

export default defineEventHandler(async () => {
  const endpoint = process.env.RUSTFS_ENDPOINT
  const bucket = process.env.RUSTFS_BUCKET
  if (!endpoint || !bucket) {
    throw createError({ statusCode: 500, message: 'Storage not configured (RUSTFS_ENDPOINT / RUSTFS_BUCKET missing)' })
  }

  const aws = new AwsClient({
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
    region: process.env.RUSTFS_REGION ?? 'us-east-1',
    service: 's3',
  })

  const res = await aws.fetch(`${endpoint}/${bucket}?list-type=2`)
  if (!res.ok) {
    const text = await res.text()
    throw createError({ statusCode: 500, message: `Bucket list failed: ${text}` })
  }

  const xml = await res.text()
  const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map(m => m[1])

  const sb = useSupabase()
  const { data: existing } = await sb.from('photos').select('storage_key')
  const existingKeys = new Set((existing ?? []).map((p: any) => p.storage_key).filter(Boolean))

  const now = new Date().toISOString()
  const newKeys = keys.filter(k => !existingKeys.has(k))

  if (newKeys.length > 0) {
    await sb.from('photos').insert(
      newKeys.map(key => ({
        url: `${endpoint}/${bucket}/${key}`,
        storage_key: key,
        uploader_name: null,
        status: 'pending',
        is_featured: false,
        show_on_public: false,
        created_at: now,
        updated_at: now,
      }))
    )
  }

  return { synced: newKeys.length, total: keys.length }
})
