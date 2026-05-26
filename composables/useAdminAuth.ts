export const useAdminAuth = () => {
  const isAuthenticated = useState('admin_auth', () => false)

  async function checkAuth(): Promise<boolean> {
    try {
      await $fetch('/api/auth/me')
      isAuthenticated.value = true
      return true
    } catch {
      isAuthenticated.value = false
      return false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    isAuthenticated.value = false
    await navigateTo('/admin/login')
  }

  return { isAuthenticated, checkAuth, logout }
}
