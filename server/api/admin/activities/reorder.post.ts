import { useSupabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { order } = await readBody(event)
  if (!Array.isArray(order)) throw createError({ statusCode: 400, message: 'order must be an array' })

  const sb = useSupabase()
  const now = new Date().toISOString()

  await Promise.all(
    order.map((id: number, index: number) =>
      sb.from('activities').update({
        sort_order: index,
        lap_number: String(index + 1).padStart(2, '0'),
        updated_at: now,
      }).eq('id', id)
    )
  )

  return { ok: true }
})
