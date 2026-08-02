import { useSupabase } from '../../utils/supabase'
import { logAction } from '../../utils/log'
import { titleCaseNames, toNameTitleCase } from '../../../utils/nameFormat'
import { reserveUniqueTeamName } from '../../../utils/teamName'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.displayName || !body.submitterName) {
    throw createError({ statusCode: 400, message: 'displayName and submitterName are required' })
  }

  const sb = useSupabase()
  const now = new Date().toISOString()
  const displayName = toNameTitleCase(body.displayName)
  const submitterName = toNameTitleCase(body.submitterName)
  const guestNames = titleCaseNames(body.guestNames)
  const kidsNames = titleCaseNames(body.kidsNames)
  if (!displayName || !submitterName) {
    throw createError({ statusCode: 400, message: 'displayName and submitterName are required' })
  }

  const { data: maxData } = await sb
    .from('rsvps')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder = ((maxData?.[0]?.sort_order ?? 0) as number) + 1

  const { data, error } = await sb
    .from('rsvps')
    .insert({
      display_name: displayName,
      submitter_name: submitterName,
      contact: body.contact || null,
      headcount: body.headcount ?? 1,
      guest_names: guestNames.length ? guestNames : null,
      kids_names: kidsNames.length ? kidsNames : null,
      dietary_notes: body.dietaryNotes || null,
      status: body.attending === 'no' ? 'declined' : 'confirmed',
      show_on_public: body.attending === 'yes',
      sort_order: nextOrder,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  void logAction('created', 'rsvp', `Public RSVP: ${data.display_name}`, data.id)

  if (body.attending === 'no') {
    return { ok: true, id: data.id, attending: false, displayName: data.display_name }
  }

  const { data: gridRows, error: gridError } = await sb
    .from('rsvps')
    .select('id, display_name, grid_name, headcount, guest_names')
    .is('deleted_at', null)
    .eq('show_on_public', true)
    .eq('status', 'confirmed')
    .order('sort_order', { ascending: true })

  if (gridError) throw createError({ statusCode: 500, message: gridError.message })

  const counters: Record<string, number> = {}
  const usedTeamNames = new Set<string>()
  let gridPosition: number | undefined
  let teamName: string | undefined

  for (const [index, row] of (gridRows ?? []).entries()) {
    const headcount = row.headcount ?? 1
    const key = headcount <= 2 ? String(headcount) : 'group'
    const salt = counters[key] ?? 0
    counters[key] = salt + 1
    const rowDisplayName = toNameTitleCase(row.grid_name || row.display_name)
    const rowTeamName = reserveUniqueTeamName(
      rowDisplayName,
      headcount,
      titleCaseNames(row.guest_names),
      salt,
      usedTeamNames,
    )

    if (String(row.id) === String(data.id)) {
      gridPosition = index + 1
      teamName = rowTeamName
    }
  }

  return {
    ok: true,
    id: data.id,
    attending: true,
    displayName: data.display_name,
    gridPosition,
    teamName,
  }
})
