export default defineEventHandler((event) => {
  deleteCookie(event, 'admin_token', { path: '/' })
  return { ok: true }
})
