<script setup lang="ts">
const MAX_SHOTS = 24
const DEVELOP_MS = 2200

interface Photo {
  id: number
  src: string
  developed: boolean
  uploading: boolean
  error: boolean
  date: string
}

const photos = ref<Photo[]>([])
const developing = ref(false)
const flash = ref(false)
const fileRef = ref<HTMLInputElement>()

const taken = computed(() => photos.value.length)
const remaining = computed(() => MAX_SHOTS - taken.value)
const rollFull = computed(() => taken.value >= MAX_SHOTS)
const lastDeveloped = computed(() => [...photos.value].reverse().find(p => p.developed) ?? null)

function shoot() {
  if (rollFull.value || developing.value) return
  fileRef.value?.click()
}

function readFile(file: File): Promise<string> {
  return new Promise(resolve => {
    const r = new FileReader()
    r.onload = e => resolve(e.target!.result as string)
    r.readAsDataURL(file)
  })
}

async function onCapture(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  flash.value = true
  setTimeout(() => (flash.value = false), 200)

  const src = await readFile(file)
  const d = new Date()
  const date = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} '${String(d.getFullYear()).slice(2)}`

  photos.value.push({ id: Date.now(), src, developed: false, uploading: true, error: false, date })
  const idx = photos.value.length - 1
  developing.value = true

  setTimeout(() => {
    photos.value[idx].developed = true
    developing.value = false
  }, DEVELOP_MS)

  try {
    const form = new FormData()
    form.append('file', file)
    await $fetch('/api/upload', { method: 'POST', body: form })
  } catch {
    photos.value[idx].error = true
  } finally {
    photos.value[idx].uploading = false
  }
}
</script>

<template>
  <section id="camera" class="relative bg-[#080808] flex flex-col" style="min-height:100dvh">

    <!-- Flash overlay -->
    <div v-if="flash" class="absolute inset-0 z-50 bg-white pointer-events-none" style="animation:snapFlash 0.2s ease forwards" />

    <!-- Developing overlay -->
    <Transition name="dev">
      <div v-if="developing"
        class="absolute inset-0 z-40 bg-[#080808]/93 flex flex-col items-center justify-center pointer-events-none">
        <p class="font-racing text-[#6B8CAE] text-4xl tracking-[0.2em] animate-pulse">DEVELOPING</p>
        <div class="flex gap-2 mt-5">
          <span v-for="n in 3" :key="n"
            class="w-2 h-2 rounded-full bg-[#6B8CAE]/50 animate-bounce"
            :style="`animation-delay:${(n - 1) * 0.18}s`" />
        </div>
        <p class="font-sans text-white/20 text-[9px] uppercase tracking-[0.25em] mt-5">
          Processing at the pit stop
        </p>
      </div>
    </Transition>

    <!-- ─── HEADER ─── -->
    <div class="flex items-start justify-between px-5 pt-7 pb-4 flex-shrink-0">
      <div>
        <p class="font-racing text-white text-[26px] tracking-widest leading-none">UNO CAM</p>
        <p class="text-[#6B8CAE]/50 text-[9px] uppercase tracking-[0.3em] mt-1 font-sans">FAST ONE · SEPT 6 2026</p>
      </div>

      <!-- Shot counter -->
      <div class="flex items-stretch gap-3 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3">
        <div class="text-center">
          <p class="text-[8px] text-[#6B8CAE] uppercase tracking-[0.2em] font-sans mb-0.5">LAP</p>
          <p class="font-racing text-white text-3xl leading-none">{{ String(taken).padStart(2, '0') }}</p>
        </div>
        <div class="w-px bg-white/10 self-stretch" />
        <div class="text-center">
          <p class="text-[8px] text-white/25 uppercase tracking-[0.2em] font-sans mb-0.5">LEFT</p>
          <p class="font-racing text-white/35 text-3xl leading-none">{{ String(remaining).padStart(2, '0') }}</p>
        </div>
      </div>
    </div>

    <!-- ─── VIEWFINDER ─── -->
    <div class="flex-1 relative mx-4 rounded-2xl overflow-hidden border border-white/[0.07]" style="min-height:240px">
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-[#101215] via-[#0a0c0e] to-[#060708]" />

      <!-- Grid -->
      <div class="absolute inset-0 pointer-events-none"
        style="background-image:linear-gradient(rgba(107,140,174,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(107,140,174,.07) 1px,transparent 1px);background-size:40px 40px" />

      <!-- Racing corner brackets -->
      <div class="absolute top-5 left-5 w-8 h-8 border-t-[2.5px] border-l-[2.5px] border-[#6B8CAE]/70" />
      <div class="absolute top-5 right-5 w-8 h-8 border-t-[2.5px] border-r-[2.5px] border-[#6B8CAE]/70" />
      <div class="absolute bottom-5 left-5 w-8 h-8 border-b-[2.5px] border-l-[2.5px] border-[#6B8CAE]/70" />
      <div class="absolute bottom-5 right-5 w-8 h-8 border-b-[2.5px] border-r-[2.5px] border-[#6B8CAE]/70" />

      <!-- Crosshair -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="absolute inset-x-16 h-px bg-[#6B8CAE]/10" />
        <div class="absolute inset-y-16 w-px bg-[#6B8CAE]/10" />
        <div class="w-2.5 h-2.5 rounded-full border border-[#6B8CAE]/25" />
      </div>

      <!-- Ready state -->
      <div v-if="!rollFull" class="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none">
        <div class="text-[52px] opacity-[0.07] select-none" style="filter:grayscale(1)">🏎</div>
        <div class="text-center">
          <p class="font-racing text-white/[0.14] text-sm tracking-[0.45em]">POINT & SHOOT</p>
          <p class="font-sans text-white/[0.08] text-[9px] uppercase tracking-[0.3em] mt-1.5">No preview · No deletes</p>
        </div>
      </div>

      <!-- Roll complete state -->
      <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none">
        <div class="text-[52px]">🏁</div>
        <div class="text-center">
          <p class="font-racing text-white text-3xl tracking-widest">CHECKERED!</p>
          <p class="font-sans text-white/40 text-[10px] uppercase tracking-[0.2em] mt-2">
            {{ MAX_SHOTS }} shots · Roll complete
          </p>
        </div>
      </div>

      <!-- Film type label -->
      <p class="absolute bottom-4 left-1/2 -translate-x-1/2 font-sans text-[8px] text-white/[0.11] uppercase tracking-[0.35em] pointer-events-none select-none whitespace-nowrap">
        FAST ONE 400 · ISO 400
      </p>
    </div>

    <!-- ─── FILM STRIP ─── -->
    <div class="flex-shrink-0 pt-4 pb-2">
      <div class="flex gap-2.5 overflow-x-auto px-4 scrollbar-hide">
        <div v-for="i in MAX_SHOTS" :key="i" class="flex-shrink-0 flex flex-col items-center gap-1.5">
          <!-- Slot -->
          <div class="relative w-[54px] h-[54px] rounded-lg overflow-hidden"
            :class="photos[i-1] ? '' : 'bg-white/[0.04] border border-white/[0.07]'">

            <!-- Developed photo -->
            <template v-if="photos[i-1]?.developed">
              <img :src="photos[i-1].src" class="w-full h-full object-cover"
                style="filter:contrast(1.08) saturate(0.75) brightness(0.88)" />
              <!-- Vignette -->
              <div class="absolute inset-0 pointer-events-none"
                style="background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.55) 100%)" />
              <!-- Date stamp -->
              <p class="absolute bottom-0.5 right-1 font-racing text-[#F59E0B] leading-none"
                style="font-size:5.5px;text-shadow:0 0 4px rgba(245,158,11,0.6)">
                {{ photos[i-1].date }}
              </p>
            </template>

            <!-- Developing spinner -->
            <template v-else-if="photos[i-1] && !photos[i-1].developed">
              <div class="w-full h-full bg-black/50 flex items-center justify-center">
                <div class="w-5 h-5 rounded-full border-2 border-[#6B8CAE]/60 border-t-transparent animate-spin" />
              </div>
            </template>

            <!-- Empty slot -->
            <template v-else>
              <div class="w-full h-full flex items-center justify-center">
                <span class="font-racing text-white/[0.09] text-xs">{{ String(i).padStart(2, '0') }}</span>
              </div>
            </template>
          </div>

          <p class="font-sans text-white/[0.13] leading-none" style="font-size:7px;letter-spacing:.08em;text-transform:uppercase">
            LAP {{ String(i).padStart(2, '0') }}
          </p>
        </div>
      </div>
    </div>

    <!-- ─── CONTROLS BAR ─── -->
    <div class="flex-shrink-0 flex items-center justify-between px-8 pb-10 pt-3">
      <!-- Last photo preview -->
      <div class="w-12 h-12">
        <div v-if="lastDeveloped" class="w-12 h-12 rounded-xl overflow-hidden border border-white/15">
          <img :src="lastDeveloped.src" class="w-full h-full object-cover"
            style="filter:saturate(0.55) brightness(0.7)" />
        </div>
        <div v-else class="w-12 h-12 rounded-xl border border-white/[0.08] flex items-center justify-center">
          <span class="text-white/15 text-xl">🎞</span>
        </div>
      </div>

      <!-- Shutter button -->
      <button
        @click="shoot"
        :disabled="rollFull || developing"
        class="relative w-[78px] h-[78px] rounded-full flex items-center justify-center transition-all active:scale-[0.88] disabled:opacity-25"
      >
        <div class="absolute inset-0 rounded-full border-[3px] border-white/20" />
        <div class="w-[64px] h-[64px] rounded-full bg-white flex items-center justify-center shadow-2xl">
          <div class="w-11 h-11 rounded-full border-[2.5px] border-[#6B8CAE]/30" />
        </div>
      </button>

      <!-- Shots remaining -->
      <div class="w-12 h-12 flex flex-col items-center justify-center">
        <p class="font-racing text-[#A8C5DA] text-[26px] leading-none">{{ remaining }}</p>
        <p class="font-sans text-white/20 text-[8px] uppercase tracking-widest mt-0.5">left</p>
      </div>
    </div>

    <!-- Camera input -->
    <input ref="fileRef" type="file" accept="image/*" capture="environment" class="sr-only" @change="onCapture" />
  </section>
</template>

<style scoped>
@keyframes snapFlash {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

.dev-enter-active,
.dev-leave-active {
  transition: opacity 0.4s ease;
}
.dev-enter-from,
.dev-leave-to {
  opacity: 0;
}

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
