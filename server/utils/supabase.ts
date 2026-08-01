// ⚠️ SERVER ONLY — never import in components, composables, or any client-accessible code.
// Uses SERVICE_ROLE key which bypasses all RLS.

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

// typed as any so table names resolve without a generated schema file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSupabase(): any {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  // CF Workers have native WebSocket; Node.js < 22 needs the ws package
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transport: any = typeof globalThis.WebSocket !== 'undefined' ? globalThis.WebSocket : ws
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { transport },
  })
  return _client
}

export function toRsvp(r: any) {
  return {
    id: r.id,
    displayName: r.display_name,
    submitterName: r.submitter_name,
    contact: r.contact,
    headcount: r.headcount,
    guestNames: r.guest_names ?? [],
    kidsNames: r.kids_names ?? [],
    dietaryNotes: r.dietary_notes,
    status: r.status,
    showOnPublic: r.show_on_public,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toActivity(r: any) {
  return {
    id: r.id,
    lapNumber: r.lap_number,
    label: r.label,
    time: r.time,
    venueName: r.venue_name,
    address: r.address,
    note: r.note,
    isVisible: r.is_visible,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toPhoto(r: any) {
  return {
    id: r.id,
    url: r.url,
    storageKey: r.storage_key,
    uploaderName: r.uploader_name,
    caption: r.caption,
    status: r.status,
    isFeatured: r.is_featured,
    showOnPublic: r.show_on_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toCapsule(r: any) {
  return {
    id: r.id,
    submitterName: r.submitter_name,
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toContribution(r: any) {
  return {
    id: r.id,
    submitterName: r.submitter_name,
    amount: r.amount,
    message: r.message,
    proofUrl: r.proof_url,
    showOnPublic: r.show_on_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toFundSettings(r: any) {
  return {
    id: r.id,
    goal: r.goal,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toActivityLog(r: any) {
  return {
    id: r.id,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    description: r.description,
    createdAt: r.created_at,
  }
}
