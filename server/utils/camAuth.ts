const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function requireGuest(event: Parameters<typeof getHeader>[0]): string {
  const guestId = getHeader(event, 'x-guest-id')?.trim()
  if (!guestId || !UUID_RE.test(guestId)) {
    throw createError({ statusCode: 400, message: 'Missing or invalid guest ID' })
  }
  return guestId
}
