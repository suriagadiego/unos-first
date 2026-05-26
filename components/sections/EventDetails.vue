<script setup lang="ts">
const events = [
  {
    lap: '01',
    badge: 'STARTING GRID',
    time: '10:30 AM',
    venue: 'SANTO DOMINGO CHURCH',
    address: '537 Quezon Ave, Quezon City (St. Thomas Hall)',
    note: 'Sponsors are expected to arrive by 10:00 AM. Mass begins at 10:30 AM.',
  },
  {
    lap: '02',
    badge: 'THE PODIUM',
    time: '11:30 AM',
    venue: 'STEELWORLD TOWER',
    address: 'NS Amoranto, corner Biak na Bato, Quezon City',
    note: 'Reception to follow immediately after the ceremony.',
  },
]

const dressCodes = [
  { label: 'Racer Blue', color: '#6B8CAE' },
  { label: 'Track Black', color: '#0D0D0D' },
  { label: 'Crisp White', color: '#F5F5F5', border: true },
]
</script>

<template>
  <section id="event" class="py-20 px-8 md:px-16">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row gap-16 md:gap-24">

        <!-- LEFT: Schedule -->
        <div class="flex-1">

          <div v-for="(ev, i) in events" :key="ev.lap">

            <!-- Diamond + badge + chevron in one row -->
            <div class="flex items-center mb-5">
<div class="bg-race-black pl-7 pr-5 py-3 flex items-center gap-4 flex-shrink-0">
                <span class="font-racing text-white text-xl leading-none">{{ ev.lap }}</span>
                <span class="font-racing text-white text-sm tracking-[0.28em] leading-none whitespace-nowrap">{{ ev.badge }}</span>
              </div>
              <div class="w-0 h-0 border-t-[22px] border-b-[22px] border-l-[16px] border-t-transparent border-b-transparent border-l-race-black flex-shrink-0"></div>
            </div>

            <!-- Sector label -->
            <p class="font-sans text-[9px] uppercase tracking-[0.5em] text-race-gray/40 mb-1">Sector {{ ev.lap }}</p>

            <!-- Time with speed lines -->
            <div class="flex items-center gap-4 mb-3">
              <div class="flex flex-col items-end gap-[4px]">
                <div class="w-10 h-px bg-race-black/20"></div>
                <div class="w-6 h-px bg-race-black/13"></div>
                <div class="w-3 h-px bg-race-black/10"></div>
              </div>
              <p class="font-racing text-4xl md:text-5xl text-race-black tracking-wide leading-none whitespace-nowrap">{{ ev.time }}</p>
            </div>

            <p class="font-sans text-base font-bold uppercase tracking-widest text-race-blue mb-1">{{ ev.venue }}</p>
            <p class="font-sans text-base font-medium text-race-gray mb-2">{{ ev.address }}</p>
            <p class="font-sans text-base font-medium text-race-gray/85">{{ ev.note }}</p>

            <div v-if="i < events.length - 1" class="my-10"></div>

          </div>
        </div>

        <!-- RIGHT: Dress Code with livery stripe bg -->
        <div
          class="flex-1 flex flex-col items-center relative overflow-hidden"
          style="background: repeating-linear-gradient(-55deg, transparent, transparent 28px, rgba(107,140,174,0.04) 28px, rgba(107,140,174,0.04) 29px);"
        >

          <!-- TEAM LIVERY tag -->
          <div class="flex items-center w-full mb-8">
            <div class="flex-1 h-px bg-race-gray/30"></div>
            <svg class="w-4 h-4 mx-2 flex-shrink-0" viewBox="0 0 8 8">
              <rect width="4" height="4" fill="#4A4A4A" fill-opacity="0.35"/>
              <rect x="4" y="4" width="4" height="4" fill="#4A4A4A" fill-opacity="0.35"/>
            </svg>
            <div class="border border-race-gray/40 px-6 py-2 flex-shrink-0">
              <span class="font-racing text-sm tracking-[0.3em] uppercase text-race-gray">Team Livery</span>
            </div>
            <svg class="w-4 h-4 mx-2 flex-shrink-0" viewBox="0 0 8 8">
              <rect width="4" height="4" fill="#4A4A4A" fill-opacity="0.35"/>
              <rect x="4" y="4" width="4" height="4" fill="#4A4A4A" fill-opacity="0.35"/>
            </svg>
            <div class="flex-1 h-px bg-race-gray/30"></div>
          </div>

          <!-- Race Day Colors banner -->
          <div class="bg-race-black text-white px-8 py-3 mb-6 w-full text-center">
            <span class="font-racing text-lg tracking-[0.25em] uppercase">Race Day Colors Ahead!</span>
          </div>

          <!-- Description -->
          <p class="font-sans text-base font-medium text-race-gray text-center mb-10 max-w-[280px] leading-relaxed">
            Wear racer blue, track black, or crisp white — perfect for a fun and energetic celebration at full speed!
          </p>

          <!-- Color swatches -->
          <div class="flex gap-10 justify-center">
            <div v-for="dc in dressCodes" :key="dc.label" class="flex flex-col items-center gap-3">
              <div class="relative w-20 h-20">
                <svg class="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40" cy="40" r="36"
                    :stroke="dc.border ? '#D1D5DB' : dc.color"
                    stroke-width="1.5"
                    stroke-dasharray="5 3"
                  />
                </svg>
                <div
                  class="absolute inset-[14px] rounded-full"
                  :style="{ backgroundColor: dc.color, boxShadow: dc.border ? 'inset 0 0 0 1px #E5E7EB' : 'none' }"
                />
              </div>
              <span class="font-racing text-[10px] uppercase tracking-widest text-race-gray">{{ dc.label }}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
</template>
