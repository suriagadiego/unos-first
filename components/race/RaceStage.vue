<script setup lang="ts">
import type { RaceLayoutMode, RaceRenderer } from '~/utils/raceRenderer'
import type { QrMatrix } from '~/utils/raceQr'

const props = defineProps<{ target: string }>()

type Status = 'loading' | 'ready' | 'racing' | 'done' | 'rewinding' | 'fallback'

const status = ref<Status>('loading')
const errorMessage = ref('')
const reducedMotion = ref(false)
const layoutMode = ref<RaceLayoutMode>('portrait')
/** Kept so the no-canvas fallback can draw a real code without touching a canvas. */
const matrix = shallowRef<QrMatrix | null>(null)

const stageRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()
const cueRef = ref<HTMLElement>()

const audio = useRaceAudio()

let renderer: RaceRenderer | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null

const prettyTarget = computed(() => props.target.replace(/^https?:\/\//, '').replace(/\/$/, ''))

onMounted(async () => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', onMotionChange)

  try {
    matrix.value = await createQrMatrix(props.target)
    const world = buildRaceWorld(matrix.value)

    // The Formula1 face is used for the car livery drawn into the canvas.
    await Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(1500)])

    const canvas = canvasRef.value
    if (!canvas) throw new Error('Canvas missing')

    renderer = createRaceRenderer({
      canvas,
      world,
      reducedMotion: reducedMotion.value,
      onFrame: onFrame,
      onComplete: () => {
        status.value = 'done'
      },
      onRewound: () => {
        status.value = 'ready'
      },
    })

    layoutMode.value = renderer.layout()
    exposeDevHandles()
    renderer.start()
    status.value = 'ready'

    resizeObserver = new ResizeObserver(() => {
      if (renderer) layoutMode.value = renderer.layout()
      exposeDevHandles()
    })
    resizeObserver.observe(stageRef.value!)
    document.addEventListener('visibilitychange', onVisibility)
  } catch (error) {
    await useFallback(error)
  }
})

onBeforeUnmount(() => {
  renderer?.destroy()
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', onVisibility)
})

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function onMotionChange(event: MediaQueryListEvent) {
  reducedMotion.value = event.matches
  renderer?.setReducedMotion(event.matches)
}

/** Pause the loop when the tab is hidden; nothing is worth animating off-screen. */
function onVisibility() {
  if (!renderer || status.value === 'done') return
  if (document.hidden) renderer.stop()
  else renderer.start()
}

/** Dev-only handles for the scan-verification harness. */
function exposeDevHandles() {
  if (!renderer || !import.meta.dev) return
  const w = window as any
  w.__raceGeometry = renderer.qrGeometry
  w.__raceStats = () => renderer?.stats
}

/**
 * Moves the tap cue with the car by writing straight to the element. Doing this
 * through reactive state would re-render the overlay on every frame.
 */
function onFrame(info: { carX: number; carY: number; carVisible: boolean }) {
  const cue = cueRef.value
  if (!cue) return
  if (status.value !== 'ready' || !info.carVisible) {
    cue.style.opacity = '0'
    return
  }
  cue.style.opacity = '1'
  cue.style.transform = `translate3d(${Math.round(info.carX)}px, ${Math.round(info.carY)}px, 0) translate(-50%, calc(-100% - 46px))`
}

async function useFallback(error: unknown) {
  status.value = 'fallback'
  errorMessage.value = error instanceof Error ? error.message : 'Could not build the scene'
  // The matrix may already be in hand; if the failure happened earlier, try once more.
  if (!matrix.value) {
    try {
      matrix.value = await createQrMatrix(props.target)
    } catch {
      matrix.value = null
    }
  }
}

/**
 * The fallback code is drawn as SVG, not canvas. If we are here because canvas is
 * unavailable, anything canvas-backed — including the qrcode library's own image
 * renderer — would fail too.
 */
const fallbackQuiet = 4
const fallbackViewBox = computed(() =>
  matrix.value ? `0 0 ${matrix.value.size + fallbackQuiet * 2} ${matrix.value.size + fallbackQuiet * 2}` : '0 0 1 1',
)
const fallbackPath = computed(() => {
  const m = matrix.value
  if (!m) return ''
  let d = ''
  for (let row = 0; row < m.size; row++) {
    for (let col = 0; col < m.size; col++) {
      if (m.isDark(col, row)) d += `M${col + fallbackQuiet} ${row + fallbackQuiet}h1v1h-1z`
    }
  }
  return d
})

function launch() {
  if (status.value !== 'ready' || !renderer) return
  status.value = 'racing'
  renderer.launch()
  if (!reducedMotion.value) {
    audio.playStartSequence(FULL_TIMELINE.lightOn, FULL_TIMELINE.lightsOut, FULL_TIMELINE.carGone)
  }
}

function skip() {
  if (!renderer || status.value === 'done') return
  renderer.finish()
  status.value = 'done'
}

/** Runs the transformation backwards, back to the starting grid. */
function rewind() {
  if (!renderer || status.value !== 'done') return
  status.value = 'rewinding'
  renderer.rewind()
}

function onStageClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('button, a')) return
  if (status.value === 'ready') launch()
  else if (status.value === 'done') rewind()
}
</script>

<template>
  <div
    ref="stageRef"
    class="race-stage"
    :class="[`race-stage--${layoutMode}`, { 'race-stage--rewindable': status === 'done' }]"
    @click="onStageClick"
  >
    <canvas
      ref="canvasRef"
      class="race-canvas"
      role="img"
      :aria-label="`Miniature racetrack that transforms into a QR code linking to ${prettyTarget}`"
    />

    <!-- Title -->
    <header class="race-title">
      <p class="race-kicker">Lights out · Uno turns one</p>
      <h1>
        <span>Uno's First</span>
        <span class="race-title__accent">Fast Run</span>
      </h1>
    </header>

    <!-- Tap cue, pinned to the car -->
    <div ref="cueRef" class="race-cue" :class="{ 'race-cue--hidden': status !== 'ready' }">
      <button type="button" class="race-cue__button" @click.stop="launch">
        <span class="race-cue__dot" aria-hidden="true" />
        Tap the car
        <span class="sr-only">to start the race and reveal the QR code</span>
      </button>
    </div>

    <!-- Bottom copy -->
    <div class="race-footer">
      <Transition name="race-fade" mode="out-in">
        <div v-if="status === 'done'" key="done" class="race-footer__inner">
          <p class="race-scan">Scan to join the race</p>
          <a class="race-link" :href="target" rel="noopener">{{ prettyTarget }}</a>
          <button type="button" class="race-ghost race-replay" @click="rewind">
            Back to the grid
          </button>
        </div>

        <div v-else-if="status === 'rewinding'" key="rewinding" class="race-footer__inner">
          <p class="race-hint">Rewinding…</p>
        </div>

        <div v-else-if="status === 'fallback'" key="fallback" class="race-footer__inner">
          <p class="race-scan">Scan to join the race</p>
          <a class="race-link" :href="target" rel="noopener">{{ prettyTarget }}</a>
        </div>

        <div v-else-if="status === 'racing'" key="racing" class="race-footer__inner">
          <p class="race-hint">Hold on…</p>
        </div>

        <div v-else-if="status === 'ready'" key="ready" class="race-footer__inner">
          <p class="race-hint">
            {{ reducedMotion ? 'Tap the car to reveal the code' : 'Tap the car to start the race' }}
          </p>
          <button
            type="button"
            class="race-ghost race-ghost--quiet"
            :aria-pressed="audio.enabled.value"
            @click.stop="audio.toggle"
          >
            {{ audio.enabled.value ? 'Sound on' : 'Sound off' }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Escape hatch while the race is running -->
    <div class="race-tools">
      <button v-if="status === 'racing'" type="button" class="race-tool" @click.stop="skip">
        Skip
      </button>
    </div>

    <!-- Graceful fallback: a plain, scannable code, drawn without a canvas -->
    <div v-if="status === 'fallback'" class="race-fallback">
      <svg
        v-if="matrix"
        class="race-fallback__qr"
        :viewBox="fallbackViewBox"
        role="img"
        :aria-label="`QR code linking to ${prettyTarget}`"
        shape-rendering="crispEdges"
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        <path :d="fallbackPath" fill="#000000" />
      </svg>
      <p v-else class="race-hint">{{ errorMessage }}</p>
    </div>

    <div v-if="status === 'loading'" class="race-loading" role="status">
      <span class="race-spinner" aria-hidden="true" />
      <span class="sr-only">Building the racetrack</span>
    </div>
  </div>
</template>

<style scoped>
.race-stage--rewindable {
  cursor: pointer;
}

.race-stage {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #0d0d0d;
  touch-action: manipulation;
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.race-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* ---------------------------------------------------------------- title */

.race-title {
  position: absolute;
  top: max(1.15rem, env(safe-area-inset-top));
  left: 0;
  right: 0;
  text-align: center;
  pointer-events: none;
  padding: 0 1.25rem;
}

.race-kicker {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.5625rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgba(245, 240, 235, 0.42);
  margin-bottom: 0.4rem;
}

.race-title h1 {
  display: flex;
  flex-direction: column;
  font-family: 'Formula1', sans-serif;
  font-size: clamp(1.5rem, 7.4vw, 2.5rem);
  line-height: 0.92;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: #f5f0eb;
}

.race-title__accent {
  color: #6b8cae;
}

/* ---------------------------------------------------------------- tap cue */

.race-cue {
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 260ms ease;
  will-change: transform;
}

.race-cue--hidden {
  opacity: 0 !important;
  pointer-events: none;
}

.race-cue__button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
  padding: 0.4rem 0.85rem 0.4rem 0.7rem;
  border-radius: 9999px;
  border: 1px solid rgba(168, 197, 218, 0.3);
  background: rgba(13, 13, 13, 0.72);
  backdrop-filter: blur(6px);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f5f0eb;
  cursor: pointer;
  transition: transform 200ms ease, border-color 200ms ease;
}

.race-cue__button:hover,
.race-cue__button:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(168, 197, 218, 0.65);
}

.race-cue__dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: #c4453a;
  box-shadow: 0 0 0 0 rgba(196, 69, 58, 0.55);
  animation: race-pulse 1.9s ease-out infinite;
}

@keyframes race-pulse {
  0% { box-shadow: 0 0 0 0 rgba(196, 69, 58, 0.5); }
  70% { box-shadow: 0 0 0 0.5rem rgba(196, 69, 58, 0); }
  100% { box-shadow: 0 0 0 0 rgba(196, 69, 58, 0); }
}

/* ---------------------------------------------------------------- footer */

.race-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 4.5rem;
  padding: 0 1.25rem calc(1rem + env(safe-area-inset-bottom));
  text-align: center;
  pointer-events: none;
}

.race-footer__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.race-scan {
  font-family: 'Formula1', sans-serif;
  font-size: clamp(0.9rem, 4.2vw, 1.15rem);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #f5f0eb;
}

.race-hint {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(245, 240, 235, 0.5);
}

.race-link {
  pointer-events: auto;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: #a8c5da;
  text-decoration: none;
  border-bottom: 1px solid rgba(168, 197, 218, 0.3);
  padding-bottom: 1px;
}

.race-link:hover {
  border-bottom-color: rgba(168, 197, 218, 0.8);
}

.race-ghost {
  pointer-events: auto;
  margin-top: 0.15rem;
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(245, 240, 235, 0.18);
  background: transparent;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.6875rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(245, 240, 235, 0.72);
  cursor: pointer;
  transition: border-color 200ms ease, color 200ms ease;
}

.race-ghost:hover {
  border-color: rgba(245, 240, 235, 0.45);
  color: #f5f0eb;
}

.race-ghost--quiet {
  border-color: transparent;
  padding: 0.2rem 0.5rem;
  font-size: 0.5625rem;
  color: rgba(245, 240, 235, 0.35);
}

/* ---------------------------------------------------------------- tools */

.race-tools {
  position: absolute;
  top: max(0.85rem, env(safe-area-inset-top));
  right: max(0.85rem, env(safe-area-inset-right));
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.race-tool {
  padding: 0.3rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid rgba(245, 240, 235, 0.12);
  background: rgba(13, 13, 13, 0.5);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.5625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 240, 235, 0.45);
  cursor: pointer;
  transition: color 200ms ease, border-color 200ms ease;
}

.race-tool:hover {
  color: #f5f0eb;
  border-color: rgba(245, 240, 235, 0.35);
}

/* ---------------------------------------------------------------- states */

.race-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.race-fallback__qr {
  width: min(72vw, 60vh, 300px);
  height: auto;
  background: #fff;
  border-radius: 8px;
}

.race-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.race-spinner {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 2px solid rgba(107, 140, 174, 0.85);
  border-top-color: transparent;
  animation: race-spin 900ms linear infinite;
}

@keyframes race-spin {
  to { transform: rotate(360deg); }
}

.race-fade-enter-active,
.race-fade-leave-active {
  transition: opacity 260ms ease;
}

.race-fade-enter-from,
.race-fade-leave-to {
  opacity: 0;
}

/* Phone held sideways: the renderer puts the code on the right, so the copy
   stacks down the left instead of squeezing the code from above and below. */
.race-stage--landscape .race-title {
  top: 50%;
  right: auto;
  left: max(1.5rem, env(safe-area-inset-left));
  width: min(44vw, 26rem);
  transform: translateY(-100%);
  text-align: left;
  padding: 0 0 0.75rem;
}

.race-stage--landscape .race-title h1 {
  font-size: clamp(1.4rem, 4.6vw, 2.4rem);
}

.race-stage--landscape .race-footer {
  top: 50%;
  bottom: auto;
  right: auto;
  left: max(1.5rem, env(safe-area-inset-left));
  width: min(44vw, 26rem);
  min-height: 0;
  padding: 0.35rem 0 0;
  justify-content: flex-start;
  text-align: left;
}

.race-stage--landscape .race-footer__inner {
  align-items: flex-start;
}

@media (prefers-reduced-motion: reduce) {
  .race-cue__dot { animation: none; }
  .race-spinner { animation-duration: 2s; }
}
</style>
