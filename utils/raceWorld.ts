import type { QrMatrix } from './raceQr'

/**
 * Turns a QR matrix into a miniature circuit.
 *
 * Nothing here invents geometry: every raised block is a dark module, every
 * kerb sits on a real module boundary, and the flatten order is measured from
 * the launch column. When the scene flattens it lands back on the same grid it
 * started from, which is what sells "the racetrack was the QR code".
 */

// Cell roles, derived from the module's structural position in the symbol.
export const CELL_GROUND = 0
/** Ordinary dark module -> a section of asphalt. */
export const CELL_TRACK = 1
/** Timing pattern (row 6 / col 6) -> the dashed sector-timing strips. */
export const CELL_TIMING = 2
/** Finder pattern outer ring -> grandstand / barrier complex at each corner. */
export const CELL_FINDER_RING = 3
/** Finder pattern core -> podium block. */
export const CELL_FINDER_CORE = 4
/** Alignment pattern -> the hairpin marker island. */
export const CELL_ALIGN = 5

export const SIDE_N = 1
export const SIDE_E = 2
export const SIDE_S = 4
export const SIDE_W = 8

/** Extrusion height per role, in module widths. */
export const CELL_HEIGHT: Record<number, number> = {
  [CELL_GROUND]: 0,
  [CELL_TRACK]: 0.34,
  [CELL_TIMING]: 0.38,
  [CELL_FINDER_RING]: 0.82,
  [CELL_FINDER_CORE]: 0.56,
  [CELL_ALIGN]: 0.52,
}

/** Number of distinct tones the materials are cast in. */
export const TONE_COUNT = 5

export const LANE_NONE = 0
export const LANE_VERTICAL = 1
export const LANE_HORIZONTAL = 2

export interface DecorItem {
  /** Stacked tyres sit in the run-off; cones mark the pit entry. */
  kind: 'tyres' | 'cone'
  /** World coordinates, module units, origin at board centre. */
  x: number
  y: number
  size: number
}

export interface RaceWorld {
  size: number
  version: number
  dark: Uint8Array
  kind: Uint8Array
  height: Float32Array
  /** 0..4 — tone index, so track and paving read as separately cast sections. */
  shade: Uint8Array
  /** Bitmask of sides whose neighbour is light or off-board. */
  open: Uint8Array
  /** Subset of `open` that earns a red/cream kerb (long boundaries only). */
  kerb: Uint8Array
  lane: Uint8Array
  /** 0..1 flatten order, measured outward from the launch point. */
  wave: Float32Array
  /** Column the car launches along — the one with the most asphalt to drive over. */
  startCol: number
  decor: DecorItem[]
}

function hash2(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** World X of a column centre (board centred on the origin). */
export function colToX(col: number, size: number) {
  return col - (size - 1) / 2
}

/** World Y of a row centre. Row 0 is the far (north) edge. */
export function rowToY(row: number, size: number) {
  return (size - 1) / 2 - row
}

function inFinder(col: number, row: number, size: number) {
  const zones = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ]
  for (const [zc, zr] of zones) {
    if (col >= zc && col < zc + 7 && row >= zr && row < zr + 7) {
      const dc = Math.max(Math.abs(col - (zc + 3)), Math.abs(row - (zr + 3)))
      // ring = the outer 7x7 border, core = the centre 3x3
      return dc === 3 ? CELL_FINDER_RING : dc <= 1 ? CELL_FINDER_CORE : CELL_GROUND
    }
  }
  return null
}

/**
 * Alignment patterns are 5x5: a solid ring with a single dark centre. Detected by
 * shape rather than by version table so any target URL works.
 */
function findAlignmentCells(m: QrMatrix) {
  const { size, isDark } = m
  const cells = new Set<number>()
  for (let row = 2; row < size - 2; row++) {
    for (let col = 2; col < size - 2; col++) {
      if (inFinder(col, row, size) !== null) continue
      let match = true
      for (let dr = -2; dr <= 2 && match; dr++) {
        for (let dc = -2; dc <= 2 && match; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc))
          const expected = ring !== 1
          if (isDark(col + dc, row + dr) !== expected) match = false
        }
      }
      if (!match) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (isDark(col + dc, row + dr)) cells.add((row + dr) * size + (col + dc))
        }
      }
    }
  }
  return cells
}

export function buildRaceWorld(matrix: QrMatrix): RaceWorld {
  const { size, version, isDark } = matrix
  const n = size * size

  const dark = new Uint8Array(n)
  const kind = new Uint8Array(n)
  const height = new Float32Array(n)
  const shade = new Uint8Array(n)
  const open = new Uint8Array(n)
  const kerb = new Uint8Array(n)
  const lane = new Uint8Array(n)
  const wave = new Float32Array(n)

  const alignment = findAlignmentCells(matrix)

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const i = row * size + col
      // Every module gets a tone, light ones included: from overhead the paving
      // slabs are the code's light modules, so they need the same variation.
      shade[i] = Math.floor(hash2(col, row) * TONE_COUNT)
      if (!isDark(col, row)) continue
      dark[i] = 1

      const finder = inFinder(col, row, size)
      kind[i] =
        finder === CELL_FINDER_RING || finder === CELL_FINDER_CORE
          ? finder
          : alignment.has(i)
            ? CELL_ALIGN
            : row === 6 || col === 6
              ? CELL_TIMING
              : CELL_TRACK

      height[i] = CELL_HEIGHT[kind[i]]
    }
  }

  // Which sides face open ground.
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const i = row * size + col
      if (!dark[i]) continue
      let o = 0
      if (!isDark(col, row - 1)) o |= SIDE_N
      if (!isDark(col + 1, row)) o |= SIDE_E
      if (!isDark(col, row + 1)) o |= SIDE_S
      if (!isDark(col - 1, row)) o |= SIDE_W
      open[i] = o

      // A module with asphalt on both opposite sides is a through-lane: it gets
      // a dashed centre line.
      if (kind[i] === CELL_TRACK) {
        if (!(o & SIDE_N) && !(o & SIDE_S)) lane[i] = LANE_VERTICAL
        else if (!(o & SIDE_E) && !(o & SIDE_W)) lane[i] = LANE_HORIZONTAL
      }
    }
  }

  // Kerbs only stripe boundaries that run for at least KERB_MIN_RUN modules, and
  // only on plain asphalt — the finder / alignment / timing structures are track
  // architecture, and get their own cream capping instead.
  const KERB_MIN_RUN = 3
  const kerbable = (i: number) => dark[i] && kind[i] === CELL_TRACK
  const markRun = (indices: number[], side: number) => {
    if (indices.length >= KERB_MIN_RUN) for (const i of indices) kerb[i] |= side
  }
  for (const side of [SIDE_N, SIDE_S]) {
    for (let row = 0; row < size; row++) {
      let run: number[] = []
      for (let col = 0; col <= size; col++) {
        const i = row * size + col
        if (col < size && kerbable(i) && open[i] & side) run.push(i)
        else {
          markRun(run, side)
          run = []
        }
      }
    }
  }
  for (const side of [SIDE_E, SIDE_W]) {
    for (let col = 0; col < size; col++) {
      let run: number[] = []
      for (let row = 0; row <= size; row++) {
        const i = row * size + col
        if (row < size && kerbable(i) && open[i] & side) run.push(i)
        else {
          markRun(run, side)
          run = []
        }
      }
    }
  }

  // Launch column: the middle third column carrying the most asphalt, so the car
  // spends its run actually driving on track.
  const lo = Math.floor(size / 3)
  const hi = Math.ceil((size * 2) / 3)
  let startCol = Math.floor(size / 2)
  let best = -1
  for (let col = lo; col < hi; col++) {
    let count = 0
    for (let row = 0; row < size; row++) if (dark[row * size + col]) count++
    if (count > best) {
      best = count
      startCol = col
    }
  }

  // Flatten order: an expanding front that follows the car north and spreads out
  // sideways, so the track appears to be ironed flat in the car's wake.
  let maxD = 1
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const d = size - 1 - row + Math.abs(col - startCol) * 0.55
      wave[row * size + col] = d
      if (d > maxD) maxD = d
    }
  }
  for (let i = 0; i < n; i++) wave[i] /= maxD

  return {
    size,
    version,
    dark,
    kind,
    height,
    shade,
    open,
    kerb,
    lane,
    wave,
    startCol,
    decor: buildDecor(matrix, dark, startCol),
  }
}

/**
 * Sparse set dressing. Tyre stacks tuck into the run-off beside the corner
 * complexes; cones mark the pit entry either side of the launch column.
 */
function buildDecor(matrix: QrMatrix, dark: Uint8Array, startCol: number): DecorItem[] {
  const { size } = matrix
  const items: DecorItem[] = []
  const half = (size - 1) / 2

  const corners: Array<[number, number]> = [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ]
  for (const [cc, cr] of corners) {
    const dx = cc < half ? -1 : 1
    const dy = cr < half ? 1 : -1
    items.push({
      kind: 'tyres',
      x: cc - half + dx * 4.6,
      y: half - cr + dy * 4.6,
      size: 0.42,
    })
  }

  // Free ground pockets ringed by asphalt read as protected run-off.
  let placed = 0
  for (let row = 2; row < size - 2 && placed < 5; row += 3) {
    for (let col = 2; col < size - 2 && placed < 5; col += 4) {
      const i = row * size + col
      if (dark[i]) continue
      if (Math.abs(col - startCol) < 2) continue
      let touching = 0
      if (dark[i - size]) touching++
      if (dark[i + size]) touching++
      if (dark[i - 1]) touching++
      if (dark[i + 1]) touching++
      if (touching < 3) continue
      items.push({ kind: 'tyres', x: colToX(col, size), y: rowToY(row, size), size: 0.3 })
      placed++
    }
  }

  // Cones mark the edges of the pit spur, clear of the racing line.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      items.push({
        kind: 'cone',
        x: colToX(startCol, size) + side * 3.9,
        y: -half - 2.2 - k * 3.4,
        size: 0.13,
      })
    }
  }

  return items
}
