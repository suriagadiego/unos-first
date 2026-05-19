import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.RUSTFS_ENDPOINT,
  region: process.env.RUSTFS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as File

  if (!file) throw createError({ statusCode: 400, message: 'No file provided' })

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`

  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.RUSTFS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))
  } catch (err: any) {
    console.error('RustFS upload error:', err?.message, err?.$metadata, err?.Code)
    throw createError({ statusCode: 500, message: err?.message ?? 'Upload failed' })
  }

  return { key, url: `${process.env.RUSTFS_ENDPOINT}/${process.env.RUSTFS_BUCKET}/${key}` }
})
