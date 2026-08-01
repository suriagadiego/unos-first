import { AwsClient } from 'aws4fetch'

type StorageConfig = {
  aws: AwsClient
  bucket: string
  endpoint: string
}

export function useStorage(): StorageConfig {
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
) {
  const url = `${storage.endpoint}/${storage.bucket}/${key}`

  try {
    const response = await storage.aws.fetch(url, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': contentType || 'application/octet-stream' },
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
