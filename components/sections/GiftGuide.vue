<script setup lang="ts">
const gifts = [
  { icon: '🧷', label: 'Millie Moon Diaper', note: 'XL size' },
  { icon: '👕', label: '12–18 Month Clothes', note: 'Any style' },
  { icon: '📚', label: 'Educational Toys/Books', note: 'Age appropriate' },
  { icon: '🐷', label: 'Monetary Gift', note: 'Always appreciated' },
]
</script>

<template>
  <section id="gifts" class="py-20 px-4 relative overflow-hidden">
    <img src="~/assets/images/clouds/2.png" alt="" aria-hidden="true"
      class="cloud-float-slow pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 w-96 opacity-30 select-none" />
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="font-racing text-5xl text-race-black mb-4 tracking-wide">Gift Guide</h2>
      <p class="font-sans text-sm text-race-gray mb-2 max-w-md mx-auto">
        If you're considering giving a gift, we would love things that Uno actually needs.
        This helps make the most of your generosity while keeping things practical and meaningful.
      </p>
      <p class="font-sans text-xs text-race-gray/60 mb-12">
        Of course, your love and presence are the greatest gifts of all — please don't feel any pressure!
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div
          v-for="gift in gifts"
          :key="gift.label"
          class="flex flex-col items-center gap-3"
        >
          <div class="w-16 h-16 rounded-full bg-race-blue-light/25 flex items-center justify-center text-2xl">
            {{ gift.icon }}
          </div>
          <div>
            <p class="font-sans text-sm text-race-black font-medium leading-tight">{{ gift.label }}</p>
            <p class="font-sans text-xs text-race-gray/70 mt-0.5">{{ gift.note }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <CheckeredDivider height="20px" class="mt-20 mb-6" />
    <p class="font-racing text-center text-race-blue text-lg tracking-wide">See you at the finish line.</p>
    <p class="font-sans text-center text-xs uppercase tracking-widest text-race-gray mt-1">September 6, 2026</p>
  </section>
</template>
