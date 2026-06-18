<script setup lang="ts">
definePageMeta({ layout: false })

const viewfinderRef = ref<{ capture: () => void; start: () => void; status: Ref<string> }>()
const { ensureAuth, authHeaders, fetchShots, shots, authReady, guestId } = useGuestCamera()

// Local list of photos shot this session (for the film strip)
interface SessionPhoto { id: string; src: string; developed: boolean }
const sessionPhotos = ref<SessionPhoto[]>([])

const developing = ref(false)
const flash = ref(false)
const uploading = ref(false)
const uploadError = ref<string | null>(null)

// Name prompt (shown once if no name set yet)
const showNamePrompt = ref(false)
const nameInput = ref('')
const nameSaved = ref(false)

const rollFull = computed(() => (shots.value?.remaining ?? 1) <= 0)
const shutterDisabled = computed(() => rollFull.value || developing.value || uploading.value)

onMounted(async () => {
  ensureAuth() // sync — just reads/writes localStorage
  await fetchShots()
  const hadName = localStorage.getItem('uno_cam_name')
  if (!hadName) showNamePrompt.value = true
})

function saveName() {
  localStorage.setItem('uno_cam_name', nameInput.value.trim() || '__skip__')
  showNamePrompt.value = false
}

function onShutter() {
  if (developing.value || uploading.value || rollFull.value) return
  const camStatus = viewfinderRef.value?.status?.value ?? viewfinderRef.value?.status
  if (camStatus === 'idle' || camStatus === 'starting') {
    viewfinderRef.value?.start()
  } else {
    viewfinderRef.value?.capture()
  }
}

async function onCaptured(blob: Blob) {
  if (shutterDisabled.value || blob.size === 0) return

  // Flash
  flash.value = true
  setTimeout(() => (flash.value = false), 180)

  // Add placeholder to strip
  const tempId = `tmp-${Date.now()}`
  const src = URL.createObjectURL(blob)
  sessionPhotos.value.push({ id: tempId, src, developed: false })
  developing.value = true
  uploading.value = true
  uploadError.value = null

  // Simulate developing delay (visual only)
  const developTimer = setTimeout(() => {
    const photo = sessionPhotos.value.find(p => p.id === tempId)
    if (photo) photo.developed = true
    developing.value = false
  }, 2200)

  try {
    const form = new FormData()
    form.append('photo', blob, 'shot.jpg')
    const name = localStorage.getItem('uno_cam_name')
    if (name && name !== '__skip__') form.append('guestName', name)
    const result = await $fetch<{ key: string; url: string; remaining: number }>('/api/cam/upload', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    // Update shot count from server response
    if (shots.value) shots.value.remaining = result.remaining
    if (shots.value) shots.value.taken = (shots.value.limit - result.remaining)
  } catch (err: any) {
    uploadError.value = err?.data?.message ?? 'Upload failed'
    clearTimeout(developTimer)
    // Remove failed placeholder
    sessionPhotos.value = sessionPhotos.value.filter(p => p.id !== tempId)
    developing.value = false
  } finally {
    uploading.value = false
  }
}

const lastDeveloped = computed(() => [...sessionPhotos.value].reverse().find(p => p.developed) ?? null)
</script>

<template>
  <div class="relative bg-[#080808] flex flex-col" style="min-height:100dvh">

    <!-- ── FLASH ── -->
    <div v-if="flash" class="absolute inset-0 z-50 bg-white pointer-events-none"
      style="animation:snapFlash 0.18s ease forwards" />

    <!-- ── DEVELOPING OVERLAY ── -->
    <Transition name="dev">
      <div v-if="developing"
        class="absolute inset-0 z-40 bg-[#080808]/93 flex flex-col items-center justify-center pointer-events-none">
        <p class="font-racing text-[#6B8CAE] text-4xl tracking-[0.2em] animate-pulse">DEVELOPING</p>
        <div class="flex gap-2 mt-5">
          <span v-for="n in 3" :key="n"
            class="w-2 h-2 rounded-full bg-[#6B8CAE]/50 animate-bounce"
            :style="`animation-delay:${(n-1)*0.18}s`" />
        </div>
        <p class="font-sans text-white/20 text-[9px] uppercase tracking-[0.25em] mt-5">
          Processing at the pit stop
        </p>
      </div>
    </Transition>

    <!-- ── NAME PROMPT ── -->
    <Transition name="dev">
      <div v-if="showNamePrompt && authReady"
        class="absolute inset-0 z-30 bg-[#080808]/95 flex flex-col items-center justify-center px-8 gap-6">
        <div class="text-center">
          <p class="font-racing text-white text-2xl tracking-widest mb-2">WHO ARE YOU?</p>
          <p class="font-sans text-white/40 text-sm">So Uno knows who took these shots</p>
        </div>
        <input
          v-model="nameInput"
          type="text"
          placeholder="Your name (optional)"
          maxlength="40"
          class="w-full max-w-sm px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 font-sans text-sm focus:outline-none focus:border-[#6B8CAE]/60"
          @keyup.enter="saveName"
        />
        <div class="flex gap-3 w-full max-w-sm">
          <button @click="saveName"
            class="flex-1 py-3 rounded-xl bg-[#6B8CAE] text-white font-sans text-sm font-semibold hover:bg-[#5a7a9c] transition-colors">
            Let's go →
          </button>
          <button @click="saveName"
            class="px-4 py-3 rounded-xl border border-white/10 text-white/40 font-sans text-sm hover:border-white/20 transition-colors">
            Skip
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── HEADER ── -->
    <div class="flex items-start justify-between px-5 pt-7 pb-3 flex-shrink-0">
      <div>
        <p class="font-racing text-white text-[26px] tracking-widest leading-none">UNO CAM</p>
        <p class="text-[#6B8CAE]/50 text-[9px] uppercase tracking-[0.3em] mt-1 font-sans">FAST ONE · SEPT 6 2026</p>
      </div>
      <!-- Shot counter -->
      <div class="flex items-stretch gap-3 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3">
        <div class="text-center">
          <p class="text-[8px] text-[#6B8CAE] uppercase tracking-[0.2em] font-sans mb-0.5">LAP</p>
          <p class="font-racing text-white text-3xl leading-none">
            {{ String(shots?.taken ?? 0).padStart(2, '0') }}
          </p>
        </div>
        <div class="w-px bg-white/10 self-stretch" />
        <div class="text-center">
          <p class="text-[8px] text-white/25 uppercase tracking-[0.2em] font-sans mb-0.5">LEFT</p>
          <p class="font-racing text-white/35 text-3xl leading-none">
            {{ String(shots?.remaining ?? '–').toString().padStart(2, '0') }}
          </p>
        </div>
      </div>
    </div>

    <!-- ── VIEWFINDER ── -->
    <div class="flex-1 mx-4 rounded-2xl overflow-hidden border border-white/[0.07] relative" style="min-height:260px">
      <!-- Roll complete overlay -->
      <div v-if="rollFull"
        class="absolute inset-0 z-10 bg-[#080808]/90 flex flex-col items-center justify-center gap-5 pointer-events-none">
        <div class="text-[52px]">🏁</div>
        <div class="text-center">
          <p class="font-racing text-white text-3xl tracking-widest">CHECKERED!</p>
          <p class="font-sans text-white/40 text-[10px] uppercase tracking-[0.2em] mt-2">
            {{ shots?.limit ?? 24 }} shots · Roll complete
          </p>
          <NuxtLink to="/gallery"
            class="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#6B8CAE] text-white font-sans text-sm font-medium hover:bg-[#5a7a9c] transition-colors">
            See all photos →
          </NuxtLink>
        </div>
      </div>

      <CameraViewfinder
        ref="viewfinderRef"
        :disabled="shutterDisabled"
        @captured="onCaptured"
      />
    </div>

    <!-- Upload error -->
    <p v-if="uploadError" class="px-5 pt-2 font-sans text-red-400 text-xs text-center">
      {{ uploadError }} — try again
    </p>

    <!-- ── FILM STRIP ── -->
    <div class="flex-shrink-0 pt-3 pb-2">
      <div class="flex gap-2.5 overflow-x-auto px-4 scrollbar-hide">
        <div v-for="(p, i) in sessionPhotos" :key="p.id" class="flex-shrink-0 flex flex-col items-center gap-1.5">
          <div class="relative w-[39px] h-[52px] rounded-lg overflow-hidden bg-black/50">
            <template v-if="p.developed">
              <img :src="p.src" class="w-full h-full object-cover"
                style="filter:contrast(1.08) saturate(0.75) brightness(0.9)" />
              <div class="absolute inset-0 pointer-events-none"
                style="background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.5) 100%)" />
            </template>
            <template v-else>
              <div class="w-full h-full flex items-center justify-center bg-black/40">
                <div class="w-5 h-5 rounded-full border-2 border-[#6B8CAE]/60 border-t-transparent animate-spin" />
              </div>
            </template>
          </div>
          <p class="font-sans text-white/[0.13] leading-none" style="font-size:7px;letter-spacing:.08em;text-transform:uppercase">
            LAP {{ String(i + 1).padStart(2, '0') }}
          </p>
        </div>
        <!-- Empty hint when no shots yet -->
        <div v-if="!sessionPhotos.length" class="flex items-center">
          <p class="font-sans text-white/15 text-[10px] uppercase tracking-widest px-2">No shots yet</p>
        </div>
      </div>
    </div>

    <!-- ── CONTROLS BAR ── -->
    <div class="flex-shrink-0 flex items-center justify-between px-8 pb-10 pt-2">
      <!-- Last photo thumb -->
      <div class="w-12 h-12">
        <NuxtLink v-if="lastDeveloped" to="/gallery" class="block w-12 h-12 rounded-xl overflow-hidden border border-white/15">
          <img :src="lastDeveloped.src" class="w-full h-full object-cover"
            style="filter:saturate(0.55) brightness(0.7)" />
        </NuxtLink>
        <div v-else class="w-12 h-12 rounded-xl border border-white/[0.08] flex items-center justify-center">
          <span class="text-white/15 text-xl">🎞</span>
        </div>
      </div>

      <!-- Shutter button -->
      <button
        @click="onShutter"
        :disabled="shutterDisabled"
        class="relative w-[78px] h-[78px] rounded-full flex items-center justify-center transition-all active:scale-[0.88] disabled:opacity-25"
      >
        <div class="absolute inset-0 rounded-full border-[3px] border-white/20" />
        <div class="w-[64px] h-[64px] rounded-full bg-white flex items-center justify-center shadow-2xl">
          <div class="w-11 h-11 rounded-full border-[2.5px] border-[#6B8CAE]/30" />
        </div>
      </button>

      <!-- Shots remaining -->
      <div class="w-12 h-12 flex flex-col items-center justify-center">
        <p class="font-racing text-[#A8C5DA] text-[26px] leading-none">
          {{ shots?.remaining ?? '?' }}
        </p>
        <p class="font-sans text-white/20 text-[8px] uppercase tracking-widest mt-0.5">left</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes snapFlash { 0% { opacity:1 } 100% { opacity:0 } }

.dev-enter-active, .dev-leave-active { transition: opacity 0.4s ease; }
.dev-enter-from, .dev-leave-to { opacity: 0; }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
