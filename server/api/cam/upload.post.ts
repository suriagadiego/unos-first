import { AwsClient } from 'aws4fetch'
import { requireGuest } from '../../utils/camAuth'
import { useSupabase } from '../../utils/supabase'

const SHOT_LIMIT = 24

export default defineEventHandler(async (event) => {
  const uid = await requireGuest(event)
  const sb = useSupabase()

  // Enforce shot limit server-side
  const { count, error: countErr } = await sb
    .from('camera_uploads')
    .select('*', { count: 'exact', head: true })
    .eq('guest_id', uid)

  if (countErr) throw createError({ statusCode: 500, message: countErr.message })

  const taken = count ?? 0
  if (taken >= SHOT_LIMIT) {
    throw createError({ statusCode: 403, message: 'Shot limit reached' })
  }

  const form = await readFormData(event)
  const file = form.get('photo') as File
  if (!file) throw createError({ statusCode: 400, message: 'No photo provided' })

  const endpoint = process.env.RUSTFS_ENDPOINT!
  const bucket = process.env.RUSTFS_BUCKET!
  // Prefix with cam/ so admin can see these are from the guest camera
  const key = `cam/${uid.slice(0, 8)}-${Date.now()}.jpg`

  const aws = new AwsClient({
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
    region: process.env.RUSTFS_REGION ?? 'us-east-1',
    service: 's3',
  })

  const storageUrl = `${endpoint}/${bucket}/${key}`
  const buffer = await file.arrayBuffer()

  const uploadRes = await aws.fetch(storageUrl, {
    method: 'PUT',
    body: buffer,
    headers: { 'Content-Type': 'image/jpeg' },
  })

  if (!uploadRes.ok) {
    const text = await uploadRes.text()
    throw createError({ statusCode: 500, message: `Storage error: ${text}` })
  }

  // Ensure guest row exists
  await sb.from('guests').upsert({ id: uid }, { onConflict: 'id' })

  const { error } = await sb.from('camera_uploads').insert({
    guest_id: uid,
    storage_key: key,
    url: storageUrl,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { key, url: storageUrl, remaining: Math.max(0, SHOT_LIMIT - (taken + 1)) }
})
