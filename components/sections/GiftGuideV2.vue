<template>
  <section id="gifts" class="relative overflow-hidden pb-0">

    <!-- Watercolor blotches -->
    <img src="~/assets/images/upperright-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute -top-10 -right-10 w-[70vw] opacity-20 select-none" />

    <!-- Speed line texture -->
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
    <div class="pt-20 pb-14 px-6 relative z-10">
      <div class="max-w-4xl mx-auto">

        <!-- Eyebrow + title -->
        <div class="text-center mb-12">
          <div class="flex items-center justify-center gap-3 mb-6">
            <div class="h-px w-10 bg-race-gray/30" />
            <span class="font-racing text-[11px] text-race-blue tracking-[0.45em] uppercase">Pit Stop Wishlist</span>
            <div class="h-px w-10 bg-race-gray/30" />
          </div>
          <div class="flex items-center justify-center">
            <img src="~/assets/images/flag.png" alt="" aria-hidden="true"
              class="w-20 h-auto select-none opacity-90 -mr-3" style="transform: scaleX(-1) rotate(-6deg);" />
            <h2 class="font-racing text-5xl md:text-6xl text-race-black tracking-wide">Gifts</h2>
            <img src="~/assets/images/flag.png" alt="" aria-hidden="true"
              class="w-20 h-auto select-none opacity-90 -ml-3" style="transform: rotate(-6deg);" />
          </div>
        </div>

        <!-- Two-column -->
        <div class="flex flex-col md:flex-row md:items-stretch gap-12 md:gap-16">

          <!-- Left: message -->
          <div class="flex-1 flex flex-col text-center md:text-left">
            <p class="font-sans font-bold text-3xl md:text-4xl text-race-black leading-tight mb-5">
              Your presence is the greatest gift you can bring.
            </p>
            <p class="font-sans font-medium text-sm text-race-gray leading-relaxed">
              But if your heart still wants to give, a contribution to Uno's
              college fund would mean the world to us.
            </p>
            <img src="~/assets/images/college.png" alt="" aria-hidden="true" class="mt-6 w-full max-w-sm mx-auto select-none" />
            <p class="font-sans text-xs text-race-gray/45 leading-relaxed mt-3 text-center">
              No pressure at all. Just being there is more than enough.
            </p>
          </div>

          <!-- Right: pit board card -->
          <div class="w-[85%] mx-auto md:mx-0 md:w-80 flex-shrink-0 overflow-hidden" style="border: 1px solid rgba(107,140,174,0.25); background: rgba(255,255,255,0.82);">

            <!-- Card header -->
            <div class="bg-race-black px-4 py-3 flex items-center gap-2">
              <span class="font-racing text-white text-base leading-none">01</span>
              <div class="flex-1 h-px bg-white/10 mx-1" />
              <span class="font-racing text-white text-[9px] tracking-[0.15em] leading-none">COLLEGE FUND</span>
            </div>

            <!-- Card body -->
            <div class="py-7 px-6 flex flex-col items-center gap-4">

              <img src="~/assets/images/togahat.svg" alt="Diploma" class="w-full max-w-[200px]" />

              <p class="font-racing text-xl text-race-black">Uno's College Fund</p>

              <p class="font-sans text-xs text-race-gray leading-relaxed text-center">
                Any amount you contribute goes directly into a savings fund for
                Uno's education. It's the gift that keeps giving, long after the party.
              </p>

              <NuxtLink
                to="/fund"
                class="mt-1 w-full bg-race-black font-racing text-white text-xs uppercase tracking-[0.2em] py-3 text-center hover:bg-race-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-race-blue transition-colors duration-200 block"
              >
                Contribute →
              </NuxtLink>

            </div>
          </div>

        </div>
      </div>
    </div>


  </section>
</template>
