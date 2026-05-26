import { AwsClient } from 'aws4fetch'
import { useDb } from '../../../db/index'
import { photos } from '../../../db/schema'

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

  const db = useDb()
  const existing = await db.select({ storageKey: photos.storageKey }).from(photos)
  const existingKeys = new Set(existing.map((p: any) => p.storageKey).filter(Boolean))

  const now = new Date().toISOString()
  let added = 0

  for (const key of keys) {
    if (existingKeys.has(key)) continue
    await db.insert(photos).values({
      url: `${endpoint}/${bucket}/${key}`,
      storageKey: key,
      uploaderName: null,
      status: 'pending',
      isFeatured: false,
      showOnPublic: false,
      createdAt: now,
      updatedAt: now,
    })
    added++
  }

  return { synced: added, total: keys.length }
})
