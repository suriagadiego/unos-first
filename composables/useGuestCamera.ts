import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient, Session } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_supabase) return _supabase
  const config = useRuntimeConfig()
  _supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
  return _supabase
}

export interface ShotStatus {
  taken: number
  remaining: number
  limit: number
}

export function useGuestCamera() {
  const session = useState<Session | null>('guest_cam_session', () => null)
  const shots = useState<ShotStatus | null>('guest_cam_shots', () => null)
  const authReady = useState<boolean>('guest_cam_ready', () => false)

  function authHeaders(): Record<string, string> {
    const token = session.value?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function ensureAuth() {
    if (!import.meta.client) return
    const supabase = getClient()
    const { data: { session: existing } } = await supabase.auth.getSession()
    if (existing) {
      session.value = existing
    } else {
      const { data } = await supabase.auth.signInAnonymously()
      session.value = data.session
    }
    authReady.value = true
  }

  async function setDisplayName(name: string) {
    if (!name.trim() || !session.value?.access_token) return
    await $fetch('/api/cam/session', {
      method: 'POST',
      headers: authHeaders(),
      body: { displayName: name.trim() },
    })
  }

  async function fetchShots() {
    if (!session.value) return
    shots.value = await $fetch<ShotStatus>('/api/cam/shots', { headers: authHeaders() })
  }

  return { ensureAuth, authHeaders, setDisplayName, fetchShots, session, shots, authReady }
}
