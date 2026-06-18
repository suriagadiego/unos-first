import { useSupabase } from './supabase'

export function logAction(
  action: string,
  entityType: string,
  description: string,
  entityId?: string | number,
) {
  useSupabase()
    .from('activity_log')
    .insert({
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      description,
      created_at: new Date().toISOString(),
    })
    .then(({ error }: { error: any }) => {
      if (error) console.error('[logAction] failed:', error.message)
    })
}
