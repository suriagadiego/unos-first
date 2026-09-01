import type { H3Event } from 'h3'

const DEFAULT_UPLOAD_ERROR = 'Upload is too large.'

export async function readBoundedFormData(
  event: H3Event,
  maxBytes: number,
  tooLargeMessage = DEFAULT_UPLOAD_ERROR,
) {
  const request = toWebRequest(event)
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
    throw createError({ statusCode: 415, message: 'Expected a multipart form upload.' })
  }

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw createError({ statusCode: 413, message: tooLargeMessage })
  }
  if (!request.body) {
    throw createError({ statusCode: 400, message: 'Upload body is missing.' })
  }

  let totalBytes = 0
  const countedStream = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      totalBytes += chunk.byteLength
      if (totalBytes > maxBytes) {
        controller.error(createError({ statusCode: 413, message: tooLargeMessage }))
        return
      }
      controller.enqueue(chunk)
    },
  }))

  return new Request(request.url, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: countedStream,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' }).formData()
}
