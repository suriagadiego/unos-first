export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return

  try {
    // On a full-page SSR request, forward the browser's cookies to the
    // internal auth endpoint. Plain $fetch does not carry them server-side.
    const requestFetch = import.meta.server ? useRequestFetch() : $fetch
    await requestFetch('/api/auth/me')
  } catch {
    return navigateTo('/admin/login', { replace: true })
  }
})
