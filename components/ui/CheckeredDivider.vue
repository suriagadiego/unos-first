<script setup lang="ts">
defineProps<{ height?: string }>()
</script>

<template>
  <div
    class="w-full checkered-bg opacity-[0.97]"
    :style="{ height: height ?? '40px' }"
  />
</template>
