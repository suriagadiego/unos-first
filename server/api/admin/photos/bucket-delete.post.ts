import { AwsClient } from 'aws4fetch'
import { useDb } from '../../../db/index'
import { photos } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const { key } = await readBody(event)
  if (!key) throw createError({ statusCode: 400, message: 'key is required' })

  const endpoint = process.env.RUSTFS_ENDPOINT!
  const bucket = process.env.RUSTFS_BUCKET!

  const aws = new AwsClient({
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
    region: process.env.RUSTFS_REGION ?? 'us-east-1',
    service: 's3',
  })

  const res = await aws.fetch(`${endpoint}/${bucket}/${key}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw createError({ statusCode: 500, message: `Bucket delete failed: ${text}` })
  }

  const db = useDb()
  await db.delete(photos).where(eq(photos.storageKey, key))

  logAction('deleted', 'photo', `Deleted photo from bucket: ${key}`)
  return { ok: true }
})
