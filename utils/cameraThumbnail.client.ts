const GALLERY_THUMBNAIL_MAX_DIMENSION = 960
const GALLERY_THUMBNAIL_QUALITY = 0.72

type DrawableImage = {
  source: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}

async function decodeImage(blob: Blob): Promise<DrawableImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob)
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      }
    } catch {
      // Older iOS builds can reject JPEG blobs here; the image element fallback
      // uses the same browser decoder and preserves the exact aspect ratio.
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  const image = new Image()
  image.src = objectUrl
  await image.decode()
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  }
}

export async function createGalleryThumbnail(blob: Blob): Promise<Blob> {
  const image = await decodeImage(blob)

  try {
    const scale = Math.min(1, GALLERY_THUMBNAIL_MAX_DIMENSION / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Could not create the thumbnail canvas')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image.source, 0, 0, width, height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        result => result ? resolve(result) : reject(new Error('Could not encode the gallery thumbnail')),
        'image/jpeg',
        GALLERY_THUMBNAIL_QUALITY,
      )
    })
  } finally {
    image.cleanup()
  }
}
