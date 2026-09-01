import { useSupabase } from '../../utils/supabase'
import { logAction } from '../../utils/log'
import { deleteFromStorage, getObjectStorage, uploadToStorage } from '../../utils/storage'
import { readBoundedFormData } from '../../utils/boundedFormData'
import { MAX_PROOF_FILE_BYTES, proofExtension, validateProofImage } from '../../utils/proofUpload'

const MAX_CONTRIBUTION_AMOUNT = 1_000_000

export default defineEventHandler(async (event) => {
  const form = await readBoundedFormData(
    event,
    MAX_PROOF_FILE_BYTES + 512 * 1024,
    'Proof image is too large. Maximum size is 8 MB.',
  )
  const submitterName = String(form.get('submitterName') || '').trim().slice(0, 80)
  const rawAmount = String(form.get('amount') || '')
  const message = String(form.get('message') || '').trim().slice(0, 500)
  const proof = form.get('proof') as File | null

  if (!submitterName || !rawAmount) {
    throw createError({ statusCode: 400, message: 'Name and amount are required' })
  }
  if (!proof || proof.size === 0) {
    throw createError({ statusCode: 400, message: 'Proof of transfer is required' })
  }

  const amount = Number(rawAmount)
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_CONTRIBUTION_AMOUNT) {
    throw createError({ statusCode: 400, message: 'Amount must be between ₱1 and ₱1,000,000.' })
  }
  const proofBytes = new Uint8Array(await proof.arrayBuffer())
  validateProofImage(proof, proofBytes)

  const sb = useSupabase()
  const now = new Date().toISOString()
  const storage = getObjectStorage()
  const storageKey = `fund-proofs/${crypto.randomUUID()}.${proofExtension(proof.type)}`
  const proofUrl = `${storage.endpoint}/${storage.bucket}/${storageKey}`

  try {
    await uploadToStorage(storage, storageKey, proofBytes.buffer as ArrayBuffer, proof.type)
  } catch (uploadError) {
    console.error(JSON.stringify({
      message: 'fund proof upload failed',
      storageKey,
      error: uploadError instanceof Error ? uploadError.message : String(uploadError),
    }))
    throw createError({ statusCode: 502, message: 'Proof upload failed. Please try again.' })
  }

  const { data, error } = await sb
    .from('contributions')
    .insert({
      submitter_name: submitterName,
      amount,
      message: message || null,
      proof_url: proofUrl,
      // Public submissions are approved immediately so the fund wall and
      // contributor count update as soon as the donor receives their pass.
      show_on_public: true,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    await Promise.allSettled([deleteFromStorage(storage, storageKey)])
    console.error(JSON.stringify({ message: 'fund contribution insert failed', storageKey, error: error.message }))
    throw createError({ statusCode: 500, message: 'Could not save contribution. Please try again.' })
  }

  void logAction('created', 'contribution', `Public submission: ₱${amount} from ${submitterName}`, data.id)
  return { ok: true, id: data.id }
})
