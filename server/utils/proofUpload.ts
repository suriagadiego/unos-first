import { jpegDimensions } from './cameraUpload'

export const MAX_PROOF_FILE_BYTES = 8 * 1024 * 1024
export const MAX_PROOF_DIMENSION = 4096

const PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validateProofImage(file: File, bytes: Uint8Array) {
  if (!file || file.size === 0) {
    throw createError({ statusCode: 400, message: 'No proof image provided' })
  }
  if (file.size > MAX_PROOF_FILE_BYTES) {
    throw createError({ statusCode: 413, message: 'Proof image is too large. Maximum size is 8 MB.' })
  }
  if (!PROOF_TYPES.has(file.type)) {
    throw createError({ statusCode: 415, message: 'Proof must be a JPEG, PNG, or WebP image.' })
  }

  const dimensions = proofDimensions(file.type, bytes)
  if (!dimensions) {
    throw createError({ statusCode: 415, message: 'Proof image is invalid or unreadable.' })
  }
  if (dimensions.width > MAX_PROOF_DIMENSION || dimensions.height > MAX_PROOF_DIMENSION) {
    throw createError({ statusCode: 413, message: `Proof image dimensions must not exceed ${MAX_PROOF_DIMENSION}px.` })
  }
}

export function proofExtension(contentType: string) {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

function proofDimensions(contentType: string, bytes: Uint8Array) {
  if (contentType === 'image/jpeg') {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
    return jpegDimensions(bytes)
  }

  if (contentType === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    if (
      bytes.length < 24
      || !signature.every((value, index) => bytes[index] === value)
      || ascii(bytes, 12, 16) !== 'IHDR'
    ) return null
    const width = readUint32BigEndian(bytes, 16)
    const height = readUint32BigEndian(bytes, 20)
    return width > 0 && height > 0 ? { width, height } : null
  }

  if (bytes.length < 30 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 12) !== 'WEBP') return null
  const chunkType = ascii(bytes, 12, 16)
  if (chunkType === 'VP8X') {
    return {
      width: 1 + readUint24LittleEndian(bytes, 24),
      height: 1 + readUint24LittleEndian(bytes, 27),
    }
  }
  if (chunkType === 'VP8L' && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
    }
  }
  if (chunkType === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
    }
  }
  return null
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end))
}

function readUint32BigEndian(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}
