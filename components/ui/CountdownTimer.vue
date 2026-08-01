<script setup lang="ts">
import { PARTY_DATE } from '~/utils/event'

const { days, hours, minutes, seconds, expired } = useCountdown(PARTY_DATE)

const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <div class="flex gap-4 justify-center items-end">
    <template v-if="!expired">
      <div v-for="(val, label) in { DAYS: days, HRS: hours, MIN: minutes, SEC: seconds }" :key="label" class="flex flex-col items-center">
        <span class="font-racing text-[2.4rem] md:text-5xl text-race-black leading-none">{{ pad(val) }}</span>
        <span class="font-sans text-[10px] uppercase tracking-[0.2em] text-race-gray mt-1">{{ label }}</span>
      </div>
    </template>
    <p v-else class="font-racing text-3xl text-race-blue">Race Day is Here!</p>
  </div>
</template>
