import type { QRCodeErrorCorrectionLevel } from 'qrcode'

/**
 * The link the /race QR code encodes.
 *
 * Change it here, or leave the source alone and set NUXT_PUBLIC_RACE_QR_URL
 * (wired up in nuxt.config.ts -> runtimeConfig.public.raceQrUrl).
 */
export const RACE_QR_DEFAULT_TARGET = 'https://unosfirst.com/cam'

/**
 * Recovery level. 'M' keeps the default URL at version 2 (a 25x25 matrix), which
 * means chunky modules on a phone screen. Chunky beats dense for scan reliability.
 */
export const RACE_QR_ERROR_CORRECTION: QRCodeErrorCorrectionLevel = 'M'

/** Light modules around the symbol. The QR spec minimum is 4; we render 5. */
export const RACE_QR_QUIET_ZONE = 5

/** Above this the modules get too small to scan comfortably at phone size. */
export const RACE_QR_MAX_SIZE = 41

export interface QrMatrix {
  size: number
  version: number
  /** Row-major, 1 = dark. Length is size * size. */
  bits: Uint8Array
  isDark: (col: number, row: number) => boolean
}

/**
 * Build the QR matrix that drives the whole scene. Everything downstream — the
 * track layout, where the car launches from, the final flat code — is derived
 * from this, so the race world can never drift out of sync with the real code.
 */
export async function createQrMatrix(
  text: string,
  ecc: QRCodeErrorCorrectionLevel = RACE_QR_ERROR_CORRECTION,
): Promise<QrMatrix> {
  const QRCode = (await import('qrcode')).default
  const { modules, version } = QRCode.create(text, { errorCorrectionLevel: ecc })
  const size = modules.size

  if (size > RACE_QR_MAX_SIZE) {
    throw new Error(`QR target is too long: ${size}x${size} modules (max ${RACE_QR_MAX_SIZE}).`)
  }

  // `qrcode` stores the matrix row-major and its get() takes (row, col).
  const bits = new Uint8Array(size * size)
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      bits[row * size + col] = modules.data[row * size + col] ? 1 : 0
    }
  }

  return {
    size,
    version,
    bits,
    isDark: (col, row) =>
      col >= 0 && row >= 0 && col < size && row < size && bits[row * size + col] === 1,
  }
}

export interface QrSvgOptions {
  /** Light modules around the symbol. 4 is the spec minimum and plenty in print. */
  quietZone?: number
  /** Physical size of the whole plate, including the quiet zone. */
  millimetres?: number
  /** Written into <title> so the file says what it encodes. */
  label?: string
}

/**
 * A plain black-on-white SVG of the code — no race styling — sized in real
 * millimetres so it arrives at the right scale in CAD.
 *
 * Shaped for 3D printing:
 *  - vector, so it extrudes cleanly at any size instead of being resampled;
 *  - plate and modules are separate groups, so they can be extruded to different
 *    heights (raised code on a base) without reselecting geometry;
 *  - horizontally adjacent modules are merged into single rectangles, which cuts
 *    the entity count sharply and removes coincident edges that some CAD tools
 *    object to on extrude.
 */
export function qrMatrixToSvg(matrix: QrMatrix, options: QrSvgOptions = {}) {
  const quiet = options.quietZone ?? 4
  const mm = options.millimetres ?? 100
  const cells = matrix.size + quiet * 2

  const rects: string[] = []
  for (let row = 0; row < matrix.size; row++) {
    let runStart = -1
    for (let col = 0; col <= matrix.size; col++) {
      const dark = col < matrix.size && matrix.isDark(col, row)
      if (dark && runStart < 0) runStart = col
      if (!dark && runStart >= 0) {
        rects.push(
          `<rect x="${runStart + quiet}" y="${row + quiet}" width="${col - runStart}" height="1"/>`,
        )
        runStart = -1
      }
    }
  }

  const title = options.label ? `<title>${options.label.replace(/[<>&]/g, '')}</title>\n` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${mm}mm" height="${mm}mm" viewBox="0 0 ${cells} ${cells}" shape-rendering="crispEdges">
${title}<g id="plate"><rect width="${cells}" height="${cells}" fill="#ffffff"/></g>
<g id="modules" fill="#000000">
${rects.join('\n')}
</g>
</svg>
`
}
