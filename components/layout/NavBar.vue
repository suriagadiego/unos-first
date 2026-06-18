<script setup lang="ts">
const scrolled = ref(false)

const links = [
  { label: 'Event', href: '/#event-v2' },
  { label: "Who's Coming", href: '/#whoscoming' },
  { label: 'RSVP', href: '/#rsvp' },
  { label: 'Gifts', href: '/#gifts' },
  { label: "Uno's Fund", href: '/fund' },
]

onMounted(() => {
  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 40
  })
})
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-white/60 backdrop-blur-sm'"
  >
    <div class="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
      <a href="#hero" class="font-racing text-xl text-race-black tracking-wide">UNO</a>
      <ul class="hidden md:flex gap-6 items-center">
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            class="font-sans text-xs uppercase tracking-widest text-race-gray hover:text-race-black transition-colors"
          >
            {{ link.label }}
          </a>
        </li>
      </ul>
      <!-- Mobile: just show RSVP CTA -->
      <a
        href="#rsvp"
        class="md:hidden font-sans text-xs uppercase tracking-widest bg-race-black text-white px-4 py-2 rounded-full"
      >
        RSVP
      </a>
    </div>
  </nav>
</template>
