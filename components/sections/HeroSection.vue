<script setup lang="ts">
</script>

<template>
  <section id="hero" class="relative pt-14 overflow-hidden h-[100svh] flex flex-col md:min-h-screen md:h-auto md:block">

    <!-- Upper left — single cloud, slightly larger -->
    <img src="~/assets/images/clouds/5.png" alt="" aria-hidden="true"
      class="cloud-float-slow pointer-events-none absolute top-14 -left-6 w-[65vw] md:w-[20vw] opacity-65 select-none z-10" />

    <!-- Upper right — watercolor base with 2 white clouds spread out -->
    <img src="~/assets/images/upperright-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute top-0 right-0 w-[90vw] md:w-[76vw] opacity-75 select-none z-10" />
    <img src="~/assets/images/clouds/4.png" alt="" aria-hidden="true"
      class="cloud-float-slow pointer-events-none absolute top-4 right-[10vw] w-[55vw] md:w-[16vw] opacity-90 select-none z-10" />
    <img src="~/assets/images/clouds/1.png" alt="" aria-hidden="true"
      class="cloud-float pointer-events-none absolute top-24 right-0 w-[50vw] md:w-[16vw] opacity-85 select-none z-10" />

    <!-- Illustration pinned to bottom -->
    <div class="absolute bottom-0 left-0 right-0 scale-[1.6] origin-bottom-right md:scale-100">
      <img src="~/assets/images/landing.png" class="w-full block md:scale-[0.85] md:origin-bottom-right" alt="" />
      <img src="~/assets/images/lowerleft-watercolor.png" alt="" aria-hidden="true"
        class="pointer-events-none absolute bottom-0 left-0 w-4/5 select-none opacity-80" />
    </div>

    <!-- Text in upper area, above the clouds and car -->
    <div class="relative z-20 flex flex-col items-center text-center justify-start flex-1 px-6 pt-[1vh] md:pt-8 md:flex-none md:pl-8 md:pr-[40vw]">

      <!-- Arc: LAP 1 OF A LIFETIME -->
      <svg viewBox="0 0 320 80" class="w-64 h-12 overflow-visible mb-1">
        <path id="arc" d="M 20,70 Q 160,-10 300,70" fill="none" />
        <text font-family="'Plus Jakarta Sans', sans-serif" font-size="11" fill="#4A4A4A" letter-spacing="4">
          <textPath href="#arc" startOffset="50%" text-anchor="middle">LAP 1 OF A LIFETIME</textPath>
        </text>
      </svg>

      <p class="font-sans text-[11px] uppercase tracking-[0.35em] text-race-gray mb-1">The First Birthday of</p>

      <h1 class="font-racing text-[clamp(4.5rem,25vw,9rem)] leading-none text-race-black md:text-[clamp(4.5rem,16vw,9rem)]">
        UNO
      </h1>

      <p class="font-sans text-[11px] uppercase tracking-[0.1em] md:tracking-[0.25em] text-race-gray mt-1 mb-2">
        First Lap &nbsp;★&nbsp; First Party &nbsp;★&nbsp; First Memories
      </p>

      <!-- Lights out ticket -->
      <div class="border border-race-gray/40 bg-white/30 backdrop-blur-sm px-4 py-2 mb-2 flex flex-col items-center gap-0.5">
        <p class="font-sans text-[9px] uppercase tracking-[0.4em] text-race-gray">Lights Out</p>
        <p class="font-script text-base text-race-blue leading-tight">it's time to celebrate</p>
        <p class="font-sans text-[9px] uppercase tracking-[0.3em] text-race-gray">
          Uno is turning &nbsp;<span class="font-racing text-race-blue text-sm">ONE</span>
        </p>
      </div>

      <!-- Event chips -->
      <div class="flex gap-1 md:gap-2 flex-wrap justify-center mb-2">
        <span class="bg-white/50 backdrop-blur-sm border border-race-blue/20 text-race-blue font-sans text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest px-2 py-1 md:px-4 md:py-2">
          St. John the Baptist Parish
        </span>
        <span class="bg-white/50 backdrop-blur-sm border border-race-blue/20 text-race-blue font-sans text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest px-2 py-1 md:px-4 md:py-2">
          September 6, 2026
        </span>
        <span class="bg-white/50 backdrop-blur-sm border border-race-blue/20 text-race-blue font-sans text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest px-2 py-1 md:px-4 md:py-2">
          Reception to follow
        </span>
      </div>

      <CountdownTimer />

    </div>

    <!-- Scroll cue -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 animate-bounce">
      <span class="font-sans text-[10px] uppercase tracking-widest text-race-gray/60">Scroll</span>
      <svg class="w-4 h-4 text-race-gray/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

  </section>
</template>
