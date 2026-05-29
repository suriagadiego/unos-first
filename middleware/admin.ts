export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return
  if (import.meta.dev) return

  try {
    await $fetch('/api/auth/me')
  } catch {
    return navigateTo('/admin/login', { replace: true })
  }
})
