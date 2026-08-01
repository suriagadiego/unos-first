<script setup lang="ts">
import collegeUrl from '~/assets/images/optimized/college.webp'
import tireFlagUrl from '~/assets/images/optimized/tireflag.webp'
import upperWatercolorUrl from '~/assets/images/optimized/upperright-watercolor.webp'
import lowerWatercolorUrl from '~/assets/images/optimized/lowerleft-watercolor.webp'
import cloudTwoUrl from '~/assets/images/optimized/clouds/2.webp'
import cloudFourUrl from '~/assets/images/optimized/clouds/4.webp'
import footerUrl from '~/assets/images/optimized/footer.webp'

const hasLoadedFund = useState('fund-assets-loaded', () => false)
const isLoading = ref(!hasLoadedFund.value)
const isLaunching = ref(false)
let previousBodyOverflow = ''
let markFundDataReady: () => void = () => {}
const fundDataReady = new Promise<void>((resolve) => { markFundDataReady = resolve })

const criticalImages = [
  collegeUrl,
  tireFlagUrl,
  upperWatercolorUrl,
  lowerWatercolorUrl,
  cloudTwoUrl,
  cloudFourUrl,
  footerUrl,
  '/images/uno-car.png',
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

  await Promise.race([
    Promise.all([fundDataReady, ...criticalImages.map(preloadImage)]),
    wait(5000),
  ])

  const remainingMinimum = Math.max(0, 800 - (performance.now() - startedAt))
  if (remainingMinimum) await wait(remainingMinimum)

  isLaunching.value = true
  await wait(430)
  hasLoadedFund.value = true
  isLoading.value = false
  document.body.style.overflow = previousBodyOverflow
})

onBeforeUnmount(() => {
  if (isLoading.value) document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <div :aria-busy="isLoading">
    <Transition name="fund-loader">
      <FundLoader v-if="isLoading" :launching="isLaunching" />
    </Transition>
    <CollegeFund @ready="markFundDataReady" />
  </div>
</template>

<style scoped>
.fund-loader-leave-active {
  will-change: transform;
  transition: transform 520ms cubic-bezier(0.76, 0, 0.24, 1);
}

.fund-loader-leave-to {
  transform: translateX(100%);
}
</style>
