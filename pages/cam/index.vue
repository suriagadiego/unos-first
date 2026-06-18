<script setup lang="ts">
definePageMeta({ layout: false })

const viewfinderRef = ref<{ capture: () => void; start: () => void; status: Ref<string>; flipCamera: () => void }>()
const { ensureAuth, authHeaders, fetchShots, shots, authReady, guestId } = useGuestCamera()

interface SessionPhoto { id: string; src: string; developed: boolean }
const sessionPhotos = ref<SessionPhoto[]>([])

const developing = ref(false)
const flash = ref(false)
const uploading = ref(false)
const uploadError = ref<string | null>(null)

const showNamePrompt = ref(false)
const nameInput = ref('')

const rollFull = computed(() => (shots.value?.remaining ?? 1) <= 0)
const shutterDisabled = computed(() => rollFull.value || developing.value || uploading.value)
const lastDeveloped = computed(() => [...sessionPhotos.value].reverse().find(p => p.developed) ?? null)

onMounted(async () => {
  ensureAuth()
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

  flash.value = true
  setTimeout(() => (flash.value = false), 180)

  const tempId = `tmp-${Date.now()}`
  const src = URL.createObjectURL(blob)
  sessionPhotos.value.push({ id: tempId, src, developed: false })
  developing.value = true
  uploading.value = true
  uploadError.value = null

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
    if (shots.value) {
      shots.value.remaining = result.remaining
      shots.value.taken = shots.value.limit - result.remaining
    }
  } catch (err: any) {
    uploadError.value = err?.data?.message ?? 'Upload failed'
    clearTimeout(developTimer)
    sessionPhotos.value = sessionPhotos.value.filter(p => p.id !== tempId)
    developing.value = false
  } finally {
    uploading.value = false
  }
}
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
    />

    <!-- Flash -->
    <div v-if="flash" class="absolute inset-0 z-50 bg-white pointer-events-none"
      style="animation:snapFlash 0.18s ease forwards" />

    <!-- Developing overlay -->
    <Transition name="dev">
      <div v-if="developing"
        class="absolute inset-0 z-40 bg-[#080808]/90 flex flex-col items-center justify-center pointer-events-none">
        <p class="font-racing text-[#6B8CAE] text-4xl tracking-[0.2em] animate-pulse">DEVELOPING</p>
        <div class="flex gap-2 mt-5">
          <span v-for="n in 3" :key="n"
            class="w-2 h-2 rounded-full bg-[#6B8CAE]/50 animate-bounce"
            :style="`animation-delay:${(n-1)*0.18}s`" />
        </div>
        <p class="font-sans text-white/20 text-[9px] uppercase tracking-[0.25em] mt-5">Processing at the pit stop</p>
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
        <input v-model="nameInput" type="text" placeholder="Your name (optional)" maxlength="40"
          class="w-full max-w-sm px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 font-sans text-sm focus:outline-none focus:border-[#6B8CAE]/60"
          @keyup.enter="saveName" />
        <div class="flex gap-3 w-full max-w-sm">
          <button @click="saveName"
            class="flex-1 py-3 rounded-xl bg-[#6B8CAE] text-white font-sans text-sm font-semibold hover:bg-[#5a7a9c] transition-colors">
            Let's go →
          </button>
          <button @click="saveName"
            class="px-4 py-3 rounded-xl border border-white/10 text-white/40 font-sans text-sm">
            Skip
          </button>
        </div>
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

        <!-- Last photo thumbnail — left -->
        <div class="absolute left-8">
          <NuxtLink v-if="lastDeveloped" to="/gallery" class="block w-12 h-12 rounded-xl overflow-hidden border border-white/20">
            <img :src="lastDeveloped.src" class="w-full h-full object-cover" style="filter:saturate(0.55) brightness(0.75)" />
          </NuxtLink>
          <div v-else class="w-12 h-12 rounded-xl border border-white/[0.1] flex items-center justify-center">
            <span class="text-white/15 text-xl">🎞</span>
          </div>
        </div>

        <!-- Shutter — dead center -->
        <button
          @click="onShutter"
          :disabled="shutterDisabled"
          class="relative w-[78px] h-[78px] rounded-full flex items-center justify-center transition-all active:scale-[0.88] disabled:opacity-25"
        >
          <div class="absolute inset-0 rounded-full border-[3px] border-white/30" />
          <div class="w-[64px] h-[64px] rounded-full bg-white flex items-center justify-center shadow-2xl">
            <div class="w-11 h-11 rounded-full border-[2.5px] border-[#6B8CAE]/30" />
          </div>
        </button>

        <!-- LAP / LEFT — right -->
        <div class="absolute right-4 flex items-stretch gap-1.5 bg-black/40 backdrop-blur-sm border border-white/[0.1] rounded-xl px-2 py-1.5">
          <div class="text-center">
            <p class="text-[5px] text-[#6B8CAE] uppercase tracking-[0.2em] font-sans mb-0.5">LAP</p>
            <p class="font-racing text-white text-[19px] leading-none">{{ String(shots?.taken ?? 0).padStart(2, '0') }}</p>
          </div>
          <div class="w-px bg-white/10 self-stretch" />
          <div class="text-center">
            <p class="text-[5px] text-white/25 uppercase tracking-[0.2em] font-sans mb-0.5">LEFT</p>
            <p class="font-racing text-white/35 text-[19px] leading-none">{{ String(shots?.remaining ?? '--') }}</p>
          </div>
        </div>

      </div>
    </div>

    <!-- Upload error toast -->
    <Transition name="dev">
      <div v-if="uploadError"
        class="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl bg-red-900/80 backdrop-blur-sm text-red-200 text-xs font-sans whitespace-nowrap">
        {{ uploadError }} — try again
      </div>
    </Transition>

    </div><!-- end bezel -->
  </div>
</template>

<style scoped>
@keyframes snapFlash { 0% { opacity:1 } 100% { opacity:0 } }
.dev-enter-active, .dev-leave-active { transition: opacity 0.4s ease; }
.dev-enter-from, .dev-leave-to { opacity: 0; }
</style>
