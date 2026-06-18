export interface ShotStatus {
  taken: number
  remaining: number
  limit: number
}

export function useGuestCamera() {
  const guestId = useState<string>('guest_id', () => '')
  const shots = useState<ShotStatus | null>('guest_shots', () => null)
  const authReady = useState<boolean>('guest_cam_ready', () => false)

  function ensureAuth() {
    if (!import.meta.client) return
    let id = localStorage.getItem('uno_cam_guest_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('uno_cam_guest_id', id)
    }
    guestId.value = id
    authReady.value = true
  }

  function authHeaders(): Record<string, string> {
    return guestId.value ? { 'X-Guest-Id': guestId.value } : {}
  }

  async function fetchShots() {
    if (!guestId.value) return
    shots.value = await $fetch<ShotStatus>('/api/cam/shots', { headers: authHeaders() })
  }

  return { ensureAuth, authHeaders, fetchShots, shots, authReady, guestId }
}
