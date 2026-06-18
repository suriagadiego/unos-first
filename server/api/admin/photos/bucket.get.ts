import { AwsClient } from 'aws4fetch'

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
  const blocks = [...xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)]

  const expiresIn = 3600 // 1 hour

  const files = await Promise.all(
    blocks
      .map(m => {
        const block = m[1]
        const key = block.match(/<Key>([^<]+)<\/Key>/)?.[1] ?? ''
        const lastModified = block.match(/<LastModified>([^<]+)<\/LastModified>/)?.[1] ?? ''
        const size = parseInt(block.match(/<Size>([^<]+)<\/Size>/)?.[1] ?? '0')
        return { key, lastModified, size }
      })
      .filter(f => /\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(f.key))
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified))
      .map(async f => {
        const objectUrl = `${endpoint}/${bucket}/${f.key}`
        const signed = await aws.sign(new Request(objectUrl, { method: 'GET' }), {
          aws: { signQuery: true, expiresIn },
        })
        return { ...f, url: signed.url }
      })
  )

  return files
})
