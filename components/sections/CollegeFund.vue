<script setup lang="ts">
const MOCK_PERCENTAGE = 47
const MOCK_CONTRIBUTORS = 38
const FUND_DEADLINE = new Date('2026-09-13T00:00:00')

const { days } = useCountdown(FUND_DEADLINE)

const displayPct = ref(0)
const displayContributors = ref(0)

onMounted(() => {
  const pctTimer = setInterval(() => {
    if (displayPct.value < MOCK_PERCENTAGE) displayPct.value++
    else clearInterval(pctTimer)
  }, 18)

  const cTimer = setInterval(() => {
    if (displayContributors.value < MOCK_CONTRIBUTORS) displayContributors.value++
    else clearInterval(cTimer)
  }, 30)
})
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col">

    <!-- Top half: illustration + title -->
    <div class="flex-1 flex flex-col items-center justify-end pb-10 px-6 pt-20 relative overflow-hidden">

      <!-- Subtle checkered corners -->
      <div class="absolute top-0 left-0 w-40 h-40 checkered-bg opacity-[0.04]" />
      <div class="absolute top-0 right-0 w-40 h-40 checkered-bg opacity-[0.04]" />

      <!-- Illustration row -->
      <div class="flex items-end justify-center gap-4 mb-10 w-full max-w-lg">
        <PlaceholderAsset label="📚 Books" width="100px" height="120px" variant="light" />
        <PlaceholderAsset label="🏎️ Race Car" width="180px" height="100px" />
        <PlaceholderAsset label="🎓 Trophy" width="90px" height="110px" variant="light" />
      </div>

      <!-- Label -->
      <p class="font-sans text-xs uppercase tracking-[0.3em] text-race-gray mb-2">His most important finish line</p>

      <!-- Title -->
      <h1 class="font-racing text-[clamp(3rem,10vw,6rem)] text-race-black italic text-center leading-none mb-3">
        Uno's College Fund
      </h1>

      <!-- Subtitle -->
      <p class="font-sans text-sm text-race-gray text-center max-w-sm leading-relaxed">
        Every peso goes directly into Uno's PSSLAI fund —
        locked and invested until he reaches college.
      </p>
    </div>

    <CheckeredDivider height="16px" />

    <!-- Bottom half: stats + progress + CTA -->
    <div class="flex flex-col items-center px-6 py-14 max-w-2xl mx-auto w-full">

      <!-- Stats row -->
      <div class="grid grid-cols-3 w-full mb-8 divide-x divide-race-blue-light/40">
        <div class="text-center px-4">
          <p class="font-racing text-[clamp(2.5rem,8vw,4rem)] text-race-black leading-none">{{ displayContributors }}</p>
          <p class="font-sans text-[10px] uppercase tracking-widest text-race-gray mt-1">Contributors</p>
        </div>
        <div class="text-center px-4">
          <p class="font-racing text-[clamp(2.5rem,8vw,4rem)] text-race-black leading-none">{{ days }}</p>
          <p class="font-sans text-[10px] uppercase tracking-widest text-race-gray mt-1">Days to Go</p>
        </div>
        <div class="text-center px-4">
          <p class="font-racing text-[clamp(2.5rem,8vw,4rem)] text-race-blue leading-none">{{ displayPct }}%</p>
          <p class="font-sans text-[10px] uppercase tracking-widest text-race-gray mt-1">Funded</p>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full h-3 bg-race-gray/10 rounded-full overflow-hidden mb-2">
        <div
          class="h-full bg-race-blue rounded-full transition-all duration-1000"
          :style="{ width: `${MOCK_PERCENTAGE}%` }"
        />
      </div>
      <div class="flex justify-between w-full mb-10">
        <span class="font-sans text-[10px] text-race-gray/50 uppercase tracking-widest">Start</span>
        <span class="font-sans text-[10px] text-race-gray/50 uppercase tracking-widest">Goal 🏁</span>
      </div>

      <!-- CTA -->
      <button class="bg-race-blue text-white font-sans text-xs uppercase tracking-widest px-14 py-4 rounded-full hover:bg-race-blue/80 transition-colors mb-3">
        Join the Pit Crew
      </button>
      <p class="font-sans text-[10px] text-race-gray/40">Payment details coming soon</p>
    </div>

    <!-- Back -->
    <div class="text-center pb-10">
      <NuxtLink
        to="/"
        class="font-sans text-[10px] uppercase tracking-widest text-race-gray/40 hover:text-race-gray transition-colors"
      >
        ← Back to the race
      </NuxtLink>
    </div>
  </div>
</template>
