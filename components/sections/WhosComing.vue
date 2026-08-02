<script setup lang="ts">
import { reserveUniqueTeamName } from '~/utils/teamName'

const { data: apiGuests, refresh: refreshGuests } = await useFetch<any[]>('/api/public/rsvps', { key: 'public-rsvps' })

function refreshGrid() {
  if (!document.hidden) void refreshGuests()
}

onMounted(() => {
  void refreshGuests()
  window.addEventListener('focus', refreshGrid)
  window.addEventListener('rsvp:reveal-team', revealNewTeam as EventListener)
  document.addEventListener('visibilitychange', refreshGrid)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshGrid)
  window.removeEventListener('rsvp:reveal-team', revealNewTeam as EventListener)
  document.removeEventListener('visibilitychange', refreshGrid)
  if (highlightTimer) clearTimeout(highlightTimer)
})

const guestCards = computed(() => {
  const counters: Record<string, number> = {}
  const usedTeamNames = new Set<string>()
  return (apiGuests.value ?? []).map((r: any) => {
    const hc = r.headcount ?? 1
    const key = hc <= 2 ? String(hc) : 'group'
    const salt = counters[key] ?? 0
    counters[key] = salt + 1
    const displayName = r.gridName?.trim() || r.displayName
    return {
      id: r.id,
      name: r.displayName,
      gridName: r.gridName ?? null,
      teamName: reserveUniqueTeamName(displayName, r.headcount, r.guestNames, salt, usedTeamNames),
      headcount: r.headcount ?? null,
      guestNames: r.guestNames ?? [],
      kidsNames: r.kidsNames ?? [],
      salt,
    }
  })
})

const activeCard = ref<number | null>(null)
const highlightedCardId = ref<string | null>(null)
const showAllTeams = ref(false)
const VISIBLE_TEAM_COUNT = 12
let flipTimer: ReturnType<typeof setTimeout> | null = null
let highlightTimer: ReturnType<typeof setTimeout> | null = null

function toggleTeams() {
  showAllTeams.value = !showAllTeams.value
  activeCard.value = null
}

function selectCard(i: number) {
  if (flipTimer) clearTimeout(flipTimer)
  activeCard.value = activeCard.value === i ? null : i
  if (activeCard.value !== null) {
    flipTimer = setTimeout(() => { activeCard.value = null }, 4000)
  }
}

async function revealNewTeam(event: CustomEvent<{ id: string | number }>) {
  const id = String(event.detail.id)
  showAllTeams.value = true
  await refreshGuests()
  await nextTick()

  highlightedCardId.value = id
  document.getElementById(`team-card-${id}`)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'center',
  })

  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => { highlightedCardId.value = null }, 2600)
}

</script>

<template>
  <section id="whoscoming" class="py-20 px-4 bg-race-black/[0.97] relative overflow-hidden">

    <!-- Speed lines -->
    <div class="absolute inset-0 pointer-events-none"
      style="background-image: repeating-linear-gradient(78deg, rgba(245,240,235,0.015) 0px, rgba(245,240,235,0.015) 1px, transparent 1px, transparent 64px);" />

    <!-- Watercolor bleeds -->
    <img src="~/assets/images/optimized/upperright-watercolor.webp" alt="" aria-hidden="true" loading="lazy" decoding="async"
      class="pointer-events-none absolute -top-10 -right-10 w-[55vw] md:w-[30vw] opacity-[0.06] select-none" />
    <img src="~/assets/images/optimized/lowerleft-watercolor.webp" alt="" aria-hidden="true" loading="lazy" decoding="async"
      class="pointer-events-none absolute -bottom-10 -left-10 w-[55vw] md:w-[30vw] opacity-[0.06] select-none" />

    <!-- Clouds -->
    <div class="pointer-events-none absolute -top-16 -left-16 select-none" style="transform: scaleX(-1);">
      <img src="~/assets/images/optimized/clouds/1.webp" alt="" aria-hidden="true" class="cloud-float w-[520px] opacity-[0.15]" loading="lazy" decoding="async" />
    </div>
    <img src="~/assets/images/optimized/clouds/1.webp" alt="" aria-hidden="true" loading="lazy" decoding="async"
      class="cloud-float-slow pointer-events-none absolute -top-10 -right-20 w-[360px] opacity-[0.18] select-none"
      style="transform: scaleX(-1);" />
    <img src="~/assets/images/optimized/clouds/1.webp" alt="" aria-hidden="true" loading="lazy" decoding="async"
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

      <div id="team-grid">
        <div
          v-if="!showAllTeams && guestCards.length > VISIBLE_TEAM_COUNT"
          class="team-viewport relative overflow-hidden"
          :class="{ 'is-paused': activeCard !== null }"
        >
          <div class="team-track">
            <div
              v-for="copy in 2"
              :key="copy"
              class="grid grid-cols-2 gap-3 pb-3 sm:grid-cols-3 md:grid-cols-4"
              :aria-hidden="copy === 2 ? 'true' : undefined"
            >
              <RacerCard
                v-for="(card, i) in guestCards"
                :key="`${copy}-${card.id}`"
                :id="copy === 1 ? `team-card-${card.id}` : undefined"
                class="h-[104px]"
                :class="{ 'team-card-highlight': copy === 1 && highlightedCardId === String(card.id) }"
                :position="i + 1"
                :name="card.name"
                :grid-name="card.gridName"
                :team-name="card.teamName"
                :headcount="card.headcount"
                :guest-names="card.guestNames"
                :kids-names="card.kidsNames"
                :salt="card.salt"
                :active="activeCard === i"
                @select="selectCard(i)"
              />
            </div>
          </div>

          <div class="team-fade team-fade-top" aria-hidden="true" />
          <div class="team-fade team-fade-bottom" aria-hidden="true" />
        </div>

        <TransitionGroup
          v-else
          name="team-card"
          tag="div"
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        >
          <RacerCard
            v-for="(card, i) in guestCards"
            :key="card.id"
            :id="`team-card-${card.id}`"
            class="h-[104px]"
            :class="{ 'team-card-highlight': highlightedCardId === String(card.id) }"
            :position="i + 1"
            :name="card.name"
            :grid-name="card.gridName"
            :team-name="card.teamName"
            :headcount="card.headcount"
            :guest-names="card.guestNames"
            :kids-names="card.kidsNames"
            :salt="card.salt"
            :active="activeCard === i"
            @select="selectCard(i)"
          />
        </TransitionGroup>
      </div>

      <div v-if="guestCards.length > VISIBLE_TEAM_COUNT" class="mt-7 flex justify-center sm:hidden">
        <button
          type="button"
          class="group flex min-h-12 items-center justify-center gap-3 bg-race-blue px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_24px_rgba(113,151,187,0.18)] transition-all duration-300 active:scale-[0.98]"
          style="clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);"
          :aria-expanded="showAllTeams"
          aria-controls="team-grid"
          @click="toggleTeams"
        >
          <span>{{ showAllTeams ? 'Return to rolling grid' : `View all ${guestCards.length} teams` }}</span>
          <span
            aria-hidden="true"
            class="text-base leading-none transition-transform duration-300"
            :class="showAllTeams ? 'rotate-180' : ''"
          >↓</span>
        </button>
      </div>

      <p class="font-sans text-[11px] mt-8 text-center" style="color: rgba(245,240,235,0.35);">
        Not on the grid yet?
        <a href="#rsvp" class="text-race-blue hover:underline underline-offset-2">Join the race ↓</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.team-viewport {
  height: 684px;
}

.team-track {
  animation: team-roll 52s linear infinite;
  will-change: transform;
}

.team-viewport.is-paused .team-track {
  animation-play-state: paused;
}

.team-fade {
  position: absolute;
  z-index: 20;
  right: 0;
  left: 0;
  height: 32px;
  pointer-events: none;
}

.team-fade-top {
  top: 0;
  background: linear-gradient(to bottom, rgba(16, 16, 16, 0.96), transparent);
}

.team-fade-bottom {
  bottom: 0;
  background: linear-gradient(to top, rgba(16, 16, 16, 0.96), transparent);
}

@keyframes team-roll {
  to {
    transform: translateY(-50%);
  }
}

.team-card-highlight {
  position: relative;
  z-index: 10;
  animation: team-highlight 2.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes team-highlight {
  0%, 100% {
    border-color: rgba(113, 151, 187, 0.35);
    box-shadow: 0 0 0 0 rgba(113, 151, 187, 0);
  }
  20%, 65% {
    border-color: #7197bb;
    box-shadow: 0 0 0 3px rgba(113, 151, 187, 0.24), 0 0 28px rgba(113, 151, 187, 0.28);
  }
}

@media (hover: hover) and (pointer: fine) {
  .team-viewport:hover .team-track {
    animation-play-state: paused;
  }
}

.team-card-enter-active,
.team-card-leave-active {
  transition:
    opacity 300ms ease,
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.team-card-enter-from,
.team-card-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}

@media (min-width: 640px) {
  .team-viewport {
    height: auto;
    overflow: visible;
  }

  .team-track {
    animation: none;
  }

  .team-track > div:nth-child(2),
  .team-fade {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .team-viewport {
    height: auto;
  }

  .team-track {
    animation: none;
  }

  .team-track > div:nth-child(2) {
    display: none;
  }

  .team-card-enter-active,
  .team-card-leave-active,
  .team-card-highlight {
    transition: none;
    animation: none;
  }
}
</style>
