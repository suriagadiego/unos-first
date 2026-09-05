import {
  CELL_ALIGN,
  CELL_FINDER_CORE,
  CELL_FINDER_RING,
  CELL_TIMING,
  CELL_TRACK,
  LANE_HORIZONTAL,
  LANE_NONE,
  LANE_VERTICAL,
  SIDE_E,
  SIDE_N,
  SIDE_S,
  SIDE_W,
  colToX,
  rowToY,
  type RaceWorld,
} from './raceWorld'
import { RACE_QR_QUIET_ZONE } from './raceQr'


/**
 * Canvas 2D renderer for the race-to-QR transformation.
 *
 * The whole scene is one perspective camera over a ground plane. Dark QR modules
 * are extruded into asphalt blocks; flattening them to zero height while the
 * camera rises to exactly top-down leaves the projected module squares sitting on
 * the real QR grid. There is no crossfade — the final code is the same geometry
 * the racetrack was made of, which is why the last frame is a byte-accurate QR.
 *
 * Canvas 2D rather than WebGL: the scene is a few hundred flat quads, it costs
 * nothing to ship (no new dependency), and it degrades predictably on old phones.
 */

// ---------------------------------------------------------------- easing

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeInQuad = (t: number) => t * t
const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))

// ---------------------------------------------------------------- colour

type Rgb = readonly [number, number, number]

const PALETTE = {
  backdrop: [13, 13, 13] as Rgb,
  backdropLift: [26, 33, 40] as Rgb,
  /**
   * Materials, not "before" colours. These are what the modules are made of from
   * the first frame to the last — the transformation never recolours anything, it
   * only flattens the geometry and lifts the camera. That is the whole illusion:
   * the settled code is the diorama seen from directly above, in its own paint.
   */
  ground: [213, 205, 192] as Rgb,
  plinthSide: [174, 165, 152] as Rgb,
  asphalt: [38, 45, 52] as Rgb,
  asphaltSide: [21, 26, 31] as Rgb,
  structure: [48, 58, 68] as Rgb,
  structureSide: [26, 33, 40] as Rgb,
  cream: [245, 240, 235] as Rgb,
  kerbRed: [196, 69, 58] as Rgb,
  blue: [107, 140, 174] as Rgb,
  blueLight: [168, 197, 218] as Rgb,
  shadow: [6, 8, 10] as Rgb,
  apron: [26, 32, 38] as Rgb,
  barrier: [58, 66, 74] as Rgb,
  lightOff: [96, 104, 114] as Rgb,
  lightOn: [232, 52, 42] as Rgb,
} as const

/** Quantised so the per-row draw batches collapse to a handful of fills. */
function channel(v: number) {
  const q = (v + 1.5) & ~3
  return q < 0 ? 0 : q > 255 ? 255 : q
}

function css(c: Rgb, alpha = 1) {
  const r = channel(c[0])
  const g = channel(c[1])
  const b = channel(c[2])
  return alpha >= 1
    ? `rgb(${r},${g},${b})`
    : `rgba(${r},${g},${b},${Math.round(alpha * 100) / 100})`
}

/**
 * The materials, cast in a handful of tones each. Slight hue drift as well as
 * value drift — patched tarmac is not uniformly grey, and neither is paving —
 * which is what gives the settled code its texture without ever putting a light
 * tone near a dark one.
 */
const ASPHALT_TONES = [
  [33, 40, 47],
  [45, 52, 58],
  [38, 43, 40],
  [29, 35, 42],
  [50, 56, 60],
].map(c => css(c as unknown as Rgb))

const STRUCTURE_TONES = [
  [44, 54, 64],
  [50, 60, 70],
  [46, 54, 56],
  [40, 49, 59],
  [52, 61, 68],
].map(c => css(c as unknown as Rgb))

const PAVING_TONES = [
  [216, 208, 195],
  [208, 200, 188],
  [223, 216, 204],
  [212, 203, 190],
  [204, 197, 186],
].map(c => css(c as unknown as Rgb))

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

function shadeBy(c: Rgb, amount: number): Rgb {
  return [c[0] + amount, c[1] + amount, c[2] + amount]
}

// ---------------------------------------------------------------- camera

/**
 * Yaw 0 puts the camera due south of the target looking north; pitch 90 is
 * straight down. At pitch 90 the projection degenerates to a uniform scale of
 * focal/dist — that is what lets the final frame land on an exact pixel grid.
 */
class Camera {
  px = 0; py = 0; pz = 0
  rx = 1; ry = 0; rz = 0
  ux = 0; uy = 0; uz = 1
  fx = 0; fy = 1; fz = 0
  focal = 1000
  cx = 0
  cy = 0
  /** Last projection result. */
  sx = 0; sy = 0; sd = 1

  set(pitchDeg: number, yawDeg: number, dist: number, tx: number, ty: number, tz: number) {
    const p = (pitchDeg * Math.PI) / 180
    const y = (yawDeg * Math.PI) / 180
    const cp = Math.cos(p)
    const sp = Math.sin(p)
    const cy = Math.cos(y)
    const sy = Math.sin(y)

    this.px = tx + dist * sy * cp
    this.py = ty - dist * cy * cp
    this.pz = tz + dist * sp

    this.fx = -sy * cp
    this.fy = cy * cp
    this.fz = -sp

    // Right stays horizontal, so there is no gimbal flip as pitch reaches 90.
    this.rx = cy
    this.ry = sy
    this.rz = 0

    this.ux = this.ry * this.fz - this.rz * this.fy
    this.uy = this.rz * this.fx - this.rx * this.fz
    this.uz = this.rx * this.fy - this.ry * this.fx
  }

  project(x: number, y: number, z: number) {
    const dx = x - this.px
    const dy = y - this.py
    const dz = z - this.pz
    const d = dx * this.fx + dy * this.fy + dz * this.fz
    const safe = d < 0.05 ? 0.05 : d
    this.sd = d
    this.sx = this.cx + (this.focal * (dx * this.rx + dy * this.ry + dz * this.rz)) / safe
    this.sy = this.cy - (this.focal * (dx * this.ux + dy * this.uy + dz * this.uz)) / safe
    return d > 0.05
  }
}

// ---------------------------------------------------------------- batching

/**
 * Groups same-colour quads into one Path2D so a row of asphalt costs a handful of
 * fills instead of one per module. Flushed per row to keep painter ordering.
 */
class QuadBatch {
  /** Buffers are keyed by colour and kept between frames; only the write head resets. */
  private buckets = new Map<string, { pts: number[]; len: number }>()
  private order: string[] = []

  add(color: string, pts: number[]) {
    let bucket = this.buckets.get(color)
    if (!bucket) {
      bucket = { pts: [], len: 0 }
      this.buckets.set(color, bucket)
    }
    if (bucket.len === 0) this.order.push(color)
    const { pts: buf } = bucket
    let n = bucket.len
    for (let i = 0; i < pts.length; i++) buf[n++] = pts[i]
    buf[n++] = NaN // quad separator
    bucket.len = n
  }

  flush(ctx: CanvasRenderingContext2D) {
    for (const color of this.order) {
      const bucket = this.buckets.get(color)!
      ctx.fillStyle = color
      ctx.beginPath()
      let start = true
      for (let i = 0; i < bucket.len; i += 2) {
        if (Number.isNaN(bucket.pts[i])) {
          ctx.closePath()
          start = true
          i -= 1
          continue
        }
        if (start) {
          ctx.moveTo(bucket.pts[i], bucket.pts[i + 1])
          start = false
        } else {
          ctx.lineTo(bucket.pts[i], bucket.pts[i + 1])
        }
      }
      ctx.fill()
      bucket.len = 0
    }
    this.order.length = 0
  }
}

/** Screen-space signed area. Front-facing quads come out negative with our winding. */
function signedArea(p: number[]) {
  let a = 0
  for (let i = 0; i < p.length; i += 2) {
    const j = (i + 2) % p.length
    a += p[i] * p[j + 1] - p[j] * p[i + 1]
  }
  return a
}

// ---------------------------------------------------------------- timeline

export interface Timeline {
  lightOn: number[]
  lightsOut: number
  carGone: number
  camRise: [number, number]
  wave: [number, number]
  cellFlatten: number
  cleanup: [number, number]
  snap: [number, number]
  end: number
}

export const FULL_TIMELINE: Timeline = {
  lightOn: [0, 240, 480, 720, 960],
  lightsOut: 1340,
  carGone: 2980,
  camRise: [1560, 4020],
  wave: [1880, 3320],
  cellFlatten: 420,
  cleanup: [2680, 3960],
  snap: [3660, 4120],
  end: 4200,
}

/** Reduced motion: the same transformation, just short, level and without the cinematics. */
export const REDUCED_TIMELINE: Timeline = {
  lightOn: [0, 0, 0, 0, 0],
  lightsOut: 140,
  carGone: 620,
  camRise: [150, 880],
  wave: [180, 640],
  cellFlatten: 260,
  cleanup: [260, 900],
  snap: [840, 960],
  end: 1000,
}

// ---------------------------------------------------------------- renderer

export type RacePhase = 'idle' | 'racing' | 'rewinding' | 'qr'
export type RaceLayoutMode = 'portrait' | 'landscape'

export interface FrameInfo {
  phase: RacePhase
  /** Where the car currently sits on screen, in CSS pixels. Null once it has gone. */
  carX: number
  carY: number
  carVisible: boolean
  progress: number
}

export interface RaceRendererOptions {
  canvas: HTMLCanvasElement
  world: RaceWorld
  reducedMotion: boolean
  onFrame?: (info: FrameInfo) => void
  onComplete?: () => void
  onRewound?: () => void
}

const START_PITCH = 30
const START_YAW = -13
/** Reduced motion still gets a 3D scene, just one the camera barely has to travel from. */
const REDUCED_START_PITCH = 64
const REDUCED_START_YAW = -4
const APRON_LENGTH = 10
const APRON_HALF_WIDTH = 4.6

export function createRaceRenderer(options: RaceRendererOptions) {
  const { canvas, world } = options
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D is unavailable')

  const { size } = world
  const half = (size - 1) / 2
  const boardEdge = half + 0.5
  const startX = colToX(world.startCol, size)

  const carStartY = -boardEdge - APRON_LENGTH * 0.6
  const carExitY = boardEdge + 16

  const cam = new Camera()
  const batch = new QuadBatch()
  const quad = [0, 0, 0, 0, 0, 0, 0, 0]

  let timeline = options.reducedMotion ? REDUCED_TIMELINE : FULL_TIMELINE
  let reduced = options.reducedMotion
  const startPitch = () => (reduced ? REDUCED_START_PITCH : START_PITCH)
  const startYaw = () => (reduced ? REDUCED_START_YAW : START_YAW)
  let phase: RacePhase = 'idle'
  let raceTime = 0
  let launchedAt = 0
  let rewindStartedAt = 0
  let clock = 0
  let rafId = 0
  let lastStamp = 0
  let running = false
  let quality: 'high' | 'low' = 'high'
  let frameSamples = 0
  /** Rolling average of actual draw cost, in ms. Drives the quality downgrade. */
  let renderCost = 0

  // Viewport-derived layout, recomputed on resize.
  let vw = 1
  let vh = 1
  let dpr = 1
  let focal = 1000
  let modulePx = 8
  let marginPx = 40
  let cardX = 0
  let cardY = 0
  let cardSize = 0
  let qrX = 0
  let qrY = 0
  let startDist = 100
  let finalDist = 100
  let backdrop: CanvasGradient | null = null
  let safeTop = 0
  let safeBottom = 0
  let layoutMode: RaceLayoutMode = 'portrait'

  const frameInfo: FrameInfo = { phase: 'idle', carX: 0, carY: 0, carVisible: true, progress: 0 }

  // ------------------------------------------------------------ layout

  /**
   * Reserves room for the copy, then sizes the module to a whole number of CSS
   * pixels. Whole pixels matter: it is what keeps the settled code free of
   * anti-aliased module edges.
   *
   * A phone held sideways has almost no vertical room, so there the copy moves
   * beside the code instead of above and below it — otherwise the modules end up
   * too small to scan comfortably.
   */
  function layout() {
    const rect = canvas.getBoundingClientRect()
    vw = Math.max(1, rect.width)
    vh = Math.max(1, rect.height)
    dpr = Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1.5 : 2)
    canvas.width = Math.round(vw * dpr)
    canvas.height = Math.round(vh * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

    // The plate is the symbol plus its quiet zone, and nothing else: it is simply
    // the diorama's ground, seen from above.
    const plateCells = size + RACE_QR_QUIET_ZONE * 2
    layoutMode = vw / vh > 1.35 && vh < 560 ? 'landscape' : 'portrait'

    let box: number
    if (layoutMode === 'landscape') {
      const pad = Math.min(30, vh * 0.08)
      safeTop = pad
      safeBottom = pad
      box = Math.min(vh - pad * 2, vw * 0.46, 460)
    } else {
      safeTop = Math.min(120, vh * 0.16)
      safeBottom = Math.min(184, vh * 0.24)
      box = Math.min(vw * 0.9, Math.max(120, vh - safeTop - safeBottom), 460)
    }

    modulePx = Math.max(2, Math.floor(box / plateCells))
    cardSize = modulePx * plateCells

    if (layoutMode === 'landscape') {
      cardX = Math.round(vw * 0.72 - cardSize / 2)
      cardY = Math.round((vh - cardSize) / 2)
    } else {
      const availableH = Math.max(120, vh - safeTop - safeBottom)
      cardX = Math.round((vw - cardSize) / 2)
      cardY = Math.round(safeTop + (availableH - cardSize) / 2)
    }

    marginPx = modulePx * RACE_QR_QUIET_ZONE
    qrX = cardX + marginPx
    qrY = cardY + marginPx

    focal = Math.max(vw, vh) * 1.15
    finalDist = focal / modulePx

    const grad = ctx!.createRadialGradient(vw / 2, vh * 0.42, 0, vw / 2, vh * 0.42, Math.max(vw, vh) * 0.75)
    grad.addColorStop(0, css(PALETTE.backdropLift))
    grad.addColorStop(1, css(PALETTE.backdrop))
    backdrop = grad

    startDist = fitStartDistance()
  }

  /**
   * The opening shot frames the car and the first stretch of circuit, not the
   * whole board. Seeing the entire grid up front would give the code away before
   * the race has even started.
   */
  function framingPoints() {
    const pts: Array<[number, number, number]> = []
    const wide = reduced ? 1.8 : 1
    for (const x of [startX - 2.35 * wide, startX + 2.35 * wide]) {
      for (const y of [carStartY - 1.4 * wide, carStartY + 2.9 * wide]) {
        pts.push([x, y, 0])
        pts.push([x, y, 1.1])
      }
    }
    return pts
  }

  function fitStartDistance() {
    const pts = framingPoints()
    const targetStart = startTarget()
    const padX = vw * 0.05
    const padTop = safeTop * 0.9
    const padBottom = safeBottom * 0.55
    let lo = 20
    let hi = 4000
    for (let iter = 0; iter < 26; iter++) {
      const mid = (lo + hi) / 2
      const [pcx, pcy] = startPrincipal()
      cam.focal = focal
      cam.cx = pcx
      cam.cy = pcy
      cam.set(startPitch(), startYaw(), mid, targetStart[0], targetStart[1], targetStart[2])
      let ok = true
      for (const [x, y, z] of pts) {
        cam.project(x, y, z)
        if (
          cam.sx < padX || cam.sx > vw - padX ||
          cam.sy < padTop || cam.sy > vh - padBottom
        ) {
          ok = false
          break
        }
      }
      if (ok) hi = mid
      else lo = mid
    }
    return hi
  }

  function startTarget(): [number, number, number] {
    return [startX - 1.4, carStartY + 1.1, 0.45]
  }

  /**
   * The opening shot sits low in the frame so the circuit fills the space above the
   * car instead of leaving dead ground below it.
   */
  function startPrincipal(): [number, number] {
    return [vw / 2, vh * 0.66]
  }

  // ------------------------------------------------------------ animated state

  interface Params {
    riseT: number
    cleanT: number
    snapT: number
    carY: number
    carSpeed: number
    carAlpha: number
    carPitch: number
    lightsLit: number
    lightsOut: boolean
    shake: number
    detail: number
  }

  const params: Params = {
    riseT: 0, cleanT: 0, snapT: 0, carY: 0, carSpeed: 0,
    carAlpha: 1, carPitch: 0, lightsLit: 0, lightsOut: false, shake: 0, detail: 1,
  }


  function computeParams(t: number) {
    params.riseT = easeInOutCubic(span(t, timeline.camRise[0], timeline.camRise[1]))
    params.cleanT = easeInOutCubic(span(t, timeline.cleanup[0], timeline.cleanup[1]))
    params.snapT = easeInOutCubic(span(t, timeline.snap[0], timeline.snap[1]))
    params.detail = 1 - clamp01(params.cleanT * 1.6)

    params.lightsLit = 0
    if (phase === 'racing' || phase === 'qr') {
      for (let i = 0; i < timeline.lightOn.length; i++) if (t >= timeline.lightOn[i]) params.lightsLit = i + 1
    }
    params.lightsOut = t >= timeline.lightsOut
    if (params.lightsOut) params.lightsLit = 0

    const runT = clamp01((t - timeline.lightsOut) / (timeline.carGone - timeline.lightsOut))
    // Accelerating, not teleporting: the car should be visibly on track through the
    // first half of the run, then pull away hard.
    const travel = Math.pow(runT, 1.85)
    params.carY = lerp(carStartY, carExitY, travel)
    params.carSpeed = runT <= 0 ? 0 : clamp01(runT * 3.2) * (1 - easeInQuad(clamp01((runT - 0.7) / 0.3)) * 0.35)
    params.carAlpha = 1 - clamp01((runT - 0.72) / 0.28)
    // Squat on the launch, settle as it goes.
    params.carPitch = -2.6 * Math.exp(-runT * 9) * Math.min(1, runT * 22)

    const shakeWindow = clamp01((t - timeline.lightsOut) / 620)
    params.shake =
      reduced || phase !== 'racing' ? 0 : (1 - shakeWindow) * (t >= timeline.lightsOut ? 1 : 0) * 3.4
  }

  /** Per-module flatten, 0 = full height, 1 = flat on the grid. */
  function cellFlatten(t: number, waveValue: number) {
    const startAt = lerp(timeline.wave[0], timeline.wave[1], waveValue)
    return clamp01((t - startAt) / timeline.cellFlatten)
  }

  function applyCamera(t: number) {
    const idle = phase === 'idle' ? 1 : 1 - params.riseT
    const breatheYaw = reduced ? 0 : Math.sin(clock / 5200) * 0.9 * idle
    const breathePitch = reduced ? 0 : Math.sin(clock / 6100) * 0.45 * idle

    const pitch = lerp(startPitch(), 90, params.riseT) + breathePitch
    const yaw = lerp(startYaw(), 0, params.riseT) + breatheYaw
    // A short push-in on the launch before the camera climbs away.
    const kick = reduced ? 0 : Math.sin(clamp01((t - timeline.lightsOut) / 900) * Math.PI) * 0.05
    const dist = lerp(startDist, finalDist, params.riseT) * (1 - kick)

    const s = startTarget()
    const tx = lerp(s[0], 0, params.riseT)
    const ty = lerp(s[1], 0, params.riseT)
    const tz = lerp(s[2], 0, params.riseT)

    const shakeX = params.shake ? Math.sin(clock / 21) * params.shake : 0
    const shakeY = params.shake ? Math.cos(clock / 17) * params.shake * 0.7 : 0

    const [pcx, pcy] = startPrincipal()
    cam.focal = focal
    cam.cx = lerp(pcx, cardX + cardSize / 2, params.riseT) + shakeX
    cam.cy = lerp(pcy, cardY + cardSize / 2, params.riseT) + shakeY
    cam.set(pitch, yaw, dist, tx, ty, tz)
  }

  // ------------------------------------------------------------ geometry helpers

  /** Screen X/Y of a module corner once fully settled — the exact QR pixel grid. */
  function flatX(worldX: number) {
    return qrX + (worldX + half + 0.5) * modulePx
  }
  function flatY(worldY: number) {
    return qrY + (half + 0.5 - worldY) * modulePx
  }

  /**
   * Projects a ground-plane point, blending into the exact pixel grid as the
   * animation settles. The two agree to well under a pixel by the time snapT
   * starts moving, so this reads as nothing at all — but it guarantees the last
   * frame is on whole pixels.
   */
  function ground(x: number, y: number, z: number, out: number[], i: number) {
    cam.project(x, y, z)
    if (params.snapT > 0) {
      const s = params.snapT
      out[i] = lerp(cam.sx, flatX(x), s)
      out[i + 1] = lerp(cam.sy, flatY(y), s)
    } else {
      out[i] = cam.sx
      out[i + 1] = cam.sy
    }
  }

  function quadOf(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx2: number, cy2: number, cz: number,
    dx: number, dy: number, dz: number,
  ) {
    ground(ax, ay, az, quad, 0)
    ground(bx, by, bz, quad, 2)
    ground(cx2, cy2, cz, quad, 4)
    ground(dx, dy, dz, quad, 6)
    return quad
  }

  // ------------------------------------------------------------ scene pieces

  function drawBackdrop() {
    ctx!.fillStyle = backdrop || css(PALETTE.backdrop)
    ctx!.fillRect(0, 0, vw, vh)
  }

  /**
   * Keeps the title legible when the scene runs up behind it (wide viewports).
   * Hard-clamped above the card so it can never darken the quiet zone.
   */
  function drawTitleScrim() {
    if (layoutMode === 'landscape') {
      // Copy sits in a left column, so the scrim runs the other way.
      const width = Math.max(0, Math.min(vw * 0.58, cardX - 10))
      if (width < 8) return
      const g = ctx!.createLinearGradient(0, 0, width, 0)
      g.addColorStop(0, css(PALETTE.backdrop, 0.92))
      g.addColorStop(0.62, css(PALETTE.backdrop, 0.62))
      g.addColorStop(1, css(PALETTE.backdrop, 0))
      ctx!.fillStyle = g
      ctx!.fillRect(0, 0, width, vh)
      return
    }
    const height = Math.min(safeTop * 1.55, Math.max(0, cardY))
    if (height < 8) return
    const g = ctx!.createLinearGradient(0, 0, 0, height)
    g.addColorStop(0, css(PALETTE.backdrop, 0.86))
    g.addColorStop(0.55, css(PALETTE.backdrop, 0.5))
    g.addColorStop(1, css(PALETTE.backdrop, 0))
    ctx!.fillStyle = g
    ctx!.fillRect(0, 0, vw, height)
  }

  /**
   * The model base. Its top face is the light-module ground during the race and
   * the QR's white quiet-zone card once everything settles — the same surface,
   * never swapped out.
   */
  function drawPlinth() {
    const e = boardEdge + RACE_QR_QUIET_ZONE
    const depth = 0.55 * (1 - params.snapT)
    const topColor = css(PALETTE.ground)

    if (depth > 0.002) {
      const sideColor = css(PALETTE.plinthSide)
      const sides: number[][] = [
        [-e, -e, -depth, e, -e, -depth, e, -e, 0, -e, -e, 0],
        [e, -e, -depth, e, e, -depth, e, e, 0, e, -e, 0],
        [-e, e, -depth, -e, -e, -depth, -e, -e, 0, -e, e, 0],
      ]
      for (const s of sides) {
        const p = quadOf(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], s[11])
        if (signedArea(p) < 0) batch.add(sideColor, p)
      }
      batch.flush(ctx!)
    }

    if (params.snapT > 0.995) {
      ctx!.fillStyle = topColor
      ctx!.fillRect(cardX, cardY, cardSize, cardSize)
    } else {
      const p = quadOf(-e, e, 0, e, e, 0, e, -e, 0, -e, -e, 0)
      ctx!.fillStyle = topColor
      ctx!.beginPath()
      ctx!.moveTo(p[0], p[1])
      ctx!.lineTo(p[2], p[3])
      ctx!.lineTo(p[4], p[5])
      ctx!.lineTo(p[6], p[7])
      ctx!.closePath()
      ctx!.fill()
    }
  }

  /**
   * Light modules, as paving slabs. Drawn in one pass across the whole board
   * rather than per row: they are all on the ground plane, so they cannot occlude
   * each other, and doing them up front keeps the raised blocks painting cleanly
   * over them. This is the other half of the illusion — from overhead these tiles
   * are the code's light modules, and they are the same slabs you see in the
   * opening shot.
   */
  function drawPaving() {
    for (let row = 0; row < size; row++) {
      const y = rowToY(row, size)
      for (let col = 0; col < size; col++) {
        const i = row * size + col
        if (world.dark[i]) continue
        const x = colToX(col, size)
        const p = quadOf(x - 0.5, y + 0.5, 0, x + 0.5, y + 0.5, 0, x + 0.5, y - 0.5, 0, x - 0.5, y - 0.5, 0)
        batch.add(groundColor(i), p)
      }
    }
    batch.flush(ctx!)
  }

  /**
   * The pit-lane spur the car launches from: a narrow slab hanging off the south
   * edge of the model. It sinks away during cleanup so the quiet zone is clear.
   */
  function drawApron() {
    const sink = easeInOutCubic(params.cleanT)
    const alpha = clamp01(1 - params.cleanT * 2.3)
    if (alpha <= 0.01) return
    // Slides away south while it sinks, so it clears the quiet zone rather than
    // dissolving over the code.
    const retreat = sink * 9
    const west = startX - APRON_HALF_WIDTH
    const east = startX + APRON_HALF_WIDTH
    const south = -boardEdge - APRON_LENGTH - retreat
    const drop = -0.02 - sink * 1.4

    ctx!.save()
    ctx!.globalAlpha = alpha

    // Slab edge, so the spur reads as part of the model rather than a floating decal.
    const north = -boardEdge - retreat
    const skirt = 0.5
    for (const wall of [
      [west, south, east, south],
      [west, north, west, south],
      [east, south, east, north],
    ] as const) {
      const q = quadOf(wall[0], wall[1], drop - skirt, wall[2], wall[3], drop - skirt, wall[2], wall[3], drop, wall[0], wall[1], drop)
      if (signedArea(q) < 0) batch.add(css(PALETTE.plinthSide), q)
    }
    let p = quadOf(west, north, drop, east, north, drop, east, south, drop, west, south, drop)
    batch.add(css(PALETTE.apron), p)
    batch.flush(ctx!)

    // Start / finish line: two rows of checker on the module grid.
    const lineY0 = -boardEdge - 1.6 - retreat
    const lineY1 = lineY0 - 1.1
    for (let i = Math.floor(west); i < Math.ceil(east); i++) {
      for (let r = 0; r < 2; r++) {
        const light = (i + r) % 2 === 0
        const y0 = lerp(lineY0, lineY1, r / 2)
        const y1 = lerp(lineY0, lineY1, (r + 1) / 2)
        const ix0 = Math.max(west, i)
        const ix1 = Math.min(east, i + 1)
        if (ix1 <= ix0) continue
        p = quadOf(ix0, y0, drop + 0.004, ix1, y0, drop + 0.004, ix1, y1, drop + 0.004, ix0, y1, drop + 0.004)
        batch.add(css(light ? PALETTE.cream : PALETTE.apron), p)
      }
    }
    batch.flush(ctx!)

    // Staggered grid boxes, pole on the left.
    ctx!.lineWidth = Math.max(1, modulePx * 0.1)
    ctx!.strokeStyle = css(PALETTE.cream, 0.4 * alpha)
    for (let slot = 0; slot < 4; slot++) {
      const side = slot % 2 === 0 ? -1 : 1
      const rank = Math.floor(slot / 2)
      const bx = startX + side * 1.65
      const by = -boardEdge - 3.0 - retreat - rank * 2.5 - (side > 0 ? 1.2 : 0)
      p = quadOf(bx - 0.72, by + 1.25, drop + 0.006, bx + 0.72, by + 1.25, drop + 0.006, bx + 0.72, by - 1.25, drop + 0.006, bx - 0.72, by - 1.25, drop + 0.006)
      ctx!.beginPath()
      ctx!.moveTo(p[0], p[1])
      ctx!.lineTo(p[2], p[3])
      ctx!.lineTo(p[4], p[5])
      ctx!.lineTo(p[6], p[7])
      ctx!.closePath()
      ctx!.stroke()
    }
    ctx!.restore()
  }

  /** Cheap contact shadows: one merged path, so overlaps never double-darken. */
  function drawShadows(t: number) {
    if (quality === 'low') return
    const strength = (1 - params.cleanT) * 0.34
    if (strength <= 0.01) return
    const path = new Path2D()
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const i = row * size + col
        if (!world.dark[i]) continue
        const h = world.height[i] * (1 - cellFlatten(t, world.wave[i]))
        if (h < 0.02) continue
        const x = colToX(col, size)
        const y = rowToY(row, size)
        const off = h * 0.55
        const p = quadOf(
          x - 0.5 + off, y + 0.5 - off * 0.6, 0.002,
          x + 0.5 + off, y + 0.5 - off * 0.6, 0.002,
          x + 0.5 + off, y - 0.5 - off * 0.6, 0.002,
          x - 0.5 + off, y - 0.5 - off * 0.6, 0.002,
        )
        path.moveTo(p[0], p[1])
        path.lineTo(p[2], p[3])
        path.lineTo(p[4], p[5])
        path.lineTo(p[6], p[7])
        path.closePath()
      }
    }
    ctx!.fillStyle = css(PALETTE.shadow, strength)
    ctx!.fill(path)
  }

  /**
   * The track itself. Rows are drawn far to near so extruded blocks occlude
   * correctly; within a row, same-colour faces are batched into single fills.
   */
  function drawTrack(t: number) {
    const detail = params.detail
    const kerbAlpha = clamp01(detail * 1.3)
    const laneAlpha = clamp01(detail * 1.2) * 0.4

    for (let row = 0; row < size; row++) {
      const y = rowToY(row, size)
      const y0 = y - 0.5
      const y1 = y + 0.5

      // --- side faces
      for (let col = 0; col < size; col++) {
        const i = row * size + col
        if (!world.dark[i]) continue
        const flat = cellFlatten(t, world.wave[i])
        const h = blockHeight(i, flat)
        if (h < 0.004) continue
        const x = colToX(col, size)
        const x0 = x - 0.5
        const x1 = x + 0.5
        const color = css(
          world.kind[i] === CELL_TRACK || world.kind[i] === CELL_TIMING
            ? PALETTE.asphaltSide
            : PALETTE.structureSide,
        )

        let p = quadOf(x0, y0, 0, x1, y0, 0, x1, y0, h, x0, y0, h)
        if (signedArea(p) < 0) batch.add(color, p)
        p = quadOf(x1, y1, 0, x0, y1, 0, x0, y1, h, x1, y1, h)
        if (signedArea(p) < 0) batch.add(color, p)
        p = quadOf(x0, y1, 0, x0, y0, 0, x0, y0, h, x0, y1, h)
        if (signedArea(p) < 0) batch.add(color, p)
        p = quadOf(x1, y0, 0, x1, y1, 0, x1, y1, h, x1, y0, h)
        if (signedArea(p) < 0) batch.add(color, p)
      }
      batch.flush(ctx!)

      // --- top faces
      for (let col = 0; col < size; col++) {
        const i = row * size + col
        if (!world.dark[i]) continue
        const flat = cellFlatten(t, world.wave[i])
        const h = blockHeight(i, flat)
        const x = colToX(col, size)
        const p = quadOf(x - 0.5, y + 0.5, h, x + 0.5, y + 0.5, h, x + 0.5, y - 0.5, h, x - 0.5, y - 0.5, h)
        batch.add(topColor(i), p)
      }
      batch.flush(ctx!)

      if (detail <= 0.02) continue

      // --- kerbs, caps and centre lines, painted onto the top faces
      for (let col = 0; col < size; col++) {
        const i = row * size + col
        if (!world.dark[i]) continue
        const flat = cellFlatten(t, world.wave[i])
        const h = blockHeight(i, flat) + 0.0015
        const x = colToX(col, size)
        const kind = world.kind[i]

        if (world.kerb[i] && kerbAlpha > 0.02) drawKerbs(i, col, row, x, y, h, kerbAlpha)

        if (kind === CELL_TIMING) {
          // Sector-timing strip: a cream cap along the run of the timing pattern.
          const vertical = col === 6
          const a = 0.55 * detail
          const p = vertical
            ? quadOf(x - 0.18, y + 0.5, h, x + 0.18, y + 0.5, h, x + 0.18, y - 0.5, h, x - 0.18, y - 0.5, h)
            : quadOf(x - 0.5, y + 0.18, h, x + 0.5, y + 0.18, h, x + 0.5, y - 0.18, h, x - 0.5, y - 0.18, h)
          batch.add(css(PALETTE.cream, a), p)
        } else if (kind === CELL_FINDER_RING || kind === CELL_ALIGN) {
          // Cream capping line reads as barrier topping around the corner complexes.
          const inset = 0.34
          const p = quadOf(x - inset, y + inset, h, x + inset, y + inset, h, x + inset, y - inset, h, x - inset, y - inset, h)
          batch.add(css(PALETTE.blueLight, 0.24 * detail), p)
        } else if (kind === CELL_FINDER_CORE) {
          const p = quadOf(x - 0.3, y + 0.3, h, x + 0.3, y + 0.3, h, x + 0.3, y - 0.3, h, x - 0.3, y - 0.3, h)
          batch.add(css(PALETTE.blue, 0.32 * detail), p)
        } else if (world.lane[i] !== LANE_NONE && laneAlpha > 0.02 && quality === 'high') {
          const w = 0.08
          const l = 0.3
          const p = world.lane[i] === LANE_VERTICAL
            ? quadOf(x - w, y + l, h, x + w, y + l, h, x + w, y - l, h, x - w, y - l, h)
            : quadOf(x - l, y + w, h, x + l, y + w, h, x + l, y - w, h, x - l, y - w, h)
          batch.add(css(PALETTE.cream, laneAlpha), p)
        }
      }
      batch.flush(ctx!)
    }
  }

  function blockHeight(i: number, flat: number) {
    const s = easeInOutCubic(flat)
    // A hair of lift before each block settles, so the wave has some weight to it.
    const lift = reduced ? 0 : 0.22 * Math.sin(Math.PI * flat) * (1 - flat) * (1 - flat)
    return world.height[i] * ((1 - s) + lift)
  }

  /**
   * Asphalt tone for a dark module. Real tonal spread is what stops the settled
   * code reading as a flat graphic — it keeps looking like separately cast
   * sections of track, exactly as it does in the opening shot. Every tone stays
   * inside its band (dark 34–56, light 189–216 luma) so contrast never drops
   * below about 6:1 anywhere on the code.
   */
  function topColor(i: number) {
    const kind = world.kind[i]
    const tones = kind === CELL_TRACK || kind === CELL_TIMING ? ASPHALT_TONES : STRUCTURE_TONES
    return tones[world.shade[i] % tones.length]
  }

  /** Paving tone for a light module. Same idea, at the other end of the range. */
  function groundColor(i: number) {
    return PAVING_TONES[world.shade[i] % PAVING_TONES.length]
  }

  /**
   * Red/cream kerbing on the outer lip of a module edge. The stripe phase comes
   * from the world position, so kerbs read as one continuous run across modules
   * instead of restarting at every tile.
   */
  function drawKerbs(i: number, col: number, row: number, x: number, y: number, h: number, alpha: number) {
    const k = world.kerb[i]
    const lip = 0.24
    const step = 0.5
    const red = css(PALETTE.kerbRed, alpha)
    const pale = css(PALETTE.cream, alpha)

    const horizontal = (edgeY: number, inward: number) => {
      for (let s = 0; s < 2; s++) {
        const sx0 = x - 0.5 + s * step
        const sx1 = sx0 + step
        const light = (Math.round((sx0 + 100) / step) % 2) === 0
        const p = quadOf(sx0, edgeY, h, sx1, edgeY, h, sx1, edgeY + inward * lip, h, sx0, edgeY + inward * lip, h)
        batch.add(light ? pale : red, p)
      }
    }
    const vertical = (edgeX: number, inward: number) => {
      for (let s = 0; s < 2; s++) {
        const sy0 = y - 0.5 + s * step
        const sy1 = sy0 + step
        const light = (Math.round((sy0 + 100) / step) % 2) === 0
        const p = quadOf(edgeX, sy0, h, edgeX + inward * lip, sy0, h, edgeX + inward * lip, sy1, h, edgeX, sy1, h)
        batch.add(light ? pale : red, p)
      }
    }

    if (k & SIDE_N) horizontal(y + 0.5, -1)
    if (k & SIDE_S) horizontal(y - 0.5, 1)
    if (k & SIDE_W) vertical(x - 0.5, 1)
    if (k & SIDE_E) vertical(x + 0.5, -1)
  }

  /** Armco around the run-off. Retracts into the ground as the scene resolves. */
  function drawBarriers() {
    const alpha = 1 - params.cleanT
    if (alpha <= 0.02 || quality === 'low') return
    const e = boardEdge + 2.2
    const top = 0.42 * (1 - easeInOutCubic(params.cleanT))
    if (top < 0.01) return
    const railColor = css(PALETTE.cream, 0.5 * alpha)
    const postColor = css(PALETTE.barrier, 0.75 * alpha)

    const runs: Array<[number, number, number, number]> = [
      [-e, e, e, e],
      [-e, -e, e, -e],
      [-e, -e, -e, e],
      [e, -e, e, e],
    ]
    for (const [x0, y0, x1, y1] of runs) {
      const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2.4))
      for (let s = 0; s < steps; s++) {
        const a = s / steps
        const b = (s + 0.72) / steps
        const ax = lerp(x0, x1, a)
        const ay = lerp(y0, y1, a)
        const bx = lerp(x0, x1, b)
        const by = lerp(y0, y1, b)
        let p = quadOf(ax, ay, top * 0.45, bx, by, top * 0.45, bx, by, top, ax, ay, top)
        batch.add(railColor, p)
        p = quadOf(ax, ay, 0, bx, by, 0, bx, by, top * 0.3, ax, ay, top * 0.3)
        batch.add(postColor, p)
      }
    }
    batch.flush(ctx!)
  }

  /** Tyre stacks and cones. They shrink away rather than fading, so the run-off empties. */
  function drawDecor() {
    const scale = 1 - easeInOutCubic(params.cleanT)
    if (scale < 0.03 || quality === 'low') return
    for (const item of world.decor) {
      const s = item.size * scale
      if (item.kind === 'tyres') {
        for (let level = 0; level < 3; level++) {
          const z0 = level * s * 0.62
          const z1 = z0 + s * 0.5
          const rim = level % 2 === 0 ? PALETTE.barrier : PALETTE.cream
          const p = quadOf(item.x - s, item.y + s, z1, item.x + s, item.y + s, z1, item.x + s, item.y - s, z1, item.x - s, item.y - s, z1)
          batch.add(css(rim, 0.85), p)
          const side = quadOf(item.x - s, item.y - s, z0, item.x + s, item.y - s, z0, item.x + s, item.y - s, z1, item.x - s, item.y - s, z1)
          if (signedArea(side) < 0) batch.add(css(PALETTE.backdrop, 0.55), side)
        }
      } else {
        const p = quadOf(item.x - s, item.y - s, 0, item.x + s, item.y - s, 0, item.x + s * 0.2, item.y - s, s * 2.6, item.x - s * 0.2, item.y - s, s * 2.6)
        batch.add(css(PALETTE.kerbRed, 0.9), p)
      }
    }
    batch.flush(ctx!)
  }

  /** Start-light gantry. Lifts and fades once the race is under way. */
  function drawGantry(t: number) {
    const fade = 1 - clamp01(span(t, timeline.lightsOut + 200, timeline.lightsOut + 1200))
    if (fade <= 0.02) return
    const rise = (1 - fade) * 2.6
    const y = -boardEdge - 2.6
    const spanX = APRON_HALF_WIDTH - 0.2
    const beamZ = 2.7 + rise
    const legZ = 0.06

    ctx!.save()
    ctx!.globalAlpha = fade
    const frame = css(PALETTE.barrier)
    const beamFace = css(PALETTE.backdropLift)

    for (const sx of [-1, 1]) {
      const x = startX + sx * spanX
      const p = quadOf(x - 0.14, y, legZ, x + 0.14, y, legZ, x + 0.14, y, beamZ, x - 0.14, y, beamZ)
      batch.add(frame, p)
    }
    let p = quadOf(startX - spanX, y, beamZ - 0.44, startX + spanX, y, beamZ - 0.44, startX + spanX, y, beamZ, startX - spanX, y, beamZ)
    batch.add(beamFace, p)
    p = quadOf(startX - spanX, y, beamZ, startX + spanX, y, beamZ, startX + spanX, y - 0.14, beamZ, startX - spanX, y - 0.14, beamZ)
    batch.add(frame, p)
    batch.flush(ctx!)

    // Five panels, two lamps each — lit left to right, then all out.
    const panelW = (spanX * 2) / 5
    for (let i = 0; i < 5; i++) {
      const cxp = startX - spanX + panelW * (i + 0.5)
      const lit = i < params.lightsLit
      const color = lit ? PALETTE.lightOn : PALETTE.lightOff
      for (let lamp = 0; lamp < 2; lamp++) {
        const z = beamZ - 0.18 - lamp * 0.24
        const r = 0.105
        // Housing first, so an unlit panel still reads as a light panel.
        p = quadOf(cxp - r * 1.4, y - 0.015, z + r * 1.4, cxp + r * 1.4, y - 0.015, z + r * 1.4, cxp + r * 1.4, y - 0.015, z - r * 1.4, cxp - r * 1.4, y - 0.015, z - r * 1.4)
        batch.add(css(PALETTE.backdrop), p)
        p = quadOf(cxp - r, y - 0.02, z + r, cxp + r, y - 0.02, z + r, cxp + r, y - 0.02, z - r, cxp - r, y - 0.02, z - r)
        batch.add(css(color), p)
        if (lit) {
          const g = r * 2.1
          p = quadOf(cxp - g, y - 0.03, z + g, cxp + g, y - 0.03, z + g, cxp + g, y - 0.03, z - g, cxp - g, y - 0.03, z - g)
          batch.add(css(PALETTE.lightOn, 0.18), p)
        }
      }
    }
    batch.flush(ctx!)
    ctx!.restore()
  }

  // ------------------------------------------------------------ the car

  interface Face {
    depth: number
    color: string
    pts: number[]
  }
  const faces: Face[] = []

  function carLocalToWorld(lx: number, ly: number, lz: number, out: number[]) {
    const p = (params.carPitch * Math.PI) / 180
    const cp = Math.cos(p)
    const sp = Math.sin(p)
    out[0] = startX - 1.65 + lx
    out[1] = params.carY + ly * cp - lz * sp
    out[2] = 0.02 + ly * sp + lz * cp
    return out
  }

  const tmpA: number[] = [0, 0, 0]

  function carQuad(color: string, pts: Array<[number, number, number]>, cull = true) {
    const out: number[] = []
    let depth = 0
    for (const [lx, ly, lz] of pts) {
      carLocalToWorld(lx, ly, lz, tmpA)
      cam.project(tmpA[0], tmpA[1], tmpA[2])
      depth += cam.sd
      out.push(cam.sx, cam.sy)
    }
    if (cull && signedArea(out) >= 0) return
    faces.push({ depth: depth / pts.length, color, pts: out })
  }

  /**
   * Original stylised Formula-style car — no team livery, just the site's blue,
   * cream and black, with UNO 01 on it.
   */
  function drawCar() {
    if (params.carAlpha <= 0.02) return
    faces.length = 0

    const bodyTop = css(PALETTE.blueLight)
    const bodySide = css(mix(PALETTE.blue, PALETTE.backdrop, 0.28))
    const bodyMid = css(PALETTE.blue)
    const dark = css(PALETTE.backdrop)
    const creamC = css(PALETTE.cream)
    const accent = css(PALETTE.kerbRed)
    const tyre = css([21, 25, 29])
    const rim = css([46, 54, 62])

    const box = (
      x0: number, x1: number, y0: number, y1: number, z0: number, z1: number,
      top: string, side: string,
    ) => {
      carQuad(top, [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]])
      carQuad(side, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]])
      carQuad(side, [[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]])
      carQuad(side, [[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]])
      carQuad(side, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]])
    }

    // Front wing, nose, cockpit, sidepods, engine cover, rear wing.
    box(-0.62, 0.62, 1.08, 1.34, 0.03, 0.09, creamC, css(mix(PALETTE.cream, PALETTE.backdrop, 0.3)))
    carQuad(accent, [[-0.62, 1.34, 0.091], [0.62, 1.34, 0.091], [0.62, 1.24, 0.091], [-0.62, 1.24, 0.091]])
    box(-0.13, 0.13, 0.62, 1.12, 0.09, 0.24, creamC, css(mix(PALETTE.cream, PALETTE.backdrop, 0.34)))
    box(-0.2, 0.2, 0.1, 0.66, 0.08, 0.3, bodyTop, bodySide)
    box(-0.42, -0.2, -0.05, 0.55, 0.07, 0.26, bodyMid, bodySide)
    box(0.2, 0.42, -0.05, 0.55, 0.07, 0.26, bodyMid, bodySide)
    box(-0.19, 0.19, -0.62, 0.12, 0.08, 0.38, bodyTop, bodySide)
    box(-0.55, 0.55, -0.98, -0.78, 0.34, 0.44, css(PALETTE.backdropLift), dark)
    box(-0.06, 0.06, -0.9, -0.7, 0.1, 0.36, dark, dark)

    // Halo.
    carQuad(dark, [[-0.2, 0.14, 0.32], [0.2, 0.14, 0.32], [0.2, 0.1, 0.38], [-0.2, 0.1, 0.38]], false)

    // Wheels: octagons extruded across the axle, drawn far side first.
    const wheel = (wx: number, wy: number, r: number, w: number) => {
      const spin = params.carSpeed * clock * 0.02
      const pts: Array<[number, number]> = []
      for (let k = 0; k < 8; k++) {
        const a = spin + (k / 8) * Math.PI * 2
        pts.push([wy + Math.cos(a) * r, r + Math.sin(a) * r])
      }
      const outer = wx > 0 ? wx + w : wx - w
      const inner = wx > 0 ? wx : wx
      for (let k = 0; k < 8; k++) {
        const [ay, az] = pts[k]
        const [by, bz] = pts[(k + 1) % 8]
        carQuad(k % 2 === 0 ? tyre : css([27, 32, 37]), [
          [inner, ay, az], [inner, by, bz], [outer, by, bz], [outer, ay, az],
        ])
      }
      const face: Array<[number, number, number]> = pts.map(([py, pz]) => [outer, py, pz])
      carQuad(rim, face)
    }
    wheel(-0.44, 0.92, 0.2, -0.16)
    wheel(0.44, 0.92, 0.2, 0.16)
    wheel(-0.46, -0.66, 0.24, -0.2)
    wheel(0.46, -0.66, 0.24, 0.2)

    faces.sort((a, b) => b.depth - a.depth)
    ctx!.save()
    ctx!.globalAlpha = params.carAlpha
    for (const f of faces) {
      ctx!.fillStyle = f.color
      ctx!.beginPath()
      ctx!.moveTo(f.pts[0], f.pts[1])
      for (let i = 2; i < f.pts.length; i += 2) ctx!.lineTo(f.pts[i], f.pts[i + 1])
      ctx!.closePath()
      ctx!.fill()
    }
    drawCarLivery()
    ctx!.restore()
  }

  /** UNO 01 on the engine cover, mapped onto the projected top face. */
  function drawCarLivery() {
    const corners: Array<[number, number, number]> = [
      [-0.19, 0.12, 0.381],
      [0.19, 0.12, 0.381],
      [-0.19, -0.62, 0.381],
    ]
    const s: number[] = []
    for (const [lx, ly, lz] of corners) {
      carLocalToWorld(lx, ly, lz, tmpA)
      if (!cam.project(tmpA[0], tmpA[1], tmpA[2])) return
      s.push(cam.sx, cam.sy)
    }
    const w = Math.hypot(s[2] - s[0], s[3] - s[1])
    const h = Math.hypot(s[4] - s[0], s[5] - s[1])
    if (w < 18 || h < 18) return

    ctx!.save()
    ctx!.transform((s[2] - s[0]) / w, (s[3] - s[1]) / w, (s[4] - s[0]) / h, (s[5] - s[1]) / h, s[0], s[1])
    ctx!.fillStyle = css(PALETTE.backdrop)
    ctx!.textAlign = 'center'
    ctx!.textBaseline = 'middle'
    ctx!.font = `700 ${(w * 0.5).toFixed(1)}px Formula1, 'Plus Jakarta Sans', sans-serif`
    ctx!.fillText('UNO', w / 2, h * 0.3)
    ctx!.font = `700 ${(w * 0.42).toFixed(1)}px Formula1, 'Plus Jakarta Sans', sans-serif`
    ctx!.fillText('01', w / 2, h * 0.66)
    ctx!.restore()
  }

  // ------------------------------------------------------------ particles

  interface Puff { x: number; y: number; z: number; vx: number; vz: number; life: number; max: number }
  const puffs: Puff[] = []

  function spawnSmoke(t: number) {
    if (reduced || quality === 'low' || phase !== 'racing') return
    if (t < timeline.lightsOut || t > timeline.lightsOut + 700) return
    if (puffs.length > 16) return
    for (const side of [-1, 1]) {
      puffs.push({
        x: startX - 1.65 + side * (0.4 + Math.random() * 0.22),
        y: params.carY - 0.7 - Math.random() * 0.35,
        z: 0.08 + Math.random() * 0.1,
        vx: side * 0.0011 + (Math.random() - 0.5) * 0.0014,
        vz: 0.0007 + Math.random() * 0.0011,
        life: Math.random() * 120,
        max: 700 + Math.random() * 420,
      })
    }
  }

  function drawSmoke(dt: number) {
    if (!puffs.length) return
    ctx!.save()
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]
      p.life += dt
      if (p.life > p.max) {
        puffs.splice(i, 1)
        continue
      }
      p.x += p.vx * dt
      p.z += p.vz * dt
      p.y -= 0.0006 * dt
      const k = p.life / p.max
      if (!cam.project(p.x, p.y, p.z)) continue
      const r = (cam.focal / Math.max(cam.sd, 0.1)) * (0.1 + k * 0.62)
      ctx!.globalAlpha = Math.sin(Math.PI * k) * 0.14 * (1 - params.cleanT)
      ctx!.fillStyle = css(PALETTE.blueLight)
      ctx!.beginPath()
      ctx!.ellipse(cam.sx, cam.sy, r, r * 0.62, 0, 0, Math.PI * 2)
      ctx!.fill()
    }
    ctx!.restore()
  }

  /** Speed streaks in screen space, keyed off the car's projected position. */
  function drawStreaks() {
    if (reduced || params.carSpeed < 0.15 || params.carAlpha < 0.05) return
    carLocalToWorld(0, 0, 0.2, tmpA)
    if (!cam.project(tmpA[0], tmpA[1], tmpA[2])) return
    const ox = cam.sx
    const oy = cam.sy
    carLocalToWorld(0, -2.4, 0.2, tmpA)
    cam.project(tmpA[0], tmpA[1], tmpA[2])
    const dx = cam.sx - ox
    const dy = cam.sy - oy

    ctx!.save()
    ctx!.lineCap = 'round'
    for (let i = 0; i < 7; i++) {
      const off = ((i / 7) - 0.5) * 2
      const jitter = Math.sin(clock / 40 + i * 2.3)
      const t0 = 0.18 + (i % 3) * 0.16
      const t1 = t0 + 0.34
      ctx!.strokeStyle = css(PALETTE.blueLight, 0.13 * params.carSpeed * params.carAlpha)
      ctx!.lineWidth = 1.4
      ctx!.beginPath()
      ctx!.moveTo(ox + dx * t0 + off * 9 + jitter, oy + dy * t0)
      ctx!.lineTo(ox + dx * t1 + off * 11 + jitter, oy + dy * t1)
      ctx!.stroke()
    }
    ctx!.restore()
  }

  /**
   * Screen-space distance haze anchored to the ground-plane horizon. It gives the
   * low opening shot real depth for the cost of one gradient, and is fully gone by
   * the time the camera is overhead, so it never touches the settled code.
   */
  function drawDepthFog() {
    const strength = (1 - params.riseT) * 0.94
    if (strength <= 0.01) return
    const denom = cam.fx * cam.fx + cam.fy * cam.fy
    if (denom < 1e-4) return
    const horizon = cam.cy - (cam.focal * (cam.ux * cam.fx + cam.uy * cam.fy)) / denom
    const depth = vh * 0.66
    const bottom = horizon + depth
    if (bottom <= 0) return
    const g = ctx!.createLinearGradient(0, horizon - depth * 0.3, 0, bottom)
    g.addColorStop(0, css(PALETTE.backdrop, strength))
    g.addColorStop(0.42, css(PALETTE.backdrop, strength * 0.5))
    g.addColorStop(1, css(PALETTE.backdrop, 0))
    ctx!.fillStyle = g
    ctx!.fillRect(0, 0, vw, bottom)
  }

  /** Idle cue: a soft ring on the tarmac so the car reads as the thing to tap. */
  function drawIdleCue() {
    if (phase !== 'idle') return
    const pulse = (Math.sin(clock / 620) + 1) / 2
    const r = 1.15 + pulse * 0.22
    const cxw = startX - 1.65
    const cyw = params.carY
    ctx!.save()
    ctx!.strokeStyle = css(PALETTE.blueLight, 0.1 + pulse * 0.13)
    ctx!.lineWidth = Math.max(1.2, modulePx * 0.18)
    ctx!.beginPath()
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2
      if (!cam.project(cxw + Math.cos(a) * r, cyw + Math.sin(a) * r * 0.92, 0.01)) continue
      if (i === 0) ctx!.moveTo(cam.sx, cam.sy)
      else ctx!.lineTo(cam.sx, cam.sy)
    }
    ctx!.closePath()
    ctx!.stroke()
    ctx!.restore()
  }

  // ------------------------------------------------------------ settled QR

  /**
   * The finished code: the diorama's own ground, seen from directly overhead with
   * every block flattened. Same materials as the isometric view — asphalt modules
   * sitting on paving modules — drawn on whole pixels so no module edge is
   * anti-aliased. Nothing is recoloured; the code is the scene, not a picture of one.
   */
  function drawSettledQr() {
    // The plate keeps a soft shadow so it still reads as a physical model base
    // rather than an image. It falls outside the code, never across it.
    ctx!.save()
    ctx!.shadowColor = 'rgba(0,0,0,0.5)'
    ctx!.shadowBlur = Math.max(12, modulePx * 2.6)
    ctx!.shadowOffsetY = Math.max(4, modulePx * 0.9)
    ctx!.fillStyle = css(PALETTE.ground)
    ctx!.fillRect(cardX, cardY, cardSize, cardSize)
    ctx!.restore()

    // Batch by tone so the whole plate costs a handful of fills.
    const byTone = new Map<string, number[]>()
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const i = row * size + col
        const tone = world.dark[i] ? topColor(i) : groundColor(i)
        let cells = byTone.get(tone)
        if (!cells) byTone.set(tone, (cells = []))
        cells.push(qrX + col * modulePx, qrY + row * modulePx)
      }
    }
    for (const [tone, cells] of byTone) {
      ctx!.fillStyle = tone
      for (let k = 0; k < cells.length; k += 2) {
        ctx!.fillRect(cells[k], cells[k + 1], modulePx, modulePx)
      }
    }
  }

  // ------------------------------------------------------------ frame

  function render(t: number, dt: number) {
    computeParams(t)
    applyCamera(t)

    drawBackdrop()

    if (phase === 'qr') {
      drawSettledQr()
    } else {
      drawPlinth()
      drawPaving()
      drawApron()
      drawShadows(t)
      drawTrack(t)
      drawBarriers()
      drawDecor()
      drawDepthFog()
      drawGantry(t)
      spawnSmoke(t)
      drawSmoke(dt)
      drawIdleCue()
      drawCar()
      drawStreaks()
      drawTitleScrim()
    }

    carLocalToWorld(0, 0, 0.3, tmpA)
    const visible = cam.project(tmpA[0], tmpA[1], tmpA[2])
    frameInfo.phase = phase
    frameInfo.carX = cam.sx
    frameInfo.carY = cam.sy
    frameInfo.carVisible = visible && params.carAlpha > 0.3 && phase !== 'qr'
    frameInfo.progress = phase === 'qr' ? 1 : clamp01(t / timeline.end)
    options.onFrame?.(frameInfo)
  }

  function tick(stamp: number) {
    rafId = requestAnimationFrame(tick)
    const dt = lastStamp ? Math.min(stamp - lastStamp, 64) : 16
    lastStamp = stamp
    clock += dt

    if (phase === 'racing') {
      raceTime = stamp - launchedAt
      if (raceTime >= timeline.end) {
        raceTime = timeline.end
        phase = 'qr'
        options.onComplete?.()
      }
    } else if (phase === 'rewinding') {
      const p = clamp01((stamp - rewindStartedAt) / rewindDuration())
      raceTime = timeline.end * (1 - easeInOutCubic(p))
      if (p >= 1) {
        raceTime = 0
        phase = 'idle'
        options.onRewound?.()
      }
    }

    const t0 = performance.now()
    render(phase === 'idle' ? 0 : raceTime, dt)
    const cost = performance.now() - t0
    frameSamples++
    renderCost = frameSamples < 4 ? cost : renderCost * 0.9 + cost * 0.1

    // Give the device time to settle, then trim the scene if drawing is genuinely
    // expensive. One-way: re-upgrading would just oscillate.
    if (quality === 'high' && frameSamples > 45 && frameSamples % 20 === 0 && renderCost > 11) {
      quality = 'low'
      puffs.length = 0
      relayout()
    }

    // Nothing moves once the code has settled — stop burning battery.
    if (phase === 'qr') stop()
  }

  const rewindDuration = () => timeline.end * 0.62

  function relayout(): RaceLayoutMode {
    layout()
    if (!running) render(phase === 'idle' ? 0 : timeline.end, 16)
    return layoutMode
  }

  function start() {
    if (running) return
    running = true
    lastStamp = 0
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    if (!running) return
    running = false
    cancelAnimationFrame(rafId)
  }

  return {
    layout: relayout,
    start,
    stop,
    launch() {
      if (phase !== 'idle') return
      phase = 'racing'
      launchedAt = performance.now()
      raceTime = 0
      start()
    },
    /**
     * Runs the whole transformation backwards: the code lifts back into a
     * racetrack, the camera drops to the grid and the car reverses onto pole.
     * Quicker than the forward run, so it reads as a rewind rather than a replay.
     */
    rewind() {
      if (phase !== 'qr') return
      phase = 'rewinding'
      rewindStartedAt = performance.now()
      start()
    },
    /** Skip / fallback path: land on the finished code immediately. */
    finish() {
      phase = 'qr'
      raceTime = timeline.end
      computeParams(timeline.end)
      applyCamera(timeline.end)
      drawBackdrop()
      drawSettledQr()
      options.onComplete?.()
      stop()
    },
    setReducedMotion(value: boolean) {
      if (reduced === value) return
      reduced = value
      timeline = value ? REDUCED_TIMELINE : FULL_TIMELINE
      // The opening pitch changes with the preference, so the fit has to be redone.
      relayout()
    },
    get phase() {
      return phase
    },
    /** Exposed for tests: the settled code's pixel geometry. */
    get qrGeometry() {
      return { modulePx, qrX, qrY, cardX, cardY, cardSize, size }
    },
    /** Rolling draw cost in ms, and the quality tier it produced. */
    get stats() {
      return { renderCost, quality, frames: frameSamples }
    },
    destroy() {
      stop()
    },
  }
}

export type RaceRenderer = ReturnType<typeof createRaceRenderer>
