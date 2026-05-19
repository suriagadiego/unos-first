<script setup lang="ts">
</script>

<template>
  <section id="hero" class="min-h-screen flex flex-col items-center justify-center bg-white pt-14 pb-8 px-4">
    <!-- Arc text -->
    <div class="flex flex-col items-center gap-1 mb-2">
      <svg viewBox="0 0 300 80" class="w-64 h-16 overflow-visible">
        <path id="arc" d="M 30,70 Q 150,-10 270,70" fill="none" />
        <text font-family="'DM Sans', sans-serif" font-size="13" fill="#4A4A4A" letter-spacing="3">
          <textPath href="#arc" startOffset="50%" text-anchor="middle">
            OUR LITTLE RACER IS A
          </textPath>
        </text>
      </svg>

      <!-- Checkered flags placeholder -->
      <PlaceholderAsset label="Checkered Flags" width="80px" height="60px" variant="dark" />
    </div>

    <!-- FAST ONE -->
    <h1 class="font-racing text-[clamp(4rem,15vw,9rem)] leading-none tracking-tight text-race-black italic">
      FAST ONE
    </h1>

    <!-- Hero car placeholder -->
    <div class="relative w-full max-w-2xl flex items-end justify-center my-4">
      <PlaceholderAsset label="Watercolor Trophy" width="100px" height="120px" variant="light" class="absolute left-4 bottom-0" />
      <PlaceholderAsset label="Watercolor F1 Car" width="320px" height="160px" />
      <PlaceholderAsset label="Watercolor Tires" width="100px" height="120px" variant="dark" class="absolute right-0 bottom-0" />
    </div>

    <!-- Checkered divider -->
    <CheckeredDivider height="18px" class="w-full max-w-2xl my-2" />

    <!-- Subtitle -->
    <p class="font-sans text-sm uppercase tracking-[0.25em] text-race-gray mt-4 mb-2">
      Join us as we celebrate the Christening and 1st Birthday of our little racer
    </p>

    <!-- Name with speed lines -->
    <div class="relative flex items-center gap-4 my-2">
      <PlaceholderAsset label="Flag" width="60px" height="70px" variant="dark" />
      <div class="flex items-center gap-3">
        <!-- Speed lines -->
        <div class="flex flex-col gap-[5px]">
          <div class="w-10 h-[2px] bg-race-black" />
          <div class="w-7 h-[2px] bg-race-black" />
          <div class="w-5 h-[2px] bg-race-black" />
        </div>
        <h2 class="font-racing text-[clamp(3rem,12vw,7rem)] text-race-blue leading-none tracking-wide italic">
          UNO
        </h2>
      </div>
      <PlaceholderAsset label="Flag" width="60px" height="70px" variant="dark" />
    </div>

    <p class="font-sans text-xs uppercase tracking-[0.3em] text-race-gray mb-6">
      First Lap Around the Track
    </p>

    <!-- Info chips -->
    <div class="flex gap-3 flex-wrap justify-center mb-8">
      <span class="bg-race-blue-light/40 text-race-blue font-sans text-xs uppercase tracking-widest px-5 py-2 rounded-sm">
        Church
      </span>
      <span class="bg-race-blue-light/40 text-race-blue font-sans text-xs uppercase tracking-widest px-5 py-2 rounded-sm">
        September 6, 2026
      </span>
      <span class="bg-race-blue-light/40 text-race-blue font-sans text-xs uppercase tracking-widest px-5 py-2 rounded-sm">
        Venue
      </span>
    </div>

    <!-- Countdown -->
    <CountdownTimer />

    <!-- Scroll cue -->
    <div class="mt-10 flex flex-col items-center gap-1 animate-bounce">
      <span class="font-sans text-[10px] uppercase tracking-widest text-race-gray/60">Scroll</span>
      <svg class="w-4 h-4 text-race-gray/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </section>
</template>
