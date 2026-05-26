import { useDb } from '../../../db/index'
import { contributions } from '../../../db/schema'
import { logAction } from '../../../utils/log'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.submitterName || !body.amount) {
    throw createError({ statusCode: 400, message: 'submitterName and amount are required' })
  }

  const db = useDb()
  const now = new Date().toISOString()

  const [created] = await db.insert(contributions).values({
    submitterName: body.submitterName,
    amount: Number(body.amount),
    message: body.message || null,
    showOnPublic: body.showOnPublic !== false,
    createdAt: now,
    updatedAt: now,
  }).returning()

  logAction('created', 'contribution', `New contribution: ₱${body.amount} from ${body.submitterName}`, created.id)
  return created
})
