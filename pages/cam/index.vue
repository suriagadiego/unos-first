<script setup lang="ts">
definePageMeta({ layout: false })

const viewfinderRef = ref<{ capture: () => void; start: () => void; status: Ref<string>; flipCamera: () => void }>()
const { ensureAuth, authHeaders, fetchShots, shots, authReady, guestId } = useGuestCamera()

interface Shot { src: string; status: 'uploading' | 'done' | 'error'; blob: Blob; name: string | null; uploadId: string }

const UPLOAD_TIMEOUT_MS = 90_000

const flash = ref(false)
const snapSrc = ref<string | null>(null)  // snapshot pop preview
const firing = ref(false)        // shutter bounce on capture
const counterPop = ref(false)    // counter tick-down pop
const checkPulse = ref(false)    // checkmark pop when upload lands
const lastShot = ref<Shot | null>(null)   // corner thumbnail + upload state
const errorMessage = ref('')
const uploading = computed(() => lastShot.value?.status === 'uploading')
let uploadController: AbortController | null = null

const showNamePrompt = ref(false)
const nameInput = ref('')

const rollFull = computed(() => (shots.value?.remaining ?? 1) <= 0)
const shutterDisabled = computed(() => rollFull.value || uploading.value)

onMounted(async () => {
  ensureAuth()
  await fetchShots()
  const hadName = localStorage.getItem('uno_cam_name')
  if (!hadName) showNamePrompt.value = true
})

function saveName() {
  if (!nameInput.value.trim()) return
  localStorage.setItem('uno_cam_name', nameInput.value.trim())
  showNamePrompt.value = false
}

function skipName() {
  localStorage.setItem('uno_cam_name', '__skip__')
  showNamePrompt.value = false
}

function onShutter() {
  if (rollFull.value) return
  const camStatus = viewfinderRef.value?.status?.value ?? viewfinderRef.value?.status
  if (camStatus === 'idle') {
    viewfinderRef.value?.start()
  } else if (camStatus === 'live') {
    viewfinderRef.value?.capture()
  }
}

async function onCaptured(blob: Blob) {
  if (rollFull.value || blob.size === 0) return

  // 1. Flash
  flash.value = true
  setTimeout(() => (flash.value = false), 200)

  // 2. Shutter bounce
  firing.value = true
  setTimeout(() => (firing.value = false), 160)

  // 3. Snapshot pop
  if (lastShot.value?.src) URL.revokeObjectURL(lastShot.value.src)
  const src = URL.createObjectURL(blob)
  snapSrc.value = src
  setTimeout(() => {
    if (snapSrc.value === src) snapSrc.value = null
  }, 900)

  // 5. Thumbnail takes over with upload state
  const name = localStorage.getItem('uno_cam_name')
  lastShot.value = {
    src,
    status: 'uploading',
    blob,
    name: name && name !== '__skip__' ? name : null,
    uploadId: crypto.randomUUID(),
  }

  await doUpload()
}

// Always works through lastShot.value — the reactive proxy. Mutating the raw
// object instead leaves `uploading` (and so the shutter) stuck on its last value.
async function doUpload() {
  const shot = lastShot.value
  if (!shot) return
  shot.status = 'uploading'
  errorMessage.value = ''
  uploadController = new AbortController()
  const timeout = setTimeout(() => uploadController?.abort(), UPLOAD_TIMEOUT_MS)
  try {
    const form = new FormData()
    form.append('photo', shot.blob, 'shot.jpg')
    form.append('uploadId', shot.uploadId)
    if (shot.name) form.append('guestName', shot.name)
    const result = await $fetch<{ key: string; url: string; remaining: number; limit: number }>('/api/cam/upload', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
      signal: uploadController.signal,
    })
    shot.status = 'done'

    // 4. Counter ticks down with a pop
    if (shots.value) {
      shots.value.limit = result.limit
      shots.value.remaining = result.remaining
      shots.value.taken = result.limit - result.remaining
    }
    counterPop.value = true
    setTimeout(() => (counterPop.value = false), 320)

    // Checkmark pulse
    checkPulse.value = true
    setTimeout(() => (checkPulse.value = false), 900)
  } catch (error: any) {
    shot.status = 'error'
    errorMessage.value = uploadController?.signal.aborted
      ? 'Upload timed out. Tap the photo to retry.'
      : error?.data?.message || error?.message || 'Upload failed. Check your connection and try again.'
  } finally {
    clearTimeout(timeout)
    uploadController = null
  }
}

function retry() {
  if (lastShot.value?.status === 'error') doUpload()
}

function onCaptureFailed(message: string) {
  errorMessage.value = message
}

onUnmounted(() => {
  uploadController?.abort()
  if (lastShot.value?.src) URL.revokeObjectURL(lastShot.value.src)
})
</script>

<template>
  <div class="bg-[#080808] flex items-center justify-center" style="height:100dvh">

    <!-- ── BEZEL ── -->
    <div class="relative w-full mx-3 rounded-[28px] overflow-hidden" style="height:calc(100dvh - 24px)">

      <!-- ── FULL SCREEN CAMERA ── -->
      <CameraViewfinder
        ref="viewfinderRef"
        :disabled="shutterDisabled"
        @captured="onCaptured"
        @failed="onCaptureFailed"
      />

      <div class="sr-only" aria-live="polite">{{ errorMessage }}</div>
      <div v-if="errorMessage" role="alert"
        class="absolute top-24 left-4 right-4 z-40 rounded-xl border border-red-400/40 bg-red-950/90 px-4 py-3 text-sm text-white shadow-xl">
        <div class="flex items-start justify-between gap-3">
          <span>{{ errorMessage }}</span>
          <button type="button" class="text-white/60" aria-label="Dismiss error" @click="errorMessage = ''">×</button>
        </div>
      </div>

      <!-- White flash -->
      <Transition name="flash">
        <div v-if="flash" class="absolute inset-0 z-50 bg-white pointer-events-none" />
      </Transition>

      <!-- Snapshot pop — photo zooms in as a tilted Polaroid -->
      <Transition name="polaroid">
        <div v-if="snapSrc" class="absolute inset-0 z-[51] flex items-center justify-center pointer-events-none">
          <div class="polaroid-card bg-white rounded-md shadow-2xl p-2 pb-9">
            <div class="w-44 h-44 rounded-sm overflow-hidden bg-black">
              <img :src="snapSrc" class="w-full h-full object-cover" style="filter:contrast(1.05) saturate(0.85)" />
            </div>
            <p class="font-script text-[#6B8CAE] text-3xl text-center mt-1.5 leading-none">Snapped!</p>
          </div>
        </div>
      </Transition>

      <!-- Name prompt -->
      <Transition name="dev">
        <div v-if="showNamePrompt && authReady"
          class="absolute inset-0 z-30 bg-[#080808]/95 flex flex-col items-center justify-center px-8 gap-6">
          <div class="text-center">
            <p class="font-racing text-white text-2xl tracking-widest mb-2">WHO ARE YOU?</p>
            <p class="font-sans text-white/40 text-sm">So Uno knows who took these shots</p>
          </div>
          <input v-model="nameInput" type="text" placeholder="Your name" maxlength="40"
            class="w-full max-w-sm px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 font-sans text-base focus:outline-none focus:border-[#6B8CAE]/60"
            @keyup.enter="saveName" />
          <button @click="saveName" :disabled="!nameInput.trim()"
            class="w-full max-w-sm py-3 rounded-xl bg-[#6B8CAE] text-white font-sans text-sm font-semibold disabled:opacity-30 transition-opacity">
            Let's go →
          </button>
          <button type="button" class="text-white/35 text-sm underline underline-offset-4" @click="skipName">
            Continue anonymously
          </button>
        </div>
      </Transition>

      <!-- Roll complete -->
      <div v-if="rollFull"
        class="absolute inset-0 z-20 bg-[#080808]/85 flex flex-col items-center justify-center gap-5 pointer-events-none">
        <div class="text-[52px]">🏁</div>
        <div class="text-center">
          <p class="font-racing text-white text-3xl tracking-widest">CHECKERED!</p>
          <p class="font-sans text-white/40 text-[10px] uppercase tracking-[0.2em] mt-2">
            {{ shots?.limit ?? 24 }} shots · Roll complete
          </p>
          <NuxtLink to="/gallery"
            class="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#6B8CAE] text-white font-sans text-sm font-medium pointer-events-auto">
            See all photos →
          </NuxtLink>
        </div>
      </div>

      <!-- ── HEADER (overlaid) ── -->
      <div class="absolute top-0 left-0 right-0 z-10 flex items-start px-5 pt-12 pb-8 pointer-events-none"
        style="background:linear-gradient(to bottom,rgba(0,0,0,0.55) 0%,transparent 100%)">
        <div>
          <p class="font-racing text-white text-[26px] tracking-widest leading-none">UNO CAM</p>
          <p class="text-[#6B8CAE]/60 text-[9px] uppercase tracking-[0.3em] mt-1 font-sans">FAST ONE · SEPT 6 2026</p>
        </div>
      </div>

      <!-- ── BOTTOM CONTROLS (overlaid) ── -->
      <div class="absolute bottom-0 left-0 right-0 z-10 pb-10 pt-8"
        style="background:linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 100%)">
        <div class="relative flex items-center justify-center" style="height:78px">

          <!-- Corner thumbnail with upload state -->
          <div class="absolute left-8">
            <div v-if="lastShot" class="relative w-12 h-12">
              <!-- Error → tappable retry; otherwise → gallery link -->
              <button v-if="lastShot.status === 'error'" @click="retry"
                class="relative block w-12 h-12 rounded-xl overflow-hidden border border-red-400/70">
                <img :src="lastShot.src" class="w-full h-full object-cover" style="filter:saturate(0.4) brightness(0.5)" />
                <div class="absolute inset-0 flex items-center justify-center bg-red-900/50">
                  <span class="text-white text-lg leading-none">↻</span>
                </div>
              </button>

              <NuxtLink v-else to="/gallery"
                class="relative block w-12 h-12 rounded-xl overflow-hidden border border-white/20">
                <img :src="lastShot.src" class="w-full h-full object-cover"
                  :style="lastShot.status === 'uploading' ? 'filter:saturate(0.4) brightness(0.5)' : 'filter:saturate(0.55) brightness(0.75)'" />

                <!-- Uploading: progress ring -->
                <div v-if="lastShot.status === 'uploading'" class="absolute inset-0 flex items-center justify-center">
                  <div class="w-5 h-5 rounded-full border-2 border-white/30 border-t-[#6B8CAE] animate-spin" />
                </div>

                <!-- Done: checkmark pulse -->
                <div v-else-if="checkPulse"
                  class="absolute inset-0 flex items-center justify-center bg-black/30"
                  style="animation:checkFade 0.9s ease forwards">
                  <div class="w-5 h-5 rounded-full bg-[#6B8CAE] flex items-center justify-center"
                    style="animation:checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1)">
                    <span class="text-white text-[11px] font-bold leading-none">✓</span>
                  </div>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="w-12 h-12 rounded-xl border border-white/[0.1] flex items-center justify-center">
              <span class="text-white/15 text-xl">🎞</span>
            </div>
          </div>

          <!-- Shutter — dead center -->
          <button
            type="button" aria-label="Take photo"
            @click="onShutter"
            :disabled="shutterDisabled"
            class="relative w-[78px] h-[78px] rounded-full flex items-center justify-center transition-transform active:scale-[0.88] disabled:opacity-25"
            :class="{ 'shutter-fire': firing }"
          >
            <div class="absolute inset-0 rounded-full border-[3px] border-white/30" />
            <div class="w-[64px] h-[64px] rounded-full bg-white flex items-center justify-center shadow-2xl">
              <div class="w-11 h-11 rounded-full border-[2.5px] border-[#6B8CAE]/30" />
            </div>
          </button>

          <!-- LAP / LEFT — right -->
          <div class="absolute right-4 flex items-stretch gap-1.5 bg-black/40 backdrop-blur-sm border border-white/[0.1] rounded-xl px-2 py-1.5 transition-transform"
            :class="{ 'counter-pop': counterPop }">
            <div class="text-center">
              <p class="text-[5px] text-[#6B8CAE] uppercase tracking-[0.2em] font-sans mb-0.5">LAP</p>
              <p class="font-racing text-white text-[19px] leading-none">{{ String(shots?.taken ?? 0).padStart(2, '0') }}</p>
            </div>
            <div class="w-px bg-white/10 self-stretch" />
            <div class="text-center">
              <p class="text-[5px] text-white/25 uppercase tracking-[0.2em] font-sans mb-0.5">LEFT</p>
              <p class="font-racing text-[#A8C5DA] text-[19px] leading-none">{{ String(shots?.remaining ?? '--') }}</p>
            </div>
          </div>

        </div>
      </div>

    </div><!-- end bezel -->
  </div>
</template>

<style scoped>
/* Flash appears instantly, fades out smoothly */
.flash-enter-active { transition: none; }
.flash-leave-active { transition: opacity 0.6s ease-out; }
.flash-leave-to { opacity: 0; }

/* Snapshot Polaroid: springy pop in, gentle drop-away on leave */
.polaroid-card { transform: rotate(-5deg); }
.polaroid-enter-active .polaroid-card { animation: polaroidPop 0.55s cubic-bezier(0.34,1.56,0.64,1); }
.polaroid-enter-active, .polaroid-leave-active { transition: opacity 0.45s ease; }
.polaroid-leave-active .polaroid-card { transition: transform 0.45s ease-in; }
.polaroid-enter-from, .polaroid-leave-to { opacity: 0; }
.polaroid-leave-to .polaroid-card { transform: rotate(-5deg) scale(0.88) translateY(40px); }

@keyframes polaroidPop {
  0%   { transform: scale(0.5) rotate(-8deg); }
  60%  { transform: scale(1.05) rotate(-4deg); }
  100% { transform: scale(1) rotate(-5deg); }
}

/* Shutter bounce on capture */
.shutter-fire { animation: shutterFire 0.16s ease; }
@keyframes shutterFire {
  0%   { transform: scale(1); }
  45%  { transform: scale(0.85); }
  100% { transform: scale(1); }
}

/* Counter tick-down pop */
.counter-pop { animation: counterPop 0.32s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes counterPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}

/* Checkmark */
@keyframes checkPop {
  0%   { transform: scale(0); }
  100% { transform: scale(1); }
}
@keyframes checkFade {
  0%, 70% { opacity: 1; }
  100%    { opacity: 0; }
}

.dev-enter-active, .dev-leave-active { transition: opacity 0.4s ease; }
.dev-enter-from, .dev-leave-to { opacity: 0; }
</style>
