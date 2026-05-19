<script setup lang="ts">
const locations = [
  {
    label: 'Church',
    name: "St. Mary's Church",
    address: '123 Church St, Any City, ST 12345',
    time: '10:30 AM',
    mapSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.802!2d121.0244!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDMzJzE3LjAiTiAxMjHCsDAxJzI3LjgiRQ!5e0!3m2!1sen!2sph!4v1234567890',
  },
  {
    label: 'Reception',
    name: 'The Grand Ballroom',
    address: '456 Venue Ave, Any City, ST 12345',
    time: '11:30 AM',
    mapSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.802!2d121.0244!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDMzJzE3LjAiTiAxMjHCsDAxJzI3LjgiRQ!5e0!3m2!1sen!2sph!4v1234567890',
  },
]
</script>

<template>
  <section id="map" class="py-20 px-4 bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <h2 class="font-racing text-5xl text-center text-race-black mb-12 tracking-wide">Find Us</h2>

      <div class="grid md:grid-cols-2 gap-8">
        <div v-for="loc in locations" :key="loc.label" class="bg-white rounded-xl overflow-hidden shadow-sm border border-race-blue-light/30">
          <!-- Map iframe placeholder -->
          <div class="bg-race-blue-light/20 h-48 flex items-center justify-center border-b border-race-blue-light/30">
            <div class="text-center">
              <div class="text-4xl mb-2">📍</div>
              <p class="font-sans text-xs uppercase tracking-widest text-race-blue">Map Placeholder</p>
              <p class="font-sans text-[10px] text-race-gray/60 mt-1">Real address will show map</p>
            </div>
          </div>

          <div class="p-5">
            <div class="flex items-center gap-2 mb-1">
              <span class="bg-race-blue-light/40 text-race-blue font-sans text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                {{ loc.label }}
              </span>
              <span class="font-sans text-xs text-race-gray">{{ loc.time }}</span>
            </div>
            <p class="font-racing text-xl text-race-black mt-1">{{ loc.name }}</p>
            <p class="font-sans text-xs text-race-gray mt-1">{{ loc.address }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
