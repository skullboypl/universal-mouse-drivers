/**
 * Factory onboard flash dump - PRO X SUPERLIGHT gen1 (046D:C547).
 * Captured live after OMM restore defaults (2026-08-12).
 * Sector 0 = profile directory; 1-5 = profiles (255 B + CRC-16/CCITT BE).
 *
 * Buttons @32 (all profiles):
 *   80 01 00 01 | 80 01 00 02 | 80 01 00 04 | 80 01 00 08 | 80 01 00 10
 *   = Left / Right / Middle / Back / Forward (L+R are not remappable in OMM).
 *
 * Profiles 1,2,3,5: rate=1ms (1000Hz), defaultIdx=1, shiftIdx=0,
 *   DPI = 400/800/1600/3200/6400
 * Profile 4: only 2 DPI slots (400/800).
 */

export const SUPERLIGHT_FACTORY_SECTOR_SIZE = 255

/** Default button macros (L/R/M/Back/Forward) - never change L/R. */
export const SUPERLIGHT_FACTORY_BUTTON_MACROS: readonly Uint8Array[] = [
  new Uint8Array([0x80, 0x01, 0x00, 0x01]), // Left
  new Uint8Array([0x80, 0x01, 0x00, 0x02]), // Right
  new Uint8Array([0x80, 0x01, 0x00, 0x04]), // Middle
  new Uint8Array([0x80, 0x01, 0x00, 0x08]), // Back
  new Uint8Array([0x80, 0x01, 0x00, 0x10]), // Forward
]

const hex = (s: string): Uint8Array => {
  const clean = s.replace(/[^0-9a-fA-F]/g, "")
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}


const SECTOR_0_HEX =
  '0001010000020100000301000004010000050100ffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff62ae'

const SECTOR_1_HEX =
  '010100900120034006800c0019ffffffff00ffffffffffffffffffffffffffff' +
  '8001000180010002800100048001000880010010ffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffff0000000000001f400000000000000000' +
  '001f40000000ffffffffffffffffffffffffffffffffffffffffffffff519b'

const SECTOR_2_HEX =
  '010100900120034006800c0019ffffffff00ffffffffffffffffffffffffffff' +
  '8001000180010002800100048001000880010010ffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffff0000000000001f400000000000000000' +
  '001f40000000ffffffffffffffffffffffffffffffffffffffffffffff519b'

const SECTOR_3_HEX =
  '010100900120034006800c0019ffffffff00ffffffffffffffffffffffffffff' +
  '8001000180010002800100048001000880010010ffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffff0000000000001f400000000000000000' +
  '001f40000000ffffffffffffffffffffffffffffffffffffffffffffff519b'

const SECTOR_4_HEX =
  '01010090012003000000000000ffffffff00ffffffffffffffffffffffffffff' +
  '8001000180010002800100048001000880010010ffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffff0000000000001f400000000000000000' +
  '001f40000000ffffffffffffffffffffffffffffffffffffffffffffff607f'

const SECTOR_5_HEX =
  '010100900120034006800c0019ffffffff00ffffffffffffffffffffffffffff' +
  '8001000180010002800100048001000880010010ffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
  'ffffffffffffffffffffffffffffffff0000000000001f400000000000000000' +
  '001f40000000ffffffffffffffffffffffffffffffffffffffffffffff519b'

/** sectorIndex → factory bytes (includes CRC). */
export const SUPERLIGHT_FACTORY_SECTORS: ReadonlyMap<number, Uint8Array> = new Map([
  [0, hex(SECTOR_0_HEX)],
  [1, hex(SECTOR_1_HEX)],
  [2, hex(SECTOR_2_HEX)],
  [3, hex(SECTOR_3_HEX)],
  [4, hex(SECTOR_4_HEX)],
  [5, hex(SECTOR_5_HEX)],
])

export function getSuperlightFactorySector(sector: number): Uint8Array {
  const b = SUPERLIGHT_FACTORY_SECTORS.get(sector)
  if (!b) throw new Error(`No factory sector ${sector}`)
  return new Uint8Array(b)
}
