import { createAdminToken, setAdminSessionCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  if (body?.password !== password) {
    throw createError({ statusCode: 401, message: 'Incorrect password' })
  }

  const token = await createAdminToken()
  setAdminSessionCookie(event, token)

  return { ok: true }
})
