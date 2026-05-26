import { requireAdmin } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/admin/')) return
  await requireAdmin(event)
})
