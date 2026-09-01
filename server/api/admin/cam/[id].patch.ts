import { useSupabase } from '../../../utils/supabase'

const ALLOWED = new Set(['pending', 'approved', 'rejected'])

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ status?: string }>(event)
  if (!id || !body.status || !ALLOWED.has(body.status)) {
    throw createError({ statusCode: 400, message: 'Valid photo status is required' })
  }

  const { data, error } = await useSupabase()
    .from('camera_uploads')
    .update({ status: body.status })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
