<script setup lang="ts">
const cells = Array.from({ length: 25 }, (_, index) => index)
</script>

<template>
  <div
    class="fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#0d0d0d]"
    role="status"
    aria-live="polite"
    aria-label="Loading invitation"
  >
    <div class="loader-glow" aria-hidden="true" />

    <div class="relative flex flex-col items-center" aria-hidden="true">
      <div class="grid-loader">
        <span
          v-for="cell in cells"
          :key="cell"
          class="grid-loader__cell"
          :class="(Math.floor(cell / 5) + cell % 5) % 2 === 0 ? 'grid-loader__cell--cream' : 'grid-loader__cell--blue'"
          :style="{ '--cell-delay': `${cell * 42}ms` }"
        />
      </div>

      <div class="loader-smoke">
        <span v-for="smoke in 5" :key="smoke" />
      </div>

      <div class="loader-title" aria-hidden="true">
        <div class="loader-title__line"><span style="--title-delay: 120ms">UNO</span></div>
        <div class="loader-title__line"><span style="--title-delay: 330ms">TURNS</span></div>
        <div class="loader-title__line"><span class="text-race-blue" style="--title-delay: 540ms">ONE</span></div>
      </div>
      <span class="sr-only">Loading invitation</span>
    </div>
  </div>
</template>

<style scoped>
.loader-glow {
  position: absolute;
  width: 18rem;
  height: 18rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(107, 140, 174, 0.12) 0%, rgba(107, 140, 174, 0) 68%);
  animation: loader-breathe 2.4s ease-in-out infinite;
}

.grid-loader {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, 0.875rem);
  gap: 0.3rem;
  transform: rotate(-6deg) skewX(-6deg);
}

.grid-loader__cell {
  width: 0.875rem;
  aspect-ratio: 1;
  opacity: 0;
  transform: scale(0.35);
  animation: grid-form 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  animation-delay: var(--cell-delay);
}

.grid-loader__cell--cream {
  background: #f5f0eb;
  box-shadow: 0 0 0.8rem rgba(245, 240, 235, 0.18);
}

.grid-loader__cell--blue {
  background: #6b8cae;
  box-shadow: 0 0 0.9rem rgba(107, 140, 174, 0.35);
}

.loader-title {
  position: relative;
  z-index: 2;
  margin-top: 1.65rem;
  text-align: center;
  font-family: 'Formula1', sans-serif;
  font-size: clamp(2.8rem, 16vw, 5.5rem);
  font-weight: 700;
  line-height: 0.78;
  letter-spacing: -0.045em;
  color: #f5f0eb;
}

.loader-smoke {
  position: absolute;
  z-index: 1;
  bottom: -0.75rem;
  left: 50%;
  width: min(19rem, 88vw);
  height: 8rem;
  transform: translateX(-50%);
  pointer-events: none;
}

.loader-smoke span {
  --smoke-x: 0rem;
  --smoke-drift: 0rem;
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 4.5rem;
  height: 2.5rem;
  border-radius: 50%;
  opacity: 0;
  background: radial-gradient(ellipse, rgba(184, 199, 213, 0.34) 0%, rgba(107, 140, 174, 0.15) 45%, transparent 72%);
  filter: blur(8px);
  animation: smoke-rise 2.1s ease-out infinite;
}

.loader-smoke span:nth-child(1) { --smoke-x: -5.5rem; --smoke-drift: -1.5rem; animation-delay: 0ms; }
.loader-smoke span:nth-child(2) { --smoke-x: -2.8rem; --smoke-drift: 1rem; animation-delay: 240ms; }
.loader-smoke span:nth-child(3) { --smoke-x: -0.5rem; --smoke-drift: -0.5rem; animation-delay: 90ms; }
.loader-smoke span:nth-child(4) { --smoke-x: 2.2rem; --smoke-drift: 1.6rem; animation-delay: 360ms; }
.loader-smoke span:nth-child(5) { --smoke-x: 4.5rem; --smoke-drift: -0.8rem; animation-delay: 170ms; }

.loader-title__line {
  overflow: hidden;
  padding: 0.08em 0.08em 0.13em;
}

.loader-title__line span {
  display: block;
  opacity: 0;
  transform: translateY(115%);
  animation: title-reveal 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  animation-delay: var(--title-delay);
}

@keyframes grid-form {
  0%, 8% {
    opacity: 0;
    transform: scale(0.35);
  }
  22%, 68% {
    opacity: 1;
    transform: scale(1);
  }
  88%, 100% {
    opacity: 0;
    transform: scale(0.7);
  }
}

@keyframes loader-breathe {
  0%, 100% { transform: scale(0.88); opacity: 0.55; }
  50% { transform: scale(1.08); opacity: 1; }
}

@keyframes title-reveal {
  0%, 7% {
    opacity: 0;
    transform: translateY(115%);
  }
  24%, 72% {
    opacity: 1;
    transform: translateY(0);
  }
  88%, 100% {
    opacity: 0;
    transform: translateY(-35%);
  }
}

@keyframes smoke-rise {
  0% {
    opacity: 0;
    transform: translate3d(var(--smoke-x), 0.8rem, 0) scale(0.35);
  }
  18% {
    opacity: 0.32;
  }
  65% {
    opacity: 0.16;
  }
  100% {
    opacity: 0;
    transform: translate3d(calc(var(--smoke-x) + var(--smoke-drift)), -5rem, 0) scale(1.75);
  }
}

@media (min-width: 768px) {
  .grid-loader {
    grid-template-columns: repeat(5, 1rem);
    gap: 0.36rem;
  }

  .grid-loader__cell {
    width: 1rem;
  }

  .loader-title {
    margin-top: 2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader-glow {
    animation: none;
  }

  .grid-loader__cell {
    opacity: 0.75;
    transform: scale(1);
    animation: none;
  }


  .loader-title__line span {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .loader-smoke {
    display: none;
  }
}
</style>
