import { useSupabase } from '../../../../utils/supabase'
import { useStorage } from '../../../../utils/storage'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, message: 'Invalid contribution ID' })
  }

  const { data: contribution, error } = await useSupabase()
    .from('contributions')
    .select('proof_url')
    .eq('id', id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!contribution?.proof_url) {
    throw createError({ statusCode: 404, message: 'No proof was attached to this contribution' })
  }

  const storage = useStorage()
  let savedUrl: URL
  let storageUrl: URL
  try {
    savedUrl = new URL(contribution.proof_url as string)
    storageUrl = new URL(storage.endpoint)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid proof storage location' })
  }

  const objectPath = savedUrl.pathname
  const bucketPrefix = `/${storage.bucket}/`
  if (savedUrl.hostname !== storageUrl.hostname || !objectPath.startsWith(bucketPrefix)) {
    throw createError({ statusCode: 400, message: 'Invalid proof storage location' })
  }

  // Older records can contain an HTTP URL. Always sign against the configured
  // storage origin so private objects are fetched without a redirect.
  const objectUrl = `${storage.endpoint}${objectPath}`
  const response = await storage.aws.fetch(objectUrl)
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      message: `Could not load the stored proof (storage returned ${response.status})`,
    })
  }

  setHeader(event, 'Content-Type', response.headers.get('content-type') || 'image/jpeg')
  setHeader(event, 'Cache-Control', 'private, no-store')
  return new Uint8Array(await response.arrayBuffer())
})
