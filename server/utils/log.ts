import { useSupabase } from './supabase'

export function logAction(
  action: string,
  entityType: string,
  description: string,
  entityId?: number,
) {
  void useSupabase()
    .from('activity_log')
    .insert({
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      description,
      created_at: new Date().toISOString(),
    })
}
