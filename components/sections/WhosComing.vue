<script setup lang="ts">
const fallbackGuests = [
  'The Santos Family', 'The Reyes Crew', 'Aunt Maria', 'Uncle Jose',
  'Team Gonzalez', 'The Dela Cruz Fam', 'Lola Caring', 'Lolo Ben',
  'The Aquino Squad', 'Kuya Nico', 'Ate Bea', 'Baby Mika',
]

const { data: apiGuests } = await useFetch<any[]>('/api/public/rsvps')

const guests = computed(() => {
  const raw = apiGuests.value
  if (!raw || raw.length === 0) return fallbackGuests
  return raw.map(r => r.displayName)
})
</script>

<template>
  <section id="whoscoming" class="py-20 px-4 relative overflow-hidden">
    <img src="~/assets/images/clouds/3.png" alt="" aria-hidden="true"
      class="cloud-float pointer-events-none absolute -top-4 -right-12 w-72 opacity-20 select-none" />
    <div class="max-w-3xl mx-auto text-center">
      <h2 class="font-racing text-5xl text-race-black mb-3 tracking-wide">On the Grid</h2>
      <p class="font-sans text-xs uppercase tracking-widest text-race-gray mb-10">Confirmed Racers</p>

      <div class="flex flex-wrap gap-3 justify-center">
        <div
          v-for="(guest, i) in guests"
          :key="guest"
          class="flex items-center gap-2 bg-race-blue-light/20 border border-race-blue-light rounded-full px-4 py-2"
        >
          <span class="font-racing text-sm text-race-blue">#{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="font-sans text-sm text-race-gray">{{ guest }}</span>
        </div>
      </div>

      <p class="font-sans text-xs text-race-gray/60 mt-8">
        Will you be joining the race? <a href="#rsvp" class="text-race-blue underline underline-offset-2">RSVP below.</a>
      </p>
    </div>
  </section>
</template>
