<script setup lang="ts">
const events = [
  {
    time: '10:30 AM',
    icon: '⛪',
    address: 'St. Mary\'s Church\n123 Church St, Any City',
    description: 'Sponsors are expected to arrive by 10:00 AM. Mass begins at 10:30 AM.',
  },
  {
    time: '11:30 AM',
    icon: '🍽️',
    address: 'The Grand Ballroom\n456 Venue Ave, Any City',
    description: 'Reception to follow immediately after the ceremony.',
  },
]

const dressCodes = [
  { label: 'Racer Blue', color: '#6B8CAE' },
  { label: 'Track Black', color: '#0D0D0D' },
  { label: 'Crisp White', color: '#F5F5F5', border: true },
]
</script>

<template>
  <section id="event" class="py-20 px-4 bg-white">
    <div class="max-w-4xl mx-auto">
      <h2 class="font-racing text-5xl text-center text-race-black mb-12 tracking-wide">Event Details</h2>

      <!-- Race track cards -->
      <div class="flex flex-col md:flex-row gap-12 justify-center items-center mb-16">
        <RaceTrackCard
          v-for="ev in events"
          :key="ev.time"
          :time="ev.time"
          :icon="ev.icon"
          :address="ev.address"
          :description="ev.description"
        />
      </div>

      <CheckeredDivider height="16px" class="mb-12" />

      <!-- Dress Code -->
      <div class="text-center">
        <h3 class="font-racing text-3xl text-race-black mb-2 tracking-wide">Dress Code</h3>
        <p class="font-sans text-sm text-race-gray mb-6">
          Race Day colors ahead! Wear racer blue, track black, or crisp white —
          perfect for a fun and energetic celebration at full speed!
        </p>

        <div class="flex gap-6 justify-center items-center">
          <div v-for="dc in dressCodes" :key="dc.label" class="flex flex-col items-center gap-2">
            <div
              class="w-14 h-14 rounded-full shadow-md"
              :style="{
                backgroundColor: dc.color,
                border: dc.border ? '2px solid #D1D5DB' : 'none',
              }"
            />
            <span class="font-sans text-xs uppercase tracking-widest text-race-gray">{{ dc.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
