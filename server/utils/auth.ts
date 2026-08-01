import { SignJWT, jwtVerify } from 'jose'
import { setCookie } from 'h3'
import type { H3Event } from 'h3'

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30

function getSecret() {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'change-this-secret-before-deploying')
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export function setAdminSessionCookie(event: H3Event, token: string) {
  setCookie(event, 'admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
  })
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

export async function requireAdmin(event: H3Event) {
  const token = getCookie(event, 'admin_token')
  if (!token) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const valid = await verifyAdminToken(token)
  if (!valid) throw createError({ statusCode: 401, message: 'Invalid or expired token' })
}
