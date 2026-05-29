import { useSupabase } from '../../utils/supabase'
import { logAction } from '../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.displayName || !body.submitterName) {
    throw createError({ statusCode: 400, message: 'displayName and submitterName are required' })
  }

  const sb = useSupabase()
  const now = new Date().toISOString()

  const { data: maxData } = await sb
    .from('rsvps')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder = ((maxData?.[0]?.sort_order ?? 0) as number) + 1

  const { data, error } = await sb
    .from('rsvps')
    .insert({
      display_name: body.displayName,
      submitter_name: body.submitterName,
      contact: body.contact || null,
      headcount: body.headcount ?? 1,
      guest_names: Array.isArray(body.guestNames) && body.guestNames.length ? body.guestNames : null,
      dietary_notes: body.dietaryNotes || null,
      status: body.attending === 'no' ? 'declined' : 'pending',
      show_on_public: false,
      sort_order: nextOrder,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('created', 'rsvp', `Public RSVP: ${data.display_name}`, data.id)
  return { ok: true, id: data.id }
})
