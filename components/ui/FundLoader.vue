<script setup lang="ts">
defineProps<{ launching?: boolean }>()

const tiles = Array.from({ length: 9 }, (_, index) => index)
</script>

<template>
  <div
    class="fund-loader fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#f5f0eb] px-6"
    :class="{ 'fund-loader--launching': launching }"
    role="status"
    aria-live="polite"
    aria-label="Loading Uno's College Fund"
  >
    <div class="fund-loader__number" aria-hidden="true">01</div>

    <div class="fund-loader__content w-full max-w-sm" aria-hidden="true">
      <div class="mb-6 flex items-center justify-between">
        <p class="font-racing text-[9px] uppercase tracking-[0.48em] text-race-blue">Pit Lane</p>
        <p class="font-sans text-[8px] font-semibold uppercase tracking-[0.3em] text-race-gray/45">Season 2026</p>
      </div>

      <div class="fund-title">
        <div class="fund-title__line"><span style="--word-delay: 40ms">Uno's</span></div>
        <div class="fund-title__line fund-title__line--outline"><span style="--word-delay: 190ms">College</span></div>
        <div class="fund-title__line fund-title__line--blue"><span style="--word-delay: 340ms">Fund</span></div>
      </div>

      <div class="mt-8 flex justify-center">
        <div class="pit-tiles" aria-hidden="true">
          <span
            v-for="tile in tiles"
            :key="tile"
            :class="tile % 2 === 0 ? 'bg-race-black' : 'bg-race-blue'"
            :style="{ '--tile-delay': `${tile * 55}ms` }"
          />
        </div>
      </div>
    </div>

    <span class="sr-only">Loading Uno's College Fund</span>
  </div>
</template>

<style scoped>
.fund-loader__content {
  position: relative;
  z-index: 2;
  transition: transform 420ms cubic-bezier(0.7, 0, 0.84, 0), opacity 260ms ease;
}

.fund-loader--launching .fund-loader__content {
  transform: translateY(-18vh);
  opacity: 0;
}

.fund-loader__number {
  position: absolute;
  right: -0.08em;
  bottom: -0.22em;
  font-family: 'Formula1', sans-serif;
  font-size: clamp(15rem, 78vw, 34rem);
  line-height: 0.7;
  color: rgba(107, 140, 174, 0.065);
  user-select: none;
}

.fund-title {
  font-family: 'Formula1', sans-serif;
  font-size: clamp(3.5rem, 17vw, 5.7rem);
  font-weight: 700;
  line-height: 0.79;
  letter-spacing: -0.055em;
  text-transform: uppercase;
  color: #0d0d0d;
}

.fund-title__line {
  overflow: hidden;
  padding: 0.06em 0.04em 0.11em;
}

.fund-title__line span {
  display: block;
  animation: word-enter 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--word-delay);
}

.fund-title__line--outline {
  color: transparent;
  -webkit-text-stroke: 2px #0d0d0d;
}

.fund-title__line--blue {
  color: #6b8cae;
}

.pit-tiles {
  display: grid;
  grid-template-columns: repeat(9, 0.72rem);
  gap: 0.2rem;
  transform: skewX(-12deg);
}

.pit-tiles span {
  width: 0.72rem;
  aspect-ratio: 1;
  animation: tile-enter 1.3s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  animation-delay: var(--tile-delay);
}

@keyframes word-enter {
  from { opacity: 0; transform: translateY(105%); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes tile-enter {
  0%, 12% { opacity: 0.12; transform: scaleY(0.25); }
  30%, 72% { opacity: 1; transform: scaleY(1); }
  90%, 100% { opacity: 0.12; transform: scaleY(0.25); }
}

@media (prefers-reduced-motion: reduce) {
  .fund-loader__content,
  .fund-title__line span,
  .pit-tiles span {
    animation: none;
    transition: none;
  }
}
</style>
