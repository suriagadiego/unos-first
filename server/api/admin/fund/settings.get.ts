import { useDb } from '../../../db/index'
import { fundSettings } from '../../../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  const [settings] = await db.select().from(fundSettings).limit(1)
  return settings
})
