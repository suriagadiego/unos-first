<script setup lang="ts">
defineProps<{ height?: string }>()
</script>

<template>
  <div
    class="w-full checkered-bg opacity-90"
    :style="{ height: height ?? '20px' }"
  />
</template>
