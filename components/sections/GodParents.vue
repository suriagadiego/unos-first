<script setup lang="ts">
const ninongs = ['Lucas', 'Luke', 'Matt', 'Max', 'Michael', 'Nathan']
const ninangs = ['Felicity', 'Fiona', 'Gabrielle', 'Grace', 'Hannah', 'Heather']
</script>

<template>
  <section id="godparents" class="py-20 px-4 bg-gray-50">
    <!-- Bunting divider -->
    <div class="flex justify-center gap-0 mb-10 overflow-hidden">
      <span
        v-for="i in 20"
        :key="i"
        class="inline-block w-6 h-8 border-b-[3px] border-x border-race-black"
        :class="i % 2 === 0 ? 'checkered-bg' : 'bg-white'"
      />
    </div>

    <div class="max-w-3xl mx-auto">
      <h2 class="font-racing text-5xl text-center text-race-black mb-12 tracking-wide">God Parents</h2>

      <div class="flex gap-8 justify-center items-start">
        <!-- Cone placeholder -->
        <PlaceholderAsset label="Watercolor Cone" width="80px" height="160px" variant="light" class="hidden md:block mt-4 flex-shrink-0" />

        <!-- Ninongs -->
        <div class="flex-1 text-center">
          <h3 class="font-racing text-2xl text-race-blue mb-4 tracking-wide">Ninongs</h3>
          <ul class="space-y-1">
            <li
              v-for="name in ninongs"
              :key="name"
              class="font-sans text-sm uppercase tracking-[0.2em] text-race-gray"
            >
              {{ name }}
            </li>
          </ul>
        </div>

        <!-- Divider -->
        <div class="w-px bg-race-blue-light self-stretch" />

        <!-- Ninangs -->
        <div class="flex-1 text-center">
          <h3 class="font-racing text-2xl text-race-blue mb-4 tracking-wide">Ninangs</h3>
          <ul class="space-y-1">
            <li
              v-for="name in ninangs"
              :key="name"
              class="font-sans text-sm uppercase tracking-[0.2em] text-race-gray"
            >
              {{ name }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
