import { useSupabase, toRsvp } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const sb = useSupabase()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const map: Record<string, string> = {
    displayName: 'display_name',
    gridName: 'grid_name',
    submitterName: 'submitter_name',
    contact: 'contact',
    headcount: 'headcount',
    guestNames: 'guest_names',
    kidsNames: 'kids_names',
    dietaryNotes: 'dietary_notes',
    status: 'status',
    showOnPublic: 'show_on_public',
    sortOrder: 'sort_order',
  }
  for (const [camel, snake] of Object.entries(map)) {
    if (camel in body) updates[snake] = body[camel]
  }
  if ('gridName' in body) updates.grid_name = body.gridName?.trim() || null

  const { data, error } = await sb
    .from('rsvps')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()
  if (error) {
    const notFound = error.code === 'PGRST116'
    throw createError({
      statusCode: notFound ? 404 : 500,
      message: notFound ? 'RSVP not found' : error.message,
    })
  }

  void logAction('updated', 'rsvp', `Updated RSVP: ${data.display_name}`, id)
  return toRsvp(data)
})
