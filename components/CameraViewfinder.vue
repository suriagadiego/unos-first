<script setup lang="ts">
/**
 * CameraViewfinder — adapted from GuestCamera.vue reference.
 * Streams live camera into a <video>, captures via canvas,
 * bakes a disposable-cam filter + timestamp into the JPEG,
 * and emits the Blob. Handles in-app browsers, permission errors,
 * iOS tap-to-start, camera flip, and file-input fallback.
 */
const props = defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ captured: [blob: Blob] }>()

type CamStatus = 'idle' | 'starting' | 'live' | 'denied' | 'nocam' | 'unsupported'

const status = ref<CamStatus>('idle')
const videoEl = ref<HTMLVideoElement>()
const fileRef = ref<HTMLInputElement>()
const facingMode = ref<'environment' | 'user'>('environment')
const flashing = ref(false)

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

  // Crop center to 3:4 portrait — matches what the preview shows
  const cropW = Math.round(Math.min(vw, vh * 3 / 4))
  const cropH = Math.round(Math.min(vh, vw * 4 / 3))
  const srcX = Math.round((vw - cropW) / 2)
  const srcY = Math.round((vh - cropH) / 2)

  const canvas = document.createElement('canvas')
  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d')!

  // Mirror selfie so saved photo matches preview
  if (facingMode.value === 'user') {
    ctx.translate(cropW, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(v, srcX, srcY, cropW, cropH, 0, 0, cropW, cropH)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  applyDisposableLook(ctx, cropW, cropH)

  flashing.value = true
  setTimeout(() => (flashing.value = false), 120)

  canvas.toBlob(blob => { if (blob) emit('captured', blob) }, 'image/jpeg', 0.9)
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

function onFileFallback(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  emit('captured', file)
}

function stopTracks() {
  stream?.getTracks().forEach(t => t.stop())
  stream = null
}

onUnmounted(stopTracks)

defineExpose({ capture, start, status })
</script>

<template>
  <!-- Outer shell: full area, dark, centers the 3:4 frame -->
  <div class="absolute inset-0 bg-[#080808] flex items-center justify-center"
    style="user-select:none;-webkit-user-select:none">

    <!-- ── 3:4 PHOTO FRAME ── -->
    <!-- h-full + aspect-ratio:3/4 sizes by height; max-width:100% keeps it on screen -->
    <div class="relative overflow-hidden rounded-xl h-full"
      style="aspect-ratio:3/4;max-width:100%">

      <!-- Live video (always in DOM so srcObject assignment works) -->
      <video
        ref="videoEl"
        autoplay muted playsinline webkit-playsinline
        class="absolute inset-0 w-full h-full object-cover"
        :class="{ 'scale-x-[-1]': facingMode === 'user' }"
      />

      <!-- Shutter flash -->
      <div v-if="flashing" class="absolute inset-0 bg-white pointer-events-none z-20"
        style="animation:camFlash 0.12s ease-out forwards" />

      <!-- ── IN-APP BROWSER ── -->
      <div v-if="isInAppBrowser"
        class="absolute inset-0 z-10 bg-[#080808] flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div class="text-5xl">📵</div>
        <div>
          <p class="font-racing text-white text-lg tracking-widest mb-2">OPEN IN SAFARI</p>
          <p class="font-sans text-white/50 text-sm leading-relaxed">
            Tap <span class="text-[#6B8CAE]">⋯</span> →
            <span class="text-[#6B8CAE] font-semibold">{{ isIOS ? 'Open in Safari' : 'Open in Chrome' }}</span>
          </p>
        </div>
        <label class="cursor-pointer px-4 py-2.5 rounded-xl border border-white/15 text-white/60 text-sm font-sans">
          …or upload from library
          <input type="file" accept="image/*" class="sr-only" @change="onFileFallback" />
        </label>
      </div>

      <!-- ── DENIED ── -->
      <div v-else-if="status === 'denied'"
        class="absolute inset-0 z-10 bg-[#080808] flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div class="text-5xl">🔒</div>
        <p class="font-racing text-white text-lg tracking-widest">CAMERA BLOCKED</p>
        <p class="font-sans text-white/50 text-sm">Allow camera in browser settings, then reload.</p>
        <label class="cursor-pointer px-4 py-2.5 rounded-xl border border-white/15 text-white/60 text-sm font-sans">
          Upload instead
          <input type="file" accept="image/*" class="sr-only" @change="onFileFallback" />
        </label>
      </div>

      <!-- ── NO CAM / UNSUPPORTED ── -->
      <div v-else-if="status === 'nocam' || status === 'unsupported'"
        class="absolute inset-0 z-10 bg-[#080808] flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div class="text-5xl">📁</div>
        <p class="font-racing text-white text-lg tracking-widest">UPLOAD MODE</p>
        <label class="cursor-pointer px-4 py-2.5 rounded-xl border border-[#6B8CAE]/50 text-[#6B8CAE] text-sm font-sans">
          Choose photo
          <input type="file" accept="image/*" capture="environment" class="sr-only" @change="onFileFallback" />
        </label>
      </div>

      <!-- ── IDLE / STARTING ── -->
      <button v-else-if="status === 'idle' || status === 'starting'"
        @click="start" :disabled="status === 'starting'"
        class="absolute inset-0 z-10 bg-[#080808] flex flex-col items-center justify-center gap-4 w-full disabled:opacity-50">
        <div class="absolute inset-0"
          style="background-image:linear-gradient(rgba(107,140,174,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(107,140,174,.06) 1px,transparent 1px);background-size:40px 40px" />
        <div class="absolute top-4 left-4 w-7 h-7 border-t-[2px] border-l-[2px] border-[#6B8CAE]/60" />
        <div class="absolute top-4 right-4 w-7 h-7 border-t-[2px] border-r-[2px] border-[#6B8CAE]/60" />
        <div class="absolute bottom-4 left-4 w-7 h-7 border-b-[2px] border-l-[2px] border-[#6B8CAE]/60" />
        <div class="absolute bottom-4 right-4 w-7 h-7 border-b-[2px] border-r-[2px] border-[#6B8CAE]/60" />
        <div class="relative text-center">
          <div v-if="status === 'starting'" class="w-8 h-8 mx-auto rounded-full border-2 border-[#6B8CAE]/60 border-t-transparent animate-spin mb-3" />
          <div v-else class="text-4xl mb-3 opacity-25">📷</div>
          <p class="font-racing text-white text-lg tracking-[0.3em]">
            {{ status === 'starting' ? 'STARTING…' : 'TAP TO START' }}
          </p>
          <p class="font-sans text-white/25 text-[9px] uppercase tracking-[0.25em] mt-1">Allow camera when prompted</p>
        </div>
      </button>

      <!-- ── LIVE OVERLAYS ── -->
      <template v-if="status === 'live'">
        <div class="absolute inset-0 pointer-events-none"
          style="background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.5) 100%)" />
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="absolute inset-x-16 h-px bg-[#6B8CAE]/10" />
          <div class="absolute inset-y-16 w-px bg-[#6B8CAE]/10" />
          <div class="w-2.5 h-2.5 rounded-full border border-[#6B8CAE]/20" />
        </div>
        <div class="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-white/30 pointer-events-none" />
        <div class="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-white/30 pointer-events-none" />
        <div class="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-white/30 pointer-events-none" />
        <div class="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-white/30 pointer-events-none" />
        <button @click="flipCamera"
          class="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 text-lg z-10 transition-colors hover:text-white">
          ⟳
        </button>
      </template>
    </div>

    <input ref="fileRef" type="file" accept="image/*" class="sr-only" @change="onFileFallback" />
  </div>
</template>

<style scoped>
@keyframes camFlash { from { opacity: 0.85; } to { opacity: 0; } }
</style>
