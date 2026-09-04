<script setup lang="ts">
definePageMeta({ layout: false })

interface GalleryPhoto {
  id: string
  url: string
  guestId: string
  guestName: string | null
  createdAt: string
}

const photos = ref<GalleryPhoto[]>([])
const loading = ref(true)
const currentSlide = ref(0)
const paused = ref(false)
const controlsVisible = ref(true)
const isFullscreen = ref(false)
const viewportWidth = ref(1920)
const viewportHeight = ref(1080)
const aspectRatios = reactive<Record<string, number>>({})
const slideDuration = 6000
const maxPerSlide = 8

let slideTimer: ReturnType<typeof setTimeout> | null = null
let controlsTimer: ReturnType<typeof setTimeout> | null = null
let refreshTimer: ReturnType<typeof setInterval> | null = null
let advancing = false
const loadedPhotoUrls = new Set<string>()
const preloadTasks = new Map<string, Promise<void>>()

function buildSlides(source: GalleryPhoto[]) {
  if (!source.length) return []
  const slideCount = Math.ceil(source.length / maxPerSlide)
  const baseSize = Math.floor(source.length / slideCount)
  const extra = source.length % slideCount
  const result: GalleryPhoto[][] = []
  let offset = 0

  for (let i = 0; i < slideCount; i++) {
    const size = baseSize + (i < extra ? 1 : 0)
    result.push(source.slice(offset, offset + size))
    offset += size
  }

  return result
}

// Balance the final slides so a growing gallery never ends with one lonely tile.
const slides = computed(() => buildSlides(photos.value))

const activePhotos = computed(() => slides.value[currentSlide.value] ?? [])

const activeRows = computed(() => {
  if (!activePhotos.value.length) return []
  const firstRowSize = Math.ceil(activePhotos.value.length / 2)
  return [
    activePhotos.value.slice(0, firstRowSize),
    activePhotos.value.slice(firstRowSize),
  ].filter(row => row.length)
})

const rowLayouts = computed(() => {
  const outerPadding = 8
  const gap = 8
  const availableWidth = Math.max(1, viewportWidth.value - outerPadding * 2)
  const availableHeight = Math.max(1, viewportHeight.value - outerPadding * 2)

  const rawRows = activeRows.value.map((row) => {
    const ratios = row.map(photo => aspectRatios[photo.id] ?? 4 / 3)
    const usableWidth = availableWidth - gap * Math.max(0, row.length - 1)
    const height = usableWidth / ratios.reduce((sum, ratio) => sum + ratio, 0)
    return { photos: row, ratios, height }
  })

  const rowGaps = gap * Math.max(0, rawRows.length - 1)
  const naturalHeight = rawRows.reduce((sum, row) => sum + row.height, 0)
  const scale = Math.min(1, (availableHeight - rowGaps) / naturalHeight)

  return rawRows.map(row => ({
    height: row.height * scale,
    items: row.photos.map((photo, index) => ({
      photo,
      width: (row.ratios[index] ?? 4 / 3) * row.height * scale,
      ordinal: activePhotos.value.findIndex(item => item.id === photo.id) + 1,
    })),
  }))
})

function recordAspectRatio(photoId: string, event: Event) {
  const image = event.currentTarget as HTMLImageElement
  if (!image.naturalWidth || !image.naturalHeight) return
  const ratio = image.naturalWidth / image.naturalHeight
  if (Math.abs((aspectRatios[photoId] ?? 0) - ratio) > 0.001) aspectRatios[photoId] = ratio
}

function measureViewport() {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

function preloadPhoto(photo: GalleryPhoto) {
  if (loadedPhotoUrls.has(photo.url)) return Promise.resolve()
  const existingTask = preloadTasks.get(photo.url)
  if (existingTask) return existingTask

  const task = new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = async () => {
      if (image.naturalWidth && image.naturalHeight) {
        aspectRatios[photo.id] = image.naturalWidth / image.naturalHeight
      }
      try {
        await image.decode()
      } catch {
        // onload already guarantees the bytes are available when decode is unsupported.
      }
      loadedPhotoUrls.add(photo.url)
      preloadTasks.delete(photo.url)
      resolve()
    }
    image.onerror = () => {
      // Do not permanently stall the projector if an individual upload is unavailable.
      preloadTasks.delete(photo.url)
      resolve()
    }
    image.src = photo.url
  })

  preloadTasks.set(photo.url, task)
  return task
}

async function preloadSlide(index: number) {
  const target = slides.value[index]
  if (!target?.length) return
  await Promise.all(target.map(preloadPhoto))
}

function preloadFollowingSlide() {
  if (slides.value.length < 2) return
  const nextIndex = (currentSlide.value + 1) % slides.value.length
  void preloadSlide(nextIndex)
}

async function loadPhotos() {
  try {
    const initialLoad = !photos.value.length
    const openPhotoId = activePhotos.value[0]?.id
    const data = await $fetch<GalleryPhoto[]>('/api/cam/gallery')
    const existingPhotos = new Map(photos.value.map(photo => [photo.id, photo]))
    const mergedPhotos = data.map((photo) => {
      const existing = existingPhotos.get(photo.id)
      return existing ? { ...photo, url: existing.url } : photo
    })

    // New live uploads are decoded before they are allowed into the active deck.
    if (!initialLoad) {
      await Promise.all(mergedPhotos.filter(photo => !existingPhotos.has(photo.id)).map(preloadPhoto))
    }

    photos.value = mergedPhotos

    if (openPhotoId) {
      const newSlide = slides.value.findIndex(slide => slide.some(photo => photo.id === openPhotoId))
      currentSlide.value = newSlide >= 0 ? newSlide : 0
    } else if (currentSlide.value >= slides.value.length) {
      currentSlide.value = 0
    }

    await preloadSlide(currentSlide.value)
    preloadFollowingSlide()
    restartTimer()
  } catch {
    // Keep the current deck on screen if a live refresh briefly fails.
  } finally {
    loading.value = false
  }
}

function restartTimer() {
  if (slideTimer) clearTimeout(slideTimer)
  slideTimer = null
  if (!paused.value && slides.value.length > 1) {
    slideTimer = setTimeout(() => void next(), slideDuration)
  }
}

async function showSlide(index: number) {
  if (!slides.value.length || advancing || index === currentSlide.value) return
  advancing = true
  await preloadSlide(index)
  currentSlide.value = index
  advancing = false
  preloadFollowingSlide()
  restartTimer()
}

async function next() {
  if (!slides.value.length) return
  await showSlide((currentSlide.value + 1) % slides.value.length)
}

async function previous() {
  if (!slides.value.length) return
  await showSlide((currentSlide.value - 1 + slides.value.length) % slides.value.length)
}

function togglePause() {
  paused.value = !paused.value
  restartTimer()
  showControls()
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
  else await document.exitFullscreen()
}

function showControls() {
  controlsVisible.value = true
  if (controlsTimer) clearTimeout(controlsTimer)
  controlsTimer = setTimeout(() => {
    if (!paused.value) controlsVisible.value = false
  }, 3500)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') previous()
  if (event.key === 'ArrowRight') next()
  if (event.key === ' ') {
    event.preventDefault()
    togglePause()
  }
  if (event.key.toLowerCase() === 'f') toggleFullscreen()
}

function onFullscreenChange() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

onMounted(() => {
  loadPhotos()
  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) loadPhotos()
  }, 15000)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', measureViewport)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  measureViewport()
  showControls()
})

onUnmounted(() => {
  if (slideTimer) clearTimeout(slideTimer)
  if (controlsTimer) clearTimeout(controlsTimer)
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', measureViewport)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div
    class="relative h-[100dvh] overflow-hidden bg-[#050505] text-white"
    :class="controlsVisible ? 'cursor-default' : 'cursor-none'"
    @pointermove="showControls"
    @pointerdown="showControls"
  >
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <div class="h-10 w-10 animate-spin rounded-full border-2 border-[#A8C5DA] border-t-transparent" />
    </div>

    <div v-else-if="!photos.length" class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
      <span class="text-6xl opacity-30">🎞</span>
      <p class="font-racing text-2xl tracking-widest text-white/50">WAITING FOR THE FIRST SHOT</p>
      <p class="font-sans text-sm text-white/30">New photos will appear here automatically.</p>
    </div>

    <Transition v-else name="deck" mode="out-in">
      <div
        :key="currentSlide"
        class="flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden p-2"
      >
        <div
          v-for="(row, rowIndex) in rowLayouts"
          :key="rowIndex"
          class="flex flex-none justify-center gap-2"
          :style="{ height: `${row.height}px` }"
        >
          <figure
            v-for="item in row.items"
            :key="item.photo.id"
            class="relative h-full flex-none overflow-hidden rounded-lg bg-[#0a0a0a] shadow-2xl"
            :style="{ width: `${item.width}px` }"
          >
            <img
              :src="item.photo.url"
              :alt="`Photo by ${item.photo.guestName || 'a guest'}`"
              class="block h-full w-full object-contain"
              @load="recordAspectRatio(item.photo.id, $event)"
            />
            <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <figcaption class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 md:p-4">
              <div class="min-w-0">
                <p class="truncate font-sans text-sm font-semibold text-white drop-shadow md:text-base">
                  {{ item.photo.guestName || 'Guest photographer' }}
                </p>
              </div>
              <span class="font-racing text-xs tabular-nums text-[#F59E0B] drop-shadow md:text-sm">
                {{ String(item.ordinal).padStart(2, '0') }}
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </Transition>

    <!-- Projector controls overlay; fades away when the pointer is idle. -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent p-5 pb-16 transition-opacity duration-300 md:p-7 md:pb-20"
      :class="controlsVisible ? 'opacity-100' : 'opacity-0'"
    >
      <div>
        <p class="font-racing text-xl tracking-widest md:text-3xl">THE REEL · LIVE</p>
        <p class="mt-1 font-sans text-[10px] uppercase tracking-[0.25em] text-white/55 md:text-xs">
          {{ photos.length }} shots · slide {{ currentSlide + 1 }} of {{ slides.length }}
        </p>
      </div>
      <div class="pointer-events-auto flex gap-2">
        <NuxtLink to="/gallery" aria-label="Exit slideshow"
          class="flex h-11 items-center rounded-full border border-white/20 bg-black/55 px-4 font-sans text-sm font-semibold text-white backdrop-blur-xl hover:bg-black/75">
          Exit
        </NuxtLink>
        <button type="button" :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          class="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-xl"
          @click="toggleFullscreen">
          <svg v-if="!isFullscreen" aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
          </svg>
          <svg v-else aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="slides.length > 1"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-5 pt-16 transition-opacity duration-300 md:p-7 md:pt-20"
      :class="controlsVisible ? 'opacity-100' : 'opacity-0'"
    >
      <button type="button" aria-label="Previous slide"
        class="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-xl hover:bg-black/75"
        @click="previous">
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="3"><path d="m15 18-6-6 6-6" /></svg>
      </button>

      <button type="button" :aria-label="paused ? 'Resume slideshow' : 'Pause slideshow'"
        class="pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-white px-5 font-sans text-sm font-bold text-black shadow-xl"
        @click="togglePause">
        <svg v-if="paused" aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="m8 5 11 7-11 7V5Z" /></svg>
        <svg v-else aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
        {{ paused ? 'Play' : 'Pause' }}
      </button>

      <button type="button" aria-label="Next slide"
        class="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-xl hover:bg-black/75"
        @click="next()">
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>

    <div v-if="!paused && slides.length > 1" :key="currentSlide"
      class="absolute inset-x-0 bottom-0 z-30 h-1 origin-left bg-[#A8C5DA] slideshow-progress" />
  </div>
</template>

<style scoped>
.deck-enter-active,
.deck-leave-active { transition: opacity 0.7s ease, transform 0.7s ease; }
.deck-enter-from { opacity: 0; transform: translateX(1.5%) scale(0.99); }
.deck-leave-to { opacity: 0; transform: translateX(-1.5%) scale(0.99); }
.slideshow-progress { animation: slideshow-progress 8s linear forwards; }
@keyframes slideshow-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
</style>
