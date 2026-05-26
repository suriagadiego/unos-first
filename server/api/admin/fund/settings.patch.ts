import { useDb } from '../../../db/index'
import { fundSettings } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()
  const now = new Date().toISOString()

  let [settings] = await db.select().from(fundSettings).limit(1)
  if (!settings) {
    ;[settings] = await db.insert(fundSettings).values({ goal: body.goal, createdAt: now, updatedAt: now }).returning()
  } else {
    ;[settings] = await db.update(fundSettings).set({ goal: body.goal, updatedAt: now }).where(eq(fundSettings.id, settings.id)).returning()
  }

  logAction('updated', 'fund_settings', `Fund goal updated to ${body.goal}`)
  return settings
})
