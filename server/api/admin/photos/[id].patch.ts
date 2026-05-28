import { useSupabase, toPhoto } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const sb = useSupabase()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const map: Record<string, string> = {
    status: 'status',
    isFeatured: 'is_featured',
    showOnPublic: 'show_on_public',
    caption: 'caption',
    uploaderName: 'uploader_name',
  }
  for (const [camel, snake] of Object.entries(map)) {
    if (camel in body) updates[snake] = body[camel]
  }
  if (body.status === 'approved') updates.show_on_public = true
  if (body.status === 'rejected') updates.show_on_public = false

  const { data, error } = await sb
    .from('photos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw createError({ statusCode: 404, message: 'Photo not found' })

  void logAction('updated', 'photo', `Photo ${id} status → ${data.status}`, id)
  return toPhoto(data)
})
