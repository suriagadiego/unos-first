<script setup lang="ts">
const locationMeta = [
  {
    mapSrc: 'https://www.google.com/maps?q=Santo+Domingo+Church+Quezon+City+Philippines&output=embed',
    directionsUrl: 'https://share.google/JoMzsDIvVSq1t2EtQ',
  },
  {
    mapSrc: 'https://www.google.com/maps?q=Steelworld+Tower+Philippines&output=embed',
    directionsUrl: 'https://share.google/8SVJqAhnnpPMGIAY6',
  },
]

const fallbackEvents = [
  {
    lap: '01',
    badge: 'CHURCH',
    time: '10:30 AM',
    venue: 'SANTO DOMINGO CHURCH',
    address: '537 Quezon Ave, Quezon City (St. Thomas Hall)',
    note: 'Sponsors are expected to arrive by 10:00 AM. Mass begins at 10:30 AM.',
  },
  {
    lap: '02',
    badge: 'RECEPTION',
    time: '11:30 AM',
    venue: 'STEELWORLD TOWER',
    address: 'NS Amoranto, corner Biak na Bato, Quezon City',
    note: 'Reception to follow immediately after the ceremony.',
  },
]

const { data: apiActivities } = await useFetch<any[]>('/api/public/activities')

const events = computed(() => {
  const raw = apiActivities.value
  if (!raw || raw.length === 0) return fallbackEvents
  return raw.map(a => ({
    lap: a.lapNumber ?? '',
    badge: a.label ?? '',
    time: a.time ?? '',
    venue: (a.venueName ?? '').toUpperCase(),
    address: a.address ?? '',
    note: a.note ?? '',
  }))
})

const dressCodes = [
  { label: 'Racer Blue', color: '#6B8CAE' },
  { label: 'Track Black', color: '#0D0D0D' },
  { label: 'Crisp White', color: '#F5F5F5', border: true },
]
</script>

<template>
  <section id="event-v2" class="pt-20 pb-[10rem] md:pb-4 px-8 md:px-16 relative">

    <!-- Decorative clipping wrapper -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Watercolor blotches -->
      <img src="~/assets/images/upperright-watercolor.png" alt="" aria-hidden="true"
        class="absolute -bottom-10 -right-10 w-[150vw] md:w-[90vw] opacity-40 select-none" style="transform: scaleY(-1);" />
      <img src="~/assets/images/upperright-watercolor.png" alt="" aria-hidden="true"
        class="absolute -top-10 -left-10 w-[150vw] md:w-[90vw] opacity-40 select-none" style="transform: scaleX(-1);" />
      <!-- Clouds -->
      <img src="~/assets/images/clouds/3.png" alt="" aria-hidden="true"
        class="cloud-float absolute -top-6 left-[20%] w-[260px] opacity-20 select-none" />
      <img src="~/assets/images/clouds/5.png" alt="" aria-hidden="true"
        class="cloud-float-slow absolute top-1/3 -right-16 w-[320px] opacity-15 select-none" />
      <img src="~/assets/images/clouds/2.png" alt="" aria-hidden="true"
        class="cloud-float absolute bottom-10 left-[10%] w-[220px] opacity-15 select-none" />
    </div>

    <img src="~/assets/images/tireflag.png" alt="" aria-hidden="true"
      class="pointer-events-none select-none absolute -bottom-3 left-[13%] hidden md:block w-[20.5rem] z-20" />

    <img src="~/assets/images/mickey.png" alt="" aria-hidden="true"
      class="pointer-events-none select-none absolute -bottom-3 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[12%] w-[16rem] md:w-[23rem] z-20" />

    <div class="max-w-6xl mx-auto relative z-10">

      <!-- Locations side by side -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-6">
        <div v-for="(ev, i) in events" :key="ev.lap">

          <!-- Badge -->
          <div class="flex items-center mb-5">
            <div class="bg-race-black pl-7 pr-5 py-3 flex items-center gap-4 flex-shrink-0">
              <span class="font-racing text-white text-xl leading-none">{{ ev.lap }}</span>
              <span class="font-racing text-white text-sm tracking-[0.28em] leading-none whitespace-nowrap">{{ ev.badge }}</span>
            </div>
            <div class="w-0 h-0 border-t-[22px] border-b-[22px] border-l-[16px] border-t-transparent border-b-transparent border-l-race-black flex-shrink-0"></div>
          </div>

          <!-- Sector label -->
          <p class="font-sans text-[9px] uppercase tracking-[0.5em] text-race-gray/40 mb-1">Sector {{ ev.lap }}</p>

          <!-- Time -->
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

          <a
            :href="locationMeta[i]?.directionsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block mt-4 font-racing text-sm uppercase tracking-[0.4em] text-race-blue border border-race-blue/40 px-4 py-2 hover:bg-race-blue hover:text-white transition-colors duration-200"
          >Get Directions →</a>

        </div>
      </div>

      <!-- Dress Code below -->
      <div
        class="flex flex-col items-center relative py-10"
        style="background: repeating-linear-gradient(-55deg, transparent, transparent 28px, rgba(107,140,174,0.04) 28px, rgba(107,140,174,0.04) 29px);"
      >
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

        <div class="bg-race-black text-white px-8 py-3 mb-6 text-center">
          <span class="font-racing text-lg tracking-[0.25em] uppercase">Race Day Colors Ahead!</span>
        </div>

        <p class="font-sans text-base font-medium text-race-gray text-center mb-10 max-w-[280px] leading-relaxed">
          Wear racer blue, track black, or crisp white — perfect for a fun and energetic celebration at full speed!
        </p>

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
  </section>
</template>
