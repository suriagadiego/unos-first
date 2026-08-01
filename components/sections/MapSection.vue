<script setup lang="ts">
const locations = [
  {
    stop: '01',
    label: 'Church',
    name: 'Santo Domingo Church',
    sublabel: 'St. Thomas Hall',
    time: '10:30 AM',
    mapSrc: 'https://www.google.com/maps?q=Santo+Domingo+Church+Quezon+City+Philippines&output=embed',
    directionsUrl: 'https://share.google/JoMzsDIvVSq1t2EtQ',
  },
  {
    stop: '02',
    label: 'Reception',
    name: 'Steelworld Tower',
    sublabel: '',
    time: '12:00 PM',
    mapSrc: 'https://www.google.com/maps?q=Steelworld+Tower+Philippines&output=embed',
    directionsUrl: 'https://share.google/8SVJqAhnnpPMGIAY6',
  },
]
</script>

<template>
  <section id="map" class="py-20 px-4 relative overflow-hidden">

    <!-- Watercolor bleeds -->
    <img src="~/assets/images/optimized/upperright-watercolor.webp" alt="" aria-hidden="true"
      class="pointer-events-none absolute -top-10 -right-10 w-[55vw] md:w-[30vw] opacity-[0.18] select-none" />
    <img src="~/assets/images/optimized/lowerleft-watercolor.webp" alt="" aria-hidden="true"
      class="pointer-events-none absolute -bottom-10 -left-10 w-[55vw] md:w-[30vw] opacity-[0.18] select-none" />

    <div class="max-w-4xl mx-auto relative z-10">

      <!-- Heading -->
      <div class="text-center mb-14">
        <p class="font-sans text-[9px] uppercase tracking-[0.6em] text-race-blue mb-4">— June 7, 2026 —</p>
        <h2 class="font-racing text-6xl md:text-7xl tracking-wide text-race-black">The Circuit</h2>
        <div class="flex items-center justify-center gap-4 mt-4">
          <div class="h-px flex-1 max-w-20 bg-race-black/15" />
          <p class="font-sans text-[9px] uppercase tracking-[0.5em] text-race-black/35">Race Day Venues</p>
          <div class="h-px flex-1 max-w-20 bg-race-black/15" />
        </div>
      </div>

      <!-- Location cards -->
      <div class="grid md:grid-cols-2 gap-6">
        <div
          v-for="loc in locations"
          :key="loc.stop"
          class="relative overflow-hidden border border-race-black/10 bg-white group hover:border-race-blue/50 transition-all duration-300 shadow-sm"
        >
          <!-- Watermark stop number -->
          <span
            class="absolute font-racing leading-none select-none pointer-events-none text-race-black/[0.04] z-0"
            style="font-size: 9rem; right: -0.05em; bottom: -0.2em;"
          >{{ loc.stop }}</span>

          <!-- Map -->
          <div class="relative overflow-hidden" style="height: 200px;">
            <iframe
              :src="loc.mapSrc"
              class="w-full h-full border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>

          <!-- Info -->
          <div class="relative z-10 p-5">
            <div class="flex items-center gap-3 mb-3">
              <span class="font-sans text-[9px] uppercase tracking-[0.4em] text-race-blue">Stop {{ loc.stop }}</span>
              <div class="h-px flex-1 bg-race-black/10" />
              <span class="font-racing text-lg text-race-black">{{ loc.time }}</span>
            </div>

            <p class="font-racing text-2xl leading-tight mb-0.5 text-race-black">{{ loc.name }}</p>
            <p v-if="loc.sublabel" class="font-sans text-[10px] uppercase tracking-widest mb-4 text-race-black/40">{{ loc.sublabel }}</p>
            <p v-else class="mb-4" />

            <a
              :href="loc.directionsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block font-sans text-[9px] uppercase tracking-[0.4em] text-race-blue border border-race-blue/40 px-4 py-2 hover:bg-race-blue hover:text-white transition-colors duration-200"
            >
              Get Directions →
            </a>
          </div>

          <!-- Hover accent line -->
          <div class="absolute bottom-0 left-0 w-0 h-[2px] bg-race-blue group-hover:w-full transition-all duration-300" />
        </div>
      </div>

    </div>
  </section>
</template>
