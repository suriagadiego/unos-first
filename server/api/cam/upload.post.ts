import { requireGuest } from '../../utils/camAuth'
import { useSupabase } from '../../utils/supabase'
import {
  MAX_CAMERA_FILE_BYTES,
  MAX_CAMERA_THUMBNAIL_BYTES,
  MAX_CAMERA_THUMBNAIL_DIMENSION,
  validateCameraJpeg,
} from '../../utils/cameraUpload'
import { readBoundedFormData } from '../../utils/boundedFormData'
import { deleteFromStorage, getObjectStorage, uploadToStorage } from '../../utils/storage'
import { CAMERA_MODERATION_ENABLED } from '../../../utils/cameraConfig'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IMMUTABLE_IMAGE_CACHE = 'public, max-age=31536000, immutable'

export default defineEventHandler(async (event) => {
  const guestId = requireGuest(event)
  const sb = useSupabase()

  const form = await readBoundedFormData(
    event,
    MAX_CAMERA_FILE_BYTES + MAX_CAMERA_THUMBNAIL_BYTES + 512 * 1024,
    'Photo is too large. Maximum size is 25 MB.',
  )
  const photoEntry = form.get('photo')
  const thumbnailEntry = form.get('thumbnail')
  const file = photoEntry && typeof photoEntry !== 'string' ? photoEntry as File : null
  const thumbnail = thumbnailEntry && typeof thumbnailEntry !== 'string' ? thumbnailEntry as File : null
  const guestName = String(form.get('guestName') || '').trim().slice(0, 40)
  const suppliedUploadId = String(form.get('uploadId') || '').trim()
  const uploadId = suppliedUploadId || crypto.randomUUID()
  if (!file) throw createError({ statusCode: 400, message: 'No photo provided' })
  if (!UUID_RE.test(uploadId)) throw createError({ statusCode: 400, message: 'Invalid upload ID' })

  const body = new Uint8Array(await file.arrayBuffer())
  validateCameraJpeg(file, body)
  const thumbnailBody = thumbnail ? new Uint8Array(await thumbnail.arrayBuffer()) : null
  if (thumbnail && thumbnailBody) {
    validateCameraJpeg(thumbnail, thumbnailBody, {
      maxBytes: MAX_CAMERA_THUMBNAIL_BYTES,
      maxDimension: MAX_CAMERA_THUMBNAIL_DIMENSION,
      label: 'Thumbnail',
    })
  }

  const requestedKey = `cam/${guestId}/${uploadId}.jpg`
  const thumbnailKey = thumbnailBody ? `cam-thumbs/${guestId}/${uploadId}.jpg` : null
  const storage = getObjectStorage()
  const requestedStorageUrl = `${storage.endpoint}/${storage.bucket}/${requestedKey}`
  const { data: reservation, error: reserveError } = await sb.rpc('reserve_camera_upload', {
    p_guest_id: guestId,
    p_guest_name: guestName,
    p_storage_key: requestedKey,
    p_storage_url: requestedStorageUrl,
    p_upload_id: uploadId,
  }).single()

  if (reserveError) {
    if (reserveError.message?.includes('SHOT_LIMIT_REACHED')) {
      throw createError({ statusCode: 403, message: 'Shot limit reached' })
    }
    throw createError({ statusCode: 500, message: reserveError.message })
  }

  const key = reservation.storage_key
  const storageUrl = `${storage.endpoint}/${storage.bucket}/${key}`
  if (reservation.upload_state === 'ready') {
    if (thumbnailKey && thumbnailBody) {
      await uploadToStorage(storage, thumbnailKey, thumbnailBody.buffer as ArrayBuffer, 'image/jpeg', {
        cacheControl: IMMUTABLE_IMAGE_CACHE,
      })
      const { error } = await sb.from('camera_uploads')
        .update({ thumbnail_storage_key: thumbnailKey })
        .eq('id', reservation.id)
      if (error) throw createError({ statusCode: 500, message: error.message })
    }
    return {
      key,
      url: storageUrl,
      remaining: Math.max(0, Number(reservation.remaining)),
      limit: Number(reservation.shot_limit),
    }
  }

  try {
    await Promise.all([
      uploadToStorage(storage, key, body.buffer as ArrayBuffer, 'image/jpeg', {
        cacheControl: IMMUTABLE_IMAGE_CACHE,
      }),
      thumbnailKey && thumbnailBody
        ? uploadToStorage(storage, thumbnailKey, thumbnailBody.buffer as ArrayBuffer, 'image/jpeg', {
            cacheControl: IMMUTABLE_IMAGE_CACHE,
          })
        : Promise.resolve(),
    ])
    const { error } = await sb.from('camera_uploads').update({
      upload_state: 'ready',
      status: CAMERA_MODERATION_ENABLED ? 'pending' : 'approved',
      thumbnail_storage_key: thumbnailKey,
    }).eq('id', reservation.id)
    if (error) throw error
  } catch (error) {
    const cleanupTasks: Promise<unknown>[] = [
      deleteFromStorage(storage, key),
      sb.from('camera_uploads').delete().eq('id', reservation.id),
    ]
    if (thumbnailKey) cleanupTasks.push(deleteFromStorage(storage, thumbnailKey))
    const [storageCleanup, databaseCleanup] = await Promise.allSettled(cleanupTasks)
    const databaseCleanupError = databaseCleanup.status === 'fulfilled'
      ? databaseCleanup.value.error?.message || null
      : databaseCleanup.reason instanceof Error ? databaseCleanup.reason.message : String(databaseCleanup.reason)
    console.error(JSON.stringify({
      message: 'camera upload failed',
      key,
      error: error instanceof Error ? error.message : String(error),
      cleanup: {
        storage: storageCleanup.status === 'fulfilled'
          ? null
          : storageCleanup.reason instanceof Error ? storageCleanup.reason.message : String(storageCleanup.reason),
        database: databaseCleanupError,
      },
    }))
    throw createError({ statusCode: 502, message: 'Photo upload failed. Please try again.' })
  }

  return {
    key,
    url: storageUrl,
    remaining: Math.max(0, Number(reservation.remaining)),
    limit: Number(reservation.shot_limit),
  }
})
