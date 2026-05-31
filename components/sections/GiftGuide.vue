<script setup lang="ts">
const gifts = [
  { num: '01', icon: '🧷', label: 'Millie Moon Diaper', note: 'XL size', tag: 'PIT ESSENTIALS' },
  { num: '02', icon: '👕', label: '12–18 Month Clothes', note: 'Any style', tag: 'RACE DAY KIT' },
  { num: '03', icon: '📚', label: 'Educational Toys/Books', note: 'Age appropriate', tag: 'CREW INTEL' },
  { num: '04', icon: '🐷', label: 'Monetary Gift', note: 'Always appreciated', tag: 'FUEL FUND', link: '/fund' },
]
</script>

<template>
  <section id="gifts" class="relative overflow-hidden pb-0">

    <!-- Watercolor blotches -->
    <img src="~/assets/images/upperright-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute -top-10 -right-10 w-[70vw] opacity-20 select-none" />
    <img src="~/assets/images/lowerleft-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute bottom-56 -left-10 w-[60vw] opacity-15 select-none" />

    <!-- Speed line texture overlay -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.025] select-none"
      style="background: repeating-linear-gradient(
        -12deg,
        transparent,
        transparent 18px,
        #4A4A4A 18px,
        #4A4A4A 19px
      );"
    />

    <!-- Main content -->
    <div class="pt-20 pb-6 px-4 relative z-10">
      <div class="max-w-3xl mx-auto">

        <!-- Title -->
        <div class="text-center mb-10">
          <div class="flex items-center justify-center gap-0 mb-1">
            <img src="~/assets/images/flag.png" alt="" aria-hidden="true"
              class="w-24 h-auto select-none opacity-90 -mr-4" style="transform: scaleX(-1) rotate(-6deg);" />
            <h2 class="font-racing text-5xl md:text-6xl text-race-black tracking-wide">Gift Guide</h2>
            <img src="~/assets/images/flag.png" alt="" aria-hidden="true"
              class="w-24 h-auto select-none opacity-90 -ml-4" style="transform: rotate(-6deg);" />
          </div>

          <div class="flex items-center justify-center gap-3 mb-6 mt-2">
            <div class="h-px w-10 bg-race-gray/30"></div>
            <span class="font-racing text-[11px] text-race-blue tracking-[0.45em] uppercase">Pit Stop Wishlist</span>
            <div class="h-px w-10 bg-race-gray/30"></div>
          </div>

          <p class="font-sans text-sm text-race-gray mb-2 max-w-md mx-auto leading-relaxed">
            If you're considering giving a gift, we would love things that Uno actually needs.
            This helps make the most of your generosity while keeping things practical and meaningful.
          </p>
          <p class="font-sans text-xs text-race-gray/55">
            Of course, your love and presence are the greatest gifts of all — please don't feel any pressure!
          </p>
        </div>

        <!-- Pit board–style gift cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14">
          <div
            v-for="gift in gifts"
            :key="gift.label"
            class="flex flex-col overflow-hidden"
            style="background: rgba(255,255,255,0.78); border: 1px solid rgba(107,140,174,0.2);"
          >
            <!-- Pit board header -->
            <div class="bg-race-black px-3 py-2 flex items-center gap-2">
              <span class="font-racing text-white text-base leading-none">{{ gift.num }}</span>
              <div class="flex-1 h-px bg-white/10 mx-1"></div>
              <span class="font-racing text-race-blue text-[8px] tracking-[0.15em] leading-none text-right">{{ gift.tag }}</span>
            </div>
            <!-- Card body -->
            <div class="flex flex-col items-center gap-2 py-5 px-2">
              <div class="w-14 h-14 rounded-full bg-race-blue/10 border border-race-blue/25 flex items-center justify-center text-2xl">
                {{ gift.icon }}
              </div>
              <p class="font-sans text-sm text-race-black font-semibold leading-snug text-center">{{ gift.label }}</p>
              <p class="font-racing text-[10px] text-race-blue/75 tracking-widest uppercase">{{ gift.note }}</p>
              <NuxtLink
                v-if="gift.link"
                :to="gift.link"
                class="font-sans text-[10px] text-race-blue underline underline-offset-2 hover:text-race-black transition-colors mt-1"
              >contribute →</NuxtLink>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Mascot row: Mickey left, Wheels+Flags right -->
    <div class="relative z-10 flex justify-between items-end px-6 md:px-20">
      <img
        src="~/assets/images/mickey.png"
        alt="Mickey in racing suit"
        class="w-40 md:w-52 select-none drop-shadow-sm"
      />
      <img
        src="~/assets/images/tireflag.png"
        alt=""
        aria-hidden="true"
        class="w-32 md:w-44 select-none opacity-85 mb-2"
      />
    </div>

    <!-- Finish Line band -->
    <img
      src="~/assets/images/finishline.png"
      alt=""
      aria-hidden="true"
      class="w-full select-none block"
      style="height: 32px; object-fit: cover; object-position: center;"
    />

    <!-- Dark footer -->
    <div class="bg-race-black py-10 text-center relative overflow-hidden">
      <img src="~/assets/images/clouds/3.png" alt="" aria-hidden="true"
        class="cloud-float pointer-events-none absolute left-[6%] top-1/2 -translate-y-1/2 w-40 opacity-[0.08] select-none" />
      <img src="~/assets/images/clouds/5.png" alt="" aria-hidden="true"
        class="cloud-float-slow pointer-events-none absolute right-[6%] top-1/2 -translate-y-1/2 w-40 opacity-[0.08] select-none" />

      <p class="font-racing text-race-blue text-2xl md:text-3xl tracking-wide relative z-10">
        See you at the finish line.
      </p>
      <p class="font-sans text-[11px] uppercase tracking-[0.45em] text-white/40 mt-2 relative z-10">
        September 6, 2026
      </p>
    </div>

  </section>
</template>
