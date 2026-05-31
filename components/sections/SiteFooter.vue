<script setup lang="ts">
function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer>
    <svg
      aria-hidden="true"
      class="block w-full h-8 md:h-14 text-race-black"
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,30 Q37.5,6 75,30 T150,30 T225,30 T300,30 T375,30 T450,30 T525,30 T600,30 T675,30 T750,30 T825,30 T900,30 T975,30 T1050,30 T1125,30 T1200,30 V60 H0 Z"
        fill="currentColor"
      />
    </svg>
    <div class="bg-race-black -mt-px relative overflow-hidden">

      <!-- Decorative layer -->
      <img src="~/assets/images/finishline.png" alt="" aria-hidden="true"
        class="pointer-events-none select-none absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl opacity-[0.04]" />
      <img src="~/assets/images/clouds/3.png" alt="" aria-hidden="true"
        class="cloud-float pointer-events-none select-none absolute left-[4%] top-1/3 w-44 opacity-[0.07]" />
      <img src="~/assets/images/clouds/5.png" alt="" aria-hidden="true"
        class="cloud-float-slow pointer-events-none select-none absolute right-[4%] top-1/2 w-44 opacity-[0.07]" />

      <div class="relative z-10 max-w-lg mx-auto px-6 py-10 flex flex-col items-center text-center gap-6">

        <!-- Headline -->
        <p class="font-racing text-2xl md:text-3xl text-race-cream tracking-wide leading-tight">
          See you at the finish line.
        </p>

        <!-- Date -->
        <p class="font-sans text-[11px] uppercase tracking-[0.45em] text-white/40">
          September 6, 2026
        </p>

        <div class="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <button
            type="button"
            class="font-racing text-[10px] uppercase tracking-[0.4em] text-white/30 hover:text-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-race-blue transition-colors duration-200"
            aria-label="Back to top"
            @click="backToTop"
          >
            ↑ Back to the Grid
          </button>
          <p class="font-sans text-[11px] text-white/25">
            With love, Uno &amp; Family, thank you for celebrating with us.
          </p>
        </div>

      </div>
    </div>
  </footer>
</template>
