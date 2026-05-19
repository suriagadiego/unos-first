<script setup lang="ts">
defineProps<{
  label: string
  width?: string
  height?: string
  variant?: 'blue' | 'light' | 'dark'
}>()
</script>

<template>
  <div
    :style="{ width: width ?? '200px', height: height ?? '200px' }"
    class="flex items-center justify-center rounded-lg border-2 border-dashed text-sm font-sans text-center px-2"
    :class="{
      'border-race-blue bg-race-blue/10 text-race-blue': variant !== 'light' && variant !== 'dark',
      'border-race-blue-light bg-race-blue-light/20 text-race-blue': variant === 'light',
      'border-race-gray bg-race-gray/10 text-race-gray': variant === 'dark',
    }"
  >
    {{ label }}
  </div>
</template>
