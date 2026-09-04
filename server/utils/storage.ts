import { AwsClient } from 'aws4fetch'

type StorageConfig = {
  aws: AwsClient
  bucket: string
  endpoint: string
}

export function getObjectStorage(): StorageConfig {
  const endpoint = process.env.RUSTFS_ENDPOINT?.replace(/\/$/, '')
  const bucket = process.env.RUSTFS_BUCKET
  const accessKeyId = process.env.RUSTFS_ACCESS_KEY
  const secretAccessKey = process.env.RUSTFS_SECRET_KEY

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Storage is not configured',
      message: 'Set RUSTFS_ENDPOINT, RUSTFS_BUCKET, RUSTFS_ACCESS_KEY, and RUSTFS_SECRET_KEY before uploading.',
    })
  }

  let parsedEndpoint: URL
  try {
    parsedEndpoint = new URL(endpoint)
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Storage endpoint is invalid',
      message: 'RUSTFS_ENDPOINT must be a complete URL, for example https://uploads.example.com.',
    })
  }

  return {
    endpoint: parsedEndpoint.toString().replace(/\/$/, ''),
    bucket,
    aws: new AwsClient({
      accessKeyId,
      secretAccessKey,
      region: process.env.RUSTFS_REGION ?? 'us-east-1',
      service: 's3',
    }),
  }
}

export async function uploadToStorage(
  storage: StorageConfig,
  key: string,
  body: ArrayBuffer,
  contentType: string,
  options: { cacheControl?: string } = {},
) {
  const url = `${storage.endpoint}/${storage.bucket}/${key}`

  try {
    const response = await storage.aws.fetch(url, {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        ...(options.cacheControl ? { 'Cache-Control': options.cacheControl } : {}),
      },
    })

    if (!response.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Storage upload failed',
        message: `Storage returned ${response.status}: ${await response.text()}`,
      })
    }
  } catch (error: any) {
    if (error?.statusCode) throw error

    throw createError({
      statusCode: 502,
      statusMessage: 'Storage could not be reached',
      message: `Could not upload to ${storage.endpoint}. Check that RUSTFS_ENDPOINT is reachable and uses the correct protocol.`,
      cause: error,
    })
  }

  return url
}

export async function deleteFromStorage(storage: StorageConfig, key: string) {
  const response = await storage.aws.fetch(`${storage.endpoint}/${storage.bucket}/${key}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) {
    throw createError({ statusCode: 502, message: `Storage cleanup returned ${response.status}` })
  }
}

export type StorageObject = { key: string; lastModified: string; size: number }
type ListStorageOptions = { maxObjects?: number; delimiter?: string }

export async function listStorageObjects(
  storage: StorageConfig,
  options: ListStorageOptions = {},
): Promise<StorageObject[]> {
  const objects: StorageObject[] = []
  const maxObjects = options.maxObjects ?? Number.POSITIVE_INFINITY
  let continuationToken = ''

  do {
    const remaining = Math.max(1, maxObjects - objects.length)
    const query = new URLSearchParams({
      'list-type': '2',
      'max-keys': String(Math.min(1000, remaining)),
    })
    if (options.delimiter) query.set('delimiter', options.delimiter)
    if (continuationToken) query.set('continuation-token', continuationToken)
    const response = await storage.aws.fetch(`${storage.endpoint}/${storage.bucket}?${query}`)
    if (!response.ok) {
      throw createError({ statusCode: 502, message: `Bucket list failed with status ${response.status}` })
    }
    const xml = await response.text()
    for (const match of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const block = match[1]
      objects.push({
        key: decodeXml(block.match(/<Key>([\s\S]*?)<\/Key>/)?.[1] || ''),
        lastModified: block.match(/<LastModified>([^<]+)<\/LastModified>/)?.[1] || '',
        size: Number(block.match(/<Size>([^<]+)<\/Size>/)?.[1] || 0),
      })
    }
    const truncated = xml.match(/<IsTruncated>([^<]+)<\/IsTruncated>/)?.[1] === 'true'
    continuationToken = truncated
      ? decodeXml(xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] || '')
      : ''
    if (truncated && !continuationToken) {
      throw createError({ statusCode: 502, message: 'Bucket listing was truncated without a continuation token' })
    }
  } while (continuationToken && objects.length < maxObjects)

  return objects.slice(0, maxObjects)
}

function decodeXml(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
}
