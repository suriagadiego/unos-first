import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import { AwsClient } from 'aws4fetch'
import WebSocket from 'ws'

const envFile = await readFile(new URL('../.env', import.meta.url), 'utf8')
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const separator = trimmed.indexOf('=')
  if (separator < 1) continue
  const name = trimmed.slice(0, separator).trim()
  let value = trimmed.slice(separator + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  if (!(name in process.env)) process.env[name] = value
}

const execFileAsync = promisify(execFile)
const required = [
  'RUSTFS_ENDPOINT',
  'RUSTFS_BUCKET',
  'RUSTFS_ACCESS_KEY',
  'RUSTFS_SECRET_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`)
}

if (process.platform !== 'darwin') {
  throw new Error('This one-time backfill uses the macOS sips image utility.')
}

const endpoint = process.env.RUSTFS_ENDPOINT.replace(/\/$/, '')
const bucket = process.env.RUSTFS_BUCKET
const aws = new AwsClient({
  accessKeyId: process.env.RUSTFS_ACCESS_KEY,
  secretAccessKey: process.env.RUSTFS_SECRET_KEY,
  region: process.env.RUSTFS_REGION || 'us-east-1',
  service: 's3',
})
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
})

const { data: rows, error } = await supabase
  .from('camera_uploads')
  .select('id, guest_id, upload_id, storage_key')
  .is('thumbnail_storage_key', null)
  .is('deleted_at', null)
  .eq('upload_state', 'ready')

if (error) throw error

const workDirectory = await mkdtemp(join(tmpdir(), 'uno-camera-thumbs-'))
let originalBytes = 0
let thumbnailBytes = 0
let completed = 0

try {
  for (const row of rows ?? []) {
    const inputPath = join(workDirectory, `${row.id}-original.jpg`)
    const outputPath = join(workDirectory, `${row.id}-thumbnail.jpg`)
    const originalResponse = await aws.fetch(`${endpoint}/${bucket}/${row.storage_key}`)
    if (!originalResponse.ok) throw new Error(`Could not read camera photo ${row.id}: ${originalResponse.status}`)

    const original = Buffer.from(await originalResponse.arrayBuffer())
    originalBytes += original.byteLength
    await writeFile(inputPath, original)
    await execFileAsync('/usr/bin/sips', [
      '-Z', '960',
      '-s', 'format', 'jpeg',
      '-s', 'formatOptions', '72',
      inputPath,
      '--out', outputPath,
    ])

    const thumbnail = await readFile(outputPath)
    const thumbnailKey = `cam-thumbs/${row.guest_id}/${row.upload_id || row.id}.jpg`
    const uploadResponse = await aws.fetch(`${endpoint}/${bucket}/${thumbnailKey}`, {
      method: 'PUT',
      body: thumbnail,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
    if (!uploadResponse.ok) throw new Error(`Could not upload thumbnail for ${row.id}: ${uploadResponse.status}`)

    const { error: updateError } = await supabase
      .from('camera_uploads')
      .update({ thumbnail_storage_key: thumbnailKey })
      .eq('id', row.id)
    if (updateError) throw updateError

    thumbnailBytes += thumbnail.byteLength
    completed++
    console.log(`Backfilled ${completed}/${rows.length}`)
  }
} finally {
  await rm(workDirectory, { recursive: true, force: true })
}

const reduction = originalBytes
  ? Math.round((1 - thumbnailBytes / originalBytes) * 100)
  : 0
console.log(JSON.stringify({
  completed,
  originalMB: Number((originalBytes / 1024 / 1024).toFixed(2)),
  thumbnailMB: Number((thumbnailBytes / 1024 / 1024).toFixed(2)),
  reductionPercent: reduction,
}))
