import { useDb } from '../db/index'
import { activityLog } from '../db/schema'

export function logAction(
  action: string,
  entityType: string,
  description: string,
  entityId?: number,
) {
  try {
    const db = useDb()
    db.insert(activityLog).values({
      action,
      entityType,
      entityId: entityId ?? null,
      description,
      createdAt: new Date().toISOString(),
    }).run()
  } catch {
    // non-fatal
  }
}
