import { verifyAdminToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'admin_token')
  if (!token) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const valid = await verifyAdminToken(token)
  if (!valid) throw createError({ statusCode: 401, message: 'Unauthorized' })
  return { authenticated: true }
})
