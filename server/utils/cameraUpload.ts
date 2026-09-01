export const MAX_CAMERA_FILE_BYTES = 25 * 1024 * 1024
export const MAX_CAMERA_DIMENSION = 4096

type JpegValidationOptions = {
  maxBytes?: number
  maxDimension?: number
  label?: string
}

export function validateCameraJpeg(file: File, bytes: Uint8Array, options: JpegValidationOptions = {}) {
  const maxBytes = options.maxBytes ?? MAX_CAMERA_FILE_BYTES
  const maxDimension = options.maxDimension ?? MAX_CAMERA_DIMENSION
  const label = options.label ?? 'Photo'

  if (!file || file.size === 0) {
    throw createError({ statusCode: 400, message: `No ${label.toLowerCase()} provided` })
  }
  if (file.size > maxBytes) {
    const maxMegabytes = Math.floor(maxBytes / (1024 * 1024))
    throw createError({ statusCode: 413, message: `${label} is too large. Maximum size is ${maxMegabytes} MB.` })
  }
  if (file.type !== 'image/jpeg' || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw createError({ statusCode: 415, message: `${label} must be a valid JPEG image.` })
  }

  const dimensions = jpegDimensions(bytes)
  if (!dimensions) {
    throw createError({ statusCode: 415, message: `${label} is invalid or unreadable.` })
  }
  if (dimensions.width > maxDimension || dimensions.height > maxDimension) {
    throw createError({ statusCode: 413, message: `${label} dimensions must not exceed ${maxDimension}px.` })
  }
}

export function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let offset = 2
  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset++
    while (offset < bytes.length && bytes[offset] === 0xff) offset++
    if (offset >= bytes.length) break

    const marker = bytes[offset++]
    if (marker === 0x00) continue
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 1 >= bytes.length) return null

    const length = (bytes[offset] << 8) | bytes[offset + 1]
    if (length < 2 || offset + length > bytes.length) return null
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (length < 7) return null
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      }
    }
    offset += length
  }
  return null
}
