<script setup lang="ts">
definePageMeta({ layout: false })

interface GalleryPhoto {
  id: string
  url: string
  guestId: string
  createdAt: string
}

const photos = ref<GalleryPhoto[]>([])
const loading = ref(true)
const lightboxIdx = ref<number | null>(null)

async function load() {
  try {
    const data = await $fetch<GalleryPhoto[]>('/api/cam/gallery')
    photos.value = data
  } catch {
    // silently keep showing whatever we have
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  // Poll every 8 seconds for live updates
  const timer = setInterval(load, 8000)
  onUnmounted(() => clearInterval(timer))
})

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

function prevPhoto() {
  if (lightboxIdx.value === null || !photos.value.length) return
  lightboxIdx.value = (lightboxIdx.value - 1 + photos.value.length) % photos.value.length
}

function nextPhoto() {
  if (lightboxIdx.value === null || !photos.value.length) return
  lightboxIdx.value = (lightboxIdx.value + 1) % photos.value.length
}

function onKeydown(e: KeyboardEvent) {
  if (lightboxIdx.value === null) return
  if (e.key === 'ArrowLeft') prevPhoto()
  if (e.key === 'ArrowRight') nextPhoto()
  if (e.key === 'Escape') lightboxIdx.value = null
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="min-h-[100dvh] bg-[#080808] flex flex-col">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-7 pb-5 flex-shrink-0">
      <div>
        <p class="font-racing text-white text-2xl tracking-widest leading-none">THE REEL</p>
        <p class="text-[#6B8CAE]/50 text-[9px] uppercase tracking-[0.3em] mt-1 font-sans">
          {{ photos.length }} shots · updating live
        </p>
      </div>
      <NuxtLink to="/cam"
        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 font-sans text-sm hover:text-white transition-colors">
        <span class="text-base">📷</span> Shoot
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 rounded-full border-2 border-[#6B8CAE]/60 border-t-transparent animate-spin" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!photos.length"
      class="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <div class="text-5xl opacity-30">🎞</div>
      <p class="font-racing text-white/30 text-lg tracking-widest">NO SHOTS YET</p>
      <p class="font-sans text-white/20 text-sm">Be the first to snap a moment!</p>
      <NuxtLink to="/cam"
        class="mt-2 px-6 py-3 rounded-xl bg-[#6B8CAE] text-white font-sans text-sm font-medium hover:bg-[#5a7a9c] transition-colors">
        Open camera →
      </NuxtLink>
    </div>

    <!-- Photo grid -->
    <div v-else class="flex-1 px-3 pb-8">
      <div class="grid grid-cols-3 gap-1.5">
        <div
          v-for="(photo, i) in photos"
          :key="photo.id"
          class="relative aspect-square overflow-hidden rounded-lg bg-white/[0.04] cursor-pointer group"
          @click="lightboxIdx = i"
        >
          <img
            :src="photo.url"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style="filter:contrast(1.05) saturate(0.85)"
            loading="lazy"
          />
          <!-- Vignette -->
          <div class="absolute inset-0 pointer-events-none"
            style="background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.4) 100%)" />
          <!-- Time -->
          <p class="absolute bottom-1 right-1.5 font-racing text-[#F59E0B] leading-none pointer-events-none"
            style="font-size:7px;text-shadow:0 0 4px rgba(245,158,11,0.5)">
            {{ relTime(photo.createdAt) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxIdx !== null && photos.length"
        class="fixed inset-0 z-50 bg-black/96 flex flex-col"
        @click.self="lightboxIdx = null">

        <!-- Top bar -->
        <div class="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <span class="font-racing text-white/40 text-sm tracking-widest">
            LAP {{ String(lightboxIdx + 1).padStart(2,'0') }} / {{ String(photos.length).padStart(2,'0') }}
          </span>
          <button class="text-white/40 hover:text-white text-2xl leading-none transition-colors"
            @click="lightboxIdx = null">×</button>
        </div>

        <!-- Image -->
        <div class="flex-1 flex items-center justify-center relative min-h-0 px-12">
          <button class="absolute left-2 text-white/30 hover:text-white text-4xl leading-none transition-colors select-none"
            @click="prevPhoto">‹</button>
          <img
            :src="photos[lightboxIdx].url"
            class="max-h-full max-w-full object-contain rounded-xl"
            style="filter:contrast(1.05) saturate(0.85)"
          />
          <button class="absolute right-2 text-white/30 hover:text-white text-4xl leading-none transition-colors select-none"
            @click="nextPhoto">›</button>
        </div>

        <!-- Thumbnail strip -->
        <div class="flex-shrink-0 flex gap-2 overflow-x-auto px-5 py-4 scrollbar-hide">
          <div
            v-for="(p, i) in photos"
            :key="p.id"
            class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden cursor-pointer transition-all"
            :class="i === lightboxIdx ? 'ring-2 ring-[#6B8CAE] opacity-100' : 'opacity-35 hover:opacity-60'"
            @click="lightboxIdx = i"
          >
            <img :src="p.url" class="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
