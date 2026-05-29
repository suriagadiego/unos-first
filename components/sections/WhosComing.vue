<script setup lang="ts">
const { data: apiGuests } = await useFetch<any[]>('/api/public/rsvps')

const guestCards = computed(() =>
  (apiGuests.value ?? []).map((r: any) => ({
    name: r.displayName,
    headcount: r.headcount ?? null,
    guestNames: r.guestNames ?? [],
  }))
)

const activeCard = ref<number | null>(null)
let flipTimer: ReturnType<typeof setTimeout> | null = null

function selectCard(i: number) {
  if (flipTimer) clearTimeout(flipTimer)
  activeCard.value = activeCard.value === i ? null : i
  if (activeCard.value !== null) {
    flipTimer = setTimeout(() => { activeCard.value = null }, 4000)
  }
}

</script>

<template>
  <section id="whoscoming" class="py-20 px-4 bg-race-black/[0.97] relative overflow-hidden">

    <!-- Speed lines -->
    <div class="absolute inset-0 pointer-events-none"
      style="background-image: repeating-linear-gradient(78deg, rgba(245,240,235,0.015) 0px, rgba(245,240,235,0.015) 1px, transparent 1px, transparent 64px);" />

    <!-- Watercolor bleeds -->
    <img src="~/assets/images/upperright-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute -top-10 -right-10 w-[55vw] md:w-[30vw] opacity-[0.06] select-none" />
    <img src="~/assets/images/lowerleft-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute -bottom-10 -left-10 w-[55vw] md:w-[30vw] opacity-[0.06] select-none" />

    <!-- Clouds -->
    <div class="pointer-events-none absolute -top-16 -left-16 select-none" style="transform: scaleX(-1);">
      <img src="~/assets/images/clouds/1.png" alt="" aria-hidden="true" class="cloud-float w-[520px] opacity-[0.15]" />
    </div>
    <img src="~/assets/images/clouds/1.png" alt="" aria-hidden="true"
      class="cloud-float-slow pointer-events-none absolute -top-10 -right-20 w-[360px] opacity-[0.18] select-none"
      style="transform: scaleX(-1);" />
    <img src="~/assets/images/clouds/1.png" alt="" aria-hidden="true"
      class="cloud-float pointer-events-none absolute -top-12 left-[38%] w-[280px] opacity-[0.12] select-none"
      style="transform: scaleX(-1);" />

    <div class="max-w-4xl mx-auto relative z-10">
      <div class="text-center mb-14">
        <p class="font-sans text-[9px] uppercase tracking-[0.6em] text-race-blue mb-4">— 2026 Season Opener —</p>
        <h2 class="font-racing text-6xl md:text-7xl tracking-wide" style="color: #f5f0eb;">On the Grid</h2>
        <div class="flex items-center justify-center gap-4 mt-4">
          <div class="h-px flex-1 max-w-20" style="background: rgba(245,240,235,0.15);" />
          <p class="font-sans text-[9px] uppercase tracking-[0.5em]" style="color: rgba(245,240,235,0.35);">Confirmed Starters</p>
          <div class="h-px flex-1 max-w-20" style="background: rgba(245,240,235,0.15);" />
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <RacerCard
          v-for="(card, i) in guestCards"
          :key="card.name"
          :position="i + 1"
          :name="card.name"
          :headcount="card.headcount"
          :guest-names="card.guestNames"
          :active="activeCard === i"
          @select="selectCard(i)"
        />
      </div>

      <p class="font-sans text-[11px] mt-10 text-center" style="color: rgba(245,240,235,0.35);">
        Not on the grid yet?
        <a href="#rsvp" class="text-race-blue hover:underline underline-offset-2">Join the race ↓</a>
      </p>
    </div>
  </section>
</template>
