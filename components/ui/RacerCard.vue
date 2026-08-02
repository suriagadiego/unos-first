<script setup lang="ts">
import { getTeamName } from '~/utils/teamName'

const props = defineProps<{
  position: number
  name: string
  gridName?: string | null
  teamName?: string
  headcount?: number | null
  guestNames?: string[]
  kidsNames?: string[]
  salt?: number
  active?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const pos = computed(() => String(props.position).padStart(2, '0'))
const resolvedTeamName = computed(() => props.teamName || getTeamName(
  props.gridName?.trim() || props.name,
  props.headcount,
  props.guestNames,
  props.salt ?? props.position,
))
</script>

<template>
  <div
    class="relative overflow-hidden border border-white/10 bg-white/[0.04] p-4 pt-5 group hover:border-race-blue/60 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer select-none"
    @click="emit('select')"
  >
    <!--
      Watermark number — anchored to the bottom-right corner of the card.
      right / bottom are in em units so they scale with font-size.
      right: -0.05em clips the outer edge of the last digit slightly.
      bottom: -0.18em lets the number sit on the "floor" with the baseline
      just peeking above the card edge — cropped by overflow-hidden.
    -->
    <span
      class="absolute font-racing leading-none select-none pointer-events-none text-white/[0.08]"
      style="font-size: 5.5rem; right: -0.05em; bottom: -0.18em;"
    >
      {{ pos }}
    </span>

    <!-- Front -->
    <div
      class="relative z-10 transition-all duration-300"
      :class="active ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'"
    >
      <p class="font-sans text-[9px] uppercase tracking-[0.4em] text-race-blue mb-2">P{{ pos }}</p>
      <p class="font-racing text-sm leading-tight" style="color: #f5f0eb;">{{ resolvedTeamName }}</p>
      <p class="font-sans text-[8px] uppercase tracking-[0.3em] mt-1" style="color: rgba(245,240,235,0.35);">{{ name }}</p>
    </div>

    <!-- Back -->
    <div
      class="absolute inset-0 z-10 transition-all duration-300 p-4 flex items-center"
      :class="active ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'"
    >
      <!-- With names: number left, names right -->
      <div v-if="guestNames?.length" class="flex items-center gap-2 w-full">
        <div class="flex flex-col items-center flex-shrink-0">
          <p class="font-racing text-3xl leading-none" style="color: #f5f0eb;">{{ headcount ?? '?' }}</p>
          <p class="font-sans text-[8px] mt-0.5 text-race-blue">{{ headcount === 1 ? 'racer' : 'racers' }}</p>
        </div>
        <div class="w-px self-stretch" style="background: rgba(245,240,235,0.12);" />
        <div
          class="overflow-hidden"
          :class="guestNames.length > 5 ? 'grid grid-cols-2 gap-x-2 gap-y-0.5' : 'flex flex-col gap-0.5'"
        >
          <p
            v-for="n in guestNames"
            :key="n"
            class="flex min-w-0 items-center gap-1 font-sans text-xs font-semibold leading-tight"
            style="color: #f5f0eb;"
          >
            <span class="truncate">{{ n.split(' ')[0] }}</span>
            <span
              v-if="kidsNames?.includes(n)"
              class="shrink-0 text-[10px] leading-none"
              role="img"
              aria-label="Kid racer"
              title="Kid racer"
            >🏎️</span>
          </p>
        </div>
      </div>

      <!-- No names: centered as before -->
      <div v-else class="flex flex-col items-center justify-center h-full -mt-4">
        <p class="font-racing text-4xl" style="color: #f5f0eb;">{{ headcount ?? '?' }}</p>
        <p class="font-sans text-[9px] mt-1" style="color: rgba(245,240,235,0.35);">{{ headcount === 1 ? 'racer' : 'racers' }}</p>
      </div>
    </div>

    <!-- Hover accent line -->
    <div class="absolute bottom-0 left-0 w-0 h-[2px] bg-race-blue group-hover:w-full transition-all duration-300" />
  </div>
</template>
