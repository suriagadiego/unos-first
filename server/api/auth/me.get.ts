import { createAdminToken, setAdminSessionCookie, verifyAdminToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'admin_token')
  if (!token) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const valid = await verifyAdminToken(token)
  if (!valid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // Renew a valid session whenever the Admin app checks authentication.
  const refreshedToken = await createAdminToken()
  setAdminSessionCookie(event, refreshedToken)

  return { authenticated: true }
})
