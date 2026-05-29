<script setup lang="ts">
const locations = [
  {
    label: 'Church',
    name: 'Santo Domingo Church',
    sublabel: 'St. Thomas Hall',
    time: '10:30 AM',
    mapSrc: 'https://www.google.com/maps?q=Santo+Domingo+Church+Quezon+City+Philippines&output=embed',
    directionsUrl: 'https://share.google/JoMzsDIvVSq1t2EtQ',
  },
  {
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
  <section id="map" class="py-20 px-4 bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <h2 class="font-racing text-5xl text-center text-race-black mb-12 tracking-wide">Find Us</h2>

      <div class="grid md:grid-cols-2 gap-8">
        <div v-for="loc in locations" :key="loc.label" class="bg-white rounded-xl overflow-hidden shadow-sm border border-race-blue-light/30">
          <iframe
            :src="loc.mapSrc"
            class="w-full h-48 border-0"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          />

          <div class="p-5">
            <div class="flex items-center gap-2 mb-1">
              <span class="bg-race-blue-light/40 text-race-blue font-sans text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                {{ loc.label }}
              </span>
              <span class="font-sans text-xs text-race-gray">{{ loc.time }}</span>
            </div>
            <p class="font-racing text-xl text-race-black mt-1">{{ loc.name }}</p>
            <p v-if="loc.sublabel" class="font-sans text-xs text-race-gray">{{ loc.sublabel }}</p>
            <a
              :href="loc.directionsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block mt-3 font-sans text-[10px] uppercase tracking-widest text-race-blue border border-race-blue/30 px-3 py-1.5 hover:bg-race-blue hover:text-white transition-colors"
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
