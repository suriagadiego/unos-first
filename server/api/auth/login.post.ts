import { createAdminToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  if (body?.password !== password) {
    throw createError({ statusCode: 401, message: 'Incorrect password' })
  }

  const token = await createAdminToken()

  setCookie(event, 'admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { ok: true }
})
