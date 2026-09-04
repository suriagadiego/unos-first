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
