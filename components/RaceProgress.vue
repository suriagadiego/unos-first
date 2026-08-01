<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  percent:   { type: Number, required: true },
  carSrc:    { type: String, required: true },
  finishSrc: { type: String, default: '' },
  animate:   { type: Boolean, default: true },
  readoutValue: { type: String, default: '' },
  readoutTarget: { type: String, default: '' },
  readoutCaption: { type: String, default: 'funded' },
  ariaLabel: { type: String, default: '' },
})

const clamp = (n) => Math.max(0, Math.min(100, n))
const progress = ref(0)
const displayPercent = computed(() => Math.round(progress.value))
const resolvedReadoutValue = computed(() => props.readoutValue || `${displayPercent.value}%`)
const resolvedAriaLabel = computed(() => props.ariaLabel || `Uno's college fund — ${displayPercent.value}% funded`)

let raf
function animateTo (target) {
  cancelAnimationFrame(raf)
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!props.animate || reduce) { progress.value = target; return }
  const from = progress.value
  const start = performance.now()
  const dur = 1400
  const ease = (t) => 1 - Math.pow(1 - t, 3)
  const tick = (now) => {
    const t = Math.min((now - start) / dur, 1)
    progress.value = from + (target - from) * ease(t)
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => animateTo(clamp(props.percent)))
watch(() => props.percent, (v) => animateTo(clamp(v)))
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="race-progress">
    <div
      class="race-progress__track"
      role="progressbar"
      :aria-valuenow="displayPercent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="resolvedAriaLabel"
    >
      <div class="race-progress__readout" :style="{ left: progress + '%' }" aria-hidden="true">
        <span class="race-progress__pct">{{ displayPercent }}%</span><span class="race-progress__cap">funded</span>
      </div>
      <div class="race-progress__fill" :style="{ width: progress + '%' }"></div>
      <div class="race-progress__finish">
        <img v-if="finishSrc" :src="finishSrc" alt="" />
        <span v-else class="race-progress__finish-fallback" aria-hidden="true"></span>
      </div>
      <div class="race-progress__car" :style="{ left: progress + '%' }" aria-hidden="true">
        <img :src="carSrc" alt="" />
      </div>
    </div>
    <div class="race-progress__labels" aria-hidden="true">
      <span>START</span>
      <span>GOAL</span>
    </div>
  </div>
</template>

<style scoped>
.race-progress {
  --rp-track:  #E7DAC0;
  --rp-fill:   #9DB6D2;
  --rp-dash:   #FBF6EC;
  --rp-accent: #4F6E92;
  --rp-muted:  #7A756A;
  --rp-label:  #8A8576;
  --rp-car-w:  64px;
  position: relative;
  padding: 72px calc(var(--rp-car-w) / 2) 0;
}
.race-progress__track {
  position: relative;
  height: 16px;
  border-radius: 999px;
  background: var(--rp-track);
  overflow: visible;
}
.race-progress__track::before {
  content: "";
  position: absolute;
  left: 10px;
  right: 26px;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: repeating-linear-gradient(to right,
    var(--rp-dash) 0 14px, transparent 14px 26px);
  z-index: 2;
  pointer-events: none;
}
.race-progress__fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0;
  border-radius: 999px 4px 4px 999px;
  background: var(--rp-fill);
  z-index: 1;
}
.race-progress__readout {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  white-space: nowrap;
  text-align: center;
  z-index: 5;
  pointer-events: none;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.race-progress__pct { font-size: 1.3rem; font-weight: 700; color: var(--rp-accent); }
.race-progress__cap { font-size: 0.8rem; color: var(--rp-muted); }
.race-progress__target { font-size: 0.8rem; color: var(--rp-muted); }
.race-progress__finish {
  position: absolute;
  right: -4px;
  bottom: 50%;
  transform: translateY(50%);
  width: 30px;
  z-index: 3;
  pointer-events: none;
}
.race-progress__finish img { display: block; width: 100%; height: auto; }
.race-progress__finish-fallback {
  display: block;
  width: 18px;
  height: 24px;
  margin: 0 auto;
  background-image: conic-gradient(#3B3A36 25%, #F4EDDE 0 50%, #3B3A36 0 75%, #F4EDDE 0);
  background-size: 8px 8px;
  border-radius: 2px;
}
.race-progress__car {
  position: absolute;
  left: 0;
  bottom: 1px;
  width: var(--rp-car-w);
  transform: translateX(-50%);
  z-index: 4;
  pointer-events: none;
}
.race-progress__car img { display: block; width: 100%; height: auto; }
.race-progress__car::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -1px;
  width: 70%;
  height: 7px;
  transform: translateX(-50%);
  background: rgba(70, 70, 80, 0.18);
  border-radius: 50%;
  filter: blur(3px);
  z-index: -1;
}
.race-progress__labels {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  color: var(--rp-label);
}
</style>
