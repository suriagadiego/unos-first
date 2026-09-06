<script setup lang="ts">
/**
 * CameraViewfinder — adapted from GuestCamera.vue reference.
 * Streams live camera into a <video>, captures via canvas,
 * bakes a disposable-cam filter + timestamp into the JPEG,
 * and emits the Blob. Handles in-app browsers, permission errors,
 * iOS tap-to-start, camera flip, and file-input fallback.
 */
const props = defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ captured: [blob: Blob]; failed: [message: string] }>()

type CamStatus = 'idle' | 'starting' | 'live' | 'denied' | 'nocam' | 'unsupported'

const status = ref<CamStatus>('idle')
const videoEl = ref<HTMLVideoElement>()
const fileRef = ref<HTMLInputElement>()
const facingMode = ref<'environment' | 'user'>('environment')
const flashing = ref(false)
const processingFile = ref(false)

let stream: MediaStream | null = null

const ua = import.meta.client ? navigator.userAgent || '' : ''
const isInAppBrowser = /FBAN|FBAV|Instagram|Line\/|Twitter|MicroMessenger|; wv\)/.test(ua)
const isIOS = /iPad|iPhone|iPod/.test(ua) && !(globalThis as any).MSStream

const canShoot = computed(() => status.value === 'live' && !props.disabled)

onMounted(() => {
  if (isInAppBrowser) { status.value = 'unsupported'; return }
  if (!navigator.mediaDevices?.getUserMedia) status.value = 'unsupported'
})

async function start() {
  if (!navigator.mediaDevices?.getUserMedia) { status.value = 'unsupported'; return }
  status.value = 'starting'
  stopTracks()
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: facingMode.value }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      await videoEl.value.play().catch(() => {})
    }
    status.value = 'live'
  } catch (err: any) {
    stream = null
    if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') status.value = 'denied'
    else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') status.value = 'nocam'
    else status.value = 'unsupported'
  }
}

async function flipCamera() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  if (status.value === 'live') await start()
}

function capture() {
  if (!canShoot.value || !videoEl.value) return
  const v = videoEl.value
  const vw = v.videoWidth
  const vh = v.videoHeight
  if (!vw || !vh) return

  const canvas = document.createElement('canvas')
  const { width, height } = boundedDimensions(vw, vh)
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  if (facingMode.value === 'user') {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(v, 0, 0, width, height)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  applyDisposableLook(ctx, width, height)

  flashing.value = true
  setTimeout(() => (flashing.value = false), 120)

  canvas.toBlob(blob => { if (blob) emit('captured', blob) }, 'image/jpeg', 0.92)
}

// Bake warm tones + grain + vignette + orange timestamp into the JPEG
function applyDisposableLook(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    // Warm + contrast
    d[i]     = clamp((clamp(d[i]     * 1.06 + 8)  - 128) * 1.08 + 128)
    d[i + 1] = clamp((clamp(d[i + 1] * 1.02)       - 128) * 1.08 + 128)
    d[i + 2] = clamp((clamp(d[i + 2] * 0.94)       - 128) * 1.08 + 128)
    // Grain
    const n = (Math.random() - 0.5) * 18
    d[i]     = clamp(d[i]     + n)
    d[i + 1] = clamp(d[i + 1] + n)
    d[i + 2] = clamp(d[i + 2] + n)
  }
  ctx.putImageData(img, 0, 0)

  // Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)

  // Orange datestamp (classic disposable camera look)
  const stamp = new Date().toLocaleString('en-PH', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  const fs = Math.round(h * 0.035)
  ctx.font = `${fs}px "Courier New", monospace`
  ctx.textAlign = 'right'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 4
  ctx.fillStyle = '#ff8c2e'
  ctx.fillText(stamp, w - fs, h - fs)
  ctx.shadowBlur = 0
}

const clamp = (n: number) => (n < 0 ? 0 : n > 255 ? 255 : n)

async function onFileFallback(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  processingFile.value = true
  try {
    emit('captured', await normalizeImage(file))
  } catch {
    emit('failed', 'That photo format could not be opened. Try a JPEG or take a new photo.')
  } finally {
    processingFile.value = false
  }
}

async function normalizeImage(file: File): Promise<Blob> {
  const source = await decodeImage(file)
  try {
    const sourceWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width
    const sourceHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height
    const { width, height } = boundedDimensions(sourceWidth, sourceHeight)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(source, 0, 0, width, height)
    applyDisposableLook(ctx, width, height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image conversion failed')), 'image/jpeg', 0.92)
    })
  } finally {
    if ('close' in source && typeof source.close === 'function') source.close()
  }
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch { /* Safari may decode via img instead */ }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

function boundedDimensions(width: number, height: number) {
  const max = 2560
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function stopTracks() {
  stream?.getTracks().forEach(t => t.stop())
  stream = null
}

onUnmounted(stopTracks)

defineExpose({ capture, start, status, flipCamera })
</script>

<template>
  <div class="absolute inset-0 bg-[#080808] overflow-hidden"
    style="user-select:none;-webkit-user-select:none">

    <!-- Live video -->
    <video
      ref="videoEl"
      autoplay muted playsinline webkit-playsinline
      class="absolute inset-0 w-full h-full object-cover"
      :class="{ 'scale-x-[-1]': facingMode === 'user' }"
    />

    <!-- Shutter flash -->
    <div v-if="flashing" class="absolute inset-0 bg-white pointer-events-none z-20"
      style="animation:camFlash 0.12s ease-out forwards" />

    <div v-if="processingFile"
      class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75 text-white"
      role="status" aria-live="polite">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-[#6B8CAE]" />
      <p class="font-racing text-sm tracking-[0.2em]">PROCESSING PHOTO…</p>
    </div>

    <!-- ── IN-APP BROWSER ── -->
    <div v-if="isInAppBrowser"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div class="text-5xl">📵</div>
      <div>
        <p class="font-racing text-white text-xl tracking-widest mb-2">OPEN IN SAFARI</p>
        <p class="font-sans text-white/50 text-sm leading-relaxed">
          Tap <span class="text-[#6B8CAE]">⋯</span> and choose
          <span class="text-[#6B8CAE] font-semibold">{{ isIOS ? 'Open in Safari' : 'Open in Chrome' }}</span>.
        </p>
      </div>
      <label class="cursor-pointer px-5 py-3 rounded-xl border border-white/15 text-white/60 text-sm font-sans">
        …or upload from library
        <input type="file" accept="image/*" class="sr-only" @change="onFileFallback" />
      </label>
    </div>

    <!-- ── DENIED ── -->
    <div v-else-if="status === 'denied'"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div class="text-5xl">🔒</div>
      <p class="font-racing text-white text-xl tracking-widest">CAMERA BLOCKED</p>
      <p class="font-sans text-white/50 text-sm">Allow camera in browser settings, then reload.</p>
      <label class="cursor-pointer px-5 py-3 rounded-xl border border-white/15 text-white/60 text-sm font-sans">
        Upload instead
        <input type="file" accept="image/*" class="sr-only" @change="onFileFallback" />
      </label>
    </div>

    <!-- ── NO CAM / UNSUPPORTED ── -->
    <div v-else-if="status === 'nocam' || status === 'unsupported'"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div class="text-5xl">📁</div>
      <p class="font-racing text-white text-xl tracking-widest">UPLOAD MODE</p>
      <label class="cursor-pointer px-5 py-3 rounded-xl border border-[#6B8CAE]/50 text-[#6B8CAE] text-sm font-sans">
        Choose photo
        <input type="file" accept="image/*" capture="environment" class="sr-only" @change="onFileFallback" />
      </label>
    </div>

    <!-- ── IDLE / STARTING ── -->
    <button v-else-if="status === 'idle' || status === 'starting'"
      @click="start" :disabled="status === 'starting'"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 w-full disabled:opacity-50">
      <div class="absolute inset-0"
        style="background-image:linear-gradient(rgba(107,140,174,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(107,140,174,.06) 1px,transparent 1px);background-size:40px 40px" />
      <div class="absolute top-5 left-5 w-8 h-8 border-t-[2.5px] border-l-[2.5px] border-[#6B8CAE]/60" />
      <div class="absolute top-5 right-5 w-8 h-8 border-t-[2.5px] border-r-[2.5px] border-[#6B8CAE]/60" />
      <div class="absolute bottom-5 left-5 w-8 h-8 border-b-[2.5px] border-l-[2.5px] border-[#6B8CAE]/60" />
      <div class="absolute bottom-5 right-5 w-8 h-8 border-b-[2.5px] border-r-[2.5px] border-[#6B8CAE]/60" />
      <div class="relative text-center">
        <div v-if="status === 'starting'" class="w-8 h-8 mx-auto rounded-full border-2 border-[#6B8CAE]/60 border-t-transparent animate-spin mb-4" />
        <div v-else class="text-5xl mb-4 opacity-30">📷</div>
        <p class="font-racing text-white text-xl tracking-[0.3em] mb-2">
          {{ status === 'starting' ? 'STARTING…' : 'TAP TO START' }}
        </p>
        <p class="font-sans text-white/30 text-[10px] uppercase tracking-[0.25em]">Allow camera when prompted</p>
      </div>
    </button>

    <!-- ── LIVE OVERLAYS ── -->
    <template v-if="status === 'live'">
      <div class="absolute inset-0 pointer-events-none"
        style="background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.4) 100%)" />
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="absolute inset-x-20 h-px bg-[#6B8CAE]/10" />
        <div class="absolute inset-y-20 w-px bg-[#6B8CAE]/10" />
        <div class="w-3 h-3 rounded-full border border-[#6B8CAE]/25" />
      </div>
      <div class="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-white/25 pointer-events-none" />
      <div class="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-white/25 pointer-events-none" />
      <div class="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-white/25 pointer-events-none" />
      <div class="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-white/25 pointer-events-none" />
      <button @click="flipCamera"
        type="button" aria-label="Switch between front and rear camera"
        class="camera-flip-button absolute top-8 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center z-10 transition-opacity hover:opacity-100 opacity-60">
        <img src="~/assets/images/reverse-camera.svg" class="w-[30px] h-[30px]" alt="" />
      </button>
    </template>

    <input ref="fileRef" type="file" accept="image/*" class="sr-only" @change="onFileFallback" />
  </div>
</template>

<style scoped>
@media (orientation: landscape) {
  .camera-flip-button {
    top: 16px;
    right: 124px;
    z-index: 30;
  }
}

@keyframes camFlash { from { opacity: 0.85; } to { opacity: 0; } }
</style>
