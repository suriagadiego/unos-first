<script setup lang="ts">
definePageMeta({ layout: false })

interface GalleryPhoto {
  id: string
  url: string
  guestId: string
  guestName: string | null
  createdAt: string
}

interface PhotographerGroup {
  id: string
  name: string
  photos: GalleryPhoto[]
}

const photos = ref<GalleryPhoto[]>([])
const loading = ref(true)
const lightboxIdx = ref<number | null>(null)
let loadingRequest: Promise<void> | null = null

const photographerGroups = computed<PhotographerGroup[]>(() => {
  const groups = new Map<string, PhotographerGroup>()

  for (const photo of photos.value) {
    const name = photo.guestName?.trim() || 'Guest photographer'
    // The entered name is the public identity guests recognize. A device can
    // receive a new guest UUID after storage is cleared, so matching names stay
    // together instead of appearing as duplicate sections.
    const normalizedName = name.toLocaleLowerCase().replace(/\s+/g, ' ')
    const key = photo.guestName ? `name:${normalizedName}` : `guest:${photo.guestId}`
    const group = groups.get(key)
    if (group) group.photos.push(photo)
    else groups.set(key, { id: key, name, photos: [photo] })
  }

  return [...groups.values()]
})

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'G'
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('')
}

function photoIndex(id: string) {
  return photos.value.findIndex(photo => photo.id === id)
}

function openPhoto(id: string) {
  const index = photoIndex(id)
  if (index >= 0) lightboxIdx.value = index
}

async function load() {
  if (loadingRequest) return loadingRequest
  loadingRequest = (async () => {
  try {
    const openPhotoId = lightboxIdx.value === null ? null : photos.value[lightboxIdx.value]?.id
    const previousIndex = lightboxIdx.value
    const data = await $fetch<GalleryPhoto[]>('/api/cam/gallery')
    photos.value = data
    if (previousIndex !== null) {
      const samePhotoIndex = openPhotoId ? data.findIndex(photo => photo.id === openPhotoId) : -1
      lightboxIdx.value = samePhotoIndex >= 0
        ? samePhotoIndex
        : data.length ? Math.min(previousIndex, data.length - 1) : null
    }
  } catch {
    // silently keep showing whatever we have
  } finally {
    loading.value = false
    loadingRequest = null
  }
  })()
  return loadingRequest
}

onMounted(() => {
  load()
  const refreshWhenVisible = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) load()
  }
  const timer = setInterval(refreshWhenVisible, 15000)
  document.addEventListener('visibilitychange', refreshWhenVisible)
  window.addEventListener('online', refreshWhenVisible)
  onUnmounted(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', refreshWhenVisible)
    window.removeEventListener('online', refreshWhenVisible)
  })
})

function relTime(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
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
  <div class="min-h-[100dvh] bg-[#080808] flex flex-col text-white">

    <!-- Header -->
    <header class="sticky top-0 z-20 flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 flex-shrink-0 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl">
      <div>
        <p class="font-racing text-white text-2xl tracking-widest leading-none">THE REEL</p>
        <p class="text-[#6B8CAE]/50 text-[9px] uppercase tracking-[0.3em] mt-1 font-sans">
          {{ photos.length }} shots · {{ photographerGroups.length }} photographers
        </p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/gallery/slideshow"
          class="flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.055] px-3 py-2 font-sans text-sm font-semibold text-white/75 transition-colors hover:text-white">
          <span aria-hidden="true">▶</span> Show
        </NuxtLink>
        <NuxtLink to="/cam"
          class="flex min-h-11 items-center gap-2 px-3 py-2 rounded-xl bg-[#6B8CAE] border border-[#A8C5DA]/20 text-white font-sans text-sm font-semibold shadow-lg shadow-[#6B8CAE]/10 active:scale-[0.97] transition-all">
          <span class="text-base">📷</span> Shoot
        </NuxtLink>
      </div>
    </header>

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

    <!-- Grouped gallery reel -->
    <main v-else class="flex-1 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div class="space-y-5 px-3 pt-4">
        <section
          v-for="group in photographerGroups"
          :key="group.id"
          class="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]"
        >
          <div class="flex items-center gap-3 px-3.5 py-3">
            <div class="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[#6B8CAE]/30 bg-[#6B8CAE]/15 font-racing text-sm tracking-wide text-[#C7D9E6]">
              {{ initials(group.name) }}
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-sans text-[15px] font-semibold text-white">{{ group.name }}</h2>
              <p class="mt-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-white/35">
                {{ group.photos.length }} {{ group.photos.length === 1 ? 'shot' : 'shots' }} · latest {{ relTime(group.photos[0].createdAt) }}
              </p>
            </div>
            <span class="font-racing text-xl tabular-nums text-white/15">{{ String(group.photos.length).padStart(2, '0') }}</span>
          </div>

          <div
            class="grid gap-px bg-white/[0.06]"
            :class="group.photos.length === 1 ? 'grid-cols-1' : group.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'"
          >
            <button
              v-for="(photo, i) in group.photos"
              :key="photo.id"
              type="button"
              class="group relative overflow-hidden bg-[#111] text-left focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A8C5DA]"
              :class="group.photos.length === 1 ? 'aspect-[16/9]' : 'aspect-square'"
              :aria-label="`Open photo ${i + 1} by ${group.name}, taken ${relTime(photo.createdAt)}`"
              @click="openPhoto(photo.id)"
            >
              <img
                :src="photo.url"
                :alt="`Photo ${i + 1} by ${group.name}`"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                style="filter:contrast(1.05) saturate(0.85)"
                loading="lazy"
              />
              <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />
              <span class="absolute bottom-1.5 right-1.5 font-racing text-[7px] leading-none text-[#F59E0B] drop-shadow">
                {{ relTime(photo.createdAt) }}
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxIdx !== null && photos.length"
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
        class="fixed inset-0 z-50 isolate flex flex-col overflow-hidden bg-black/55 backdrop-blur-[48px]"
        @click.self="lightboxIdx = null">

        <!-- Heavily blurred photo backdrop -->
        <img
          :src="photos[lightboxIdx].url"
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute -inset-[12%] -z-10 h-[124%] w-[124%] scale-110 object-cover opacity-65 blur-[72px] saturate-150"
        />
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 bg-black/40" />

        <!-- Top bar -->
        <div class="z-10 flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-black/45 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <div>
            <span class="font-racing text-white/80 text-sm tracking-widest">
              LAP {{ String(lightboxIdx + 1).padStart(2,'0') }} / {{ String(photos.length).padStart(2,'0') }}
            </span>
            <p class="font-sans text-white text-xs mt-1">
              Captured by {{ photos[lightboxIdx].guestName || 'a guest' }} · {{ relTime(photos[lightboxIdx].createdAt) }}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close photo viewer"
            class="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/30 bg-white text-black shadow-2xl transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            @click="lightboxIdx = null"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <!-- Image -->
        <div class="relative z-10 flex min-h-0 flex-1 items-center justify-center px-1 py-1">
          <button
            type="button"
            aria-label="Previous photo"
            class="absolute left-2.5 z-20 flex h-12 w-12 select-none items-center justify-center rounded-full border border-white/30 bg-white text-black shadow-2xl transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            @click="prevPhoto"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <img
            :src="photos[lightboxIdx].url"
            :alt="`Guest photo ${lightboxIdx + 1}`"
            class="max-h-full max-w-full rounded-lg border border-white/15 object-contain shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
            style="filter:contrast(1.05) saturate(0.85)"
          />
          <button
            type="button"
            aria-label="Next photo"
            class="absolute right-2.5 z-20 flex h-12 w-12 select-none items-center justify-center rounded-full border border-white/30 bg-white text-black shadow-2xl transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            @click="nextPhoto"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <!-- Thumbnail strip -->
        <div class="scrollbar-hide z-10 flex flex-shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-black/45 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
          <button
            v-for="(p, i) in photos"
            :key="p.id"
            type="button"
            :aria-label="`Open photo ${i + 1} by ${p.guestName || 'a guest'}`"
            class="h-10 w-10 flex-shrink-0 cursor-pointer overflow-hidden rounded-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            :class="i === lightboxIdx ? 'ring-2 ring-white opacity-100 scale-105' : 'opacity-50 hover:opacity-80'"
            @click="lightboxIdx = i"
          >
            <img :src="p.url" alt="" class="w-full h-full object-cover" loading="lazy" />
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
