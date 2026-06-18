import { useSupabase } from './supabase'

export async function requireGuest(event: Parameters<typeof getHeader>[0]): Promise<string> {
  const token = getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { data: { user }, error } = await useSupabase().auth.getUser(token)
  if (error || !user) throw createError({ statusCode: 401, message: 'Invalid session' })

  return user.id
}
