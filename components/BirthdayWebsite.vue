<script setup lang="ts">
import landingUrl from '~/assets/images/optimized/landing.webp'
import lowerWatercolorUrl from '~/assets/images/optimized/lowerleft-watercolor.webp'
import upperWatercolorUrl from '~/assets/images/optimized/upperright-watercolor.webp'
import cloudOneUrl from '~/assets/images/optimized/clouds/1.webp'
import cloudFourUrl from '~/assets/images/optimized/clouds/4.webp'
import cloudFiveUrl from '~/assets/images/optimized/clouds/5.webp'

const hasLoadedBirthday = useState('birthday-assets-loaded', () => false)
const isLoading = ref(!hasLoadedBirthday.value)
let previousBodyOverflow = ''

const criticalImages = [
  landingUrl,
  lowerWatercolorUrl,
  upperWatercolorUrl,
  cloudOneUrl,
  cloudFourUrl,
  cloudFiveUrl,
]

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = src
    if (image.complete) resolve()
  })
}

onMounted(async () => {
  if (!isLoading.value) return

  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  const startedAt = performance.now()

  const fontReady = document.fonts?.ready ?? Promise.resolve()
  await Promise.race([
    Promise.all([fontReady, ...criticalImages.map(preloadImage)]),
    wait(5000),
  ])

  const remainingMinimum = Math.max(0, 1000 - (performance.now() - startedAt))
  if (remainingMinimum) await wait(remainingMinimum)

  hasLoadedBirthday.value = true
  isLoading.value = false
  document.body.style.overflow = previousBodyOverflow
})

onBeforeUnmount(() => {
  if (isLoading.value) document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <div class="overflow-x-hidden" :aria-busy="isLoading">
    <Transition name="site-loader">
      <SiteLoader v-if="isLoading" />
    </Transition>

    <NavBar />
    <HeroSection />
    <div class="relative h-0 z-10">
      <img src="~/assets/images/optimized/dividers/4.webp" class="w-full absolute left-0 -translate-y-1/2 scale-[2.5] md:scale-[1.2]" alt="" loading="lazy" decoding="async" />
    </div>
    <EventDetailsV2 />
    <CheckeredDivider height="40px" />
    <WhosComing />
    <div class="bg-race-black/[0.97] w-full flex">
      <img src="~/assets/images/optimized/dividers/1.webp" class="w-full md:hidden" alt="" loading="lazy" decoding="async" />
      <img src="~/assets/images/optimized/dividers/3.webp" class="w-full hidden md:block" alt="" loading="lazy" decoding="async" />
    </div>
    <RsvpForm />
    <CheckeredDivider height="40px" />
    <GiftGuideV2 />
    <SiteFooter />
  </div>
</template>

<style scoped>
.site-loader-leave-active {
  will-change: transform;
  transition: transform 650ms cubic-bezier(0.76, 0, 0.24, 1);
}

.site-loader-leave-to {
  transform: translateY(-100%);
}
</style>
