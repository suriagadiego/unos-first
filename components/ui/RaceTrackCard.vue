<script setup lang="ts">
defineProps<{
  time: string
  address: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="relative flex flex-col items-center justify-center px-8 py-6 min-w-[260px] max-w-sm">
    <!-- Oval track border -->
    <div class="absolute inset-0 rounded-[50%] border-[6px] border-race-gray border-dashed" />
    <div class="relative z-10 flex flex-col items-center gap-1 text-center">
      <span v-if="icon" class="text-3xl mb-1">{{ icon }}</span>
      <p class="font-racing text-4xl text-race-black tracking-wide">{{ time }}</p>
      <p class="font-sans text-xs uppercase tracking-widest text-race-gray mt-1">{{ address }}</p>
      <p v-if="description" class="font-sans text-xs text-race-gray/80 mt-2 max-w-[200px]">{{ description }}</p>
    </div>
  </div>
</template>
