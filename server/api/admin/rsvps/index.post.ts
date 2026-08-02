import { useSupabase, toRsvp } from '../../../utils/supabase'
import { logAction } from '../../../utils/log'
import { titleCaseNames, toNameTitleCase } from '../../../../utils/nameFormat'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
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
      display_name: toNameTitleCase(body.displayName),
      grid_name: body.gridName ? toNameTitleCase(body.gridName) : null,
      submitter_name: toNameTitleCase(body.submitterName),
      contact: body.contact || null,
      headcount: body.headcount || 1,
      guest_names: titleCaseNames(body.guestNames),
      kids_names: titleCaseNames(body.kidsNames),
      dietary_notes: body.dietaryNotes || null,
      status: 'pending',
      show_on_public: false,
      sort_order: nextOrder,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('created', 'rsvp', `New RSVP: ${data.display_name}`, data.id)
  return toRsvp(data)
})
