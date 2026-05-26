import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'

function getSecret() {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'change-this-secret-before-deploying')
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
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
