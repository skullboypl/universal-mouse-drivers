import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkHitsWriteGate,
  decodeButtonRecord,
  patchBunnyHop,
  patchButton,
  patchDpiProfile,
  patchProfileRate,
  readBunnyHop,
  readButtonRecord,
  readDpiProfile,
  readProfileRates,
  crc16CcittFalse,
  decodeOnboardProfilesInfo,
  patchHitsRecord,
  readHitsRecords,
  sectorCrcIsValid,
  X3_HITS_COMPONENT,
  decodeHitsCapabilities,
  decodeHitsButtonConfig,
  decodeX3ExtendedDpi,
  decodeX3ExtendedReportRate,
  decodeX3UnifiedBatteryStatus,
  findAnalogButtonBlockOffset,
  findExactHitsBlock,
  findValidatedHitsBlock,
  hitsUiMax,
  packHitsButton,
  resolveX3Variant,
  unpackHitsButton,
} from './protocol'

test('decodes X3 extended DPI and LOD without inventing missing fields', () => {
  assert.deepEqual(
    decodeX3ExtendedDpi(Uint8Array.of(0, 0x06, 0x40, 0x03, 0x20, 0x06, 0x40, 0x03, 0x20, 2)),
    { sensorIndex: 0, dpiX: 1600, dpiY: 1600, lodLevel: 2 },
  )
  assert.deepEqual(decodeX3ExtendedDpi(Uint8Array.of(0)), {
    sensorIndex: 0,
    dpiX: null,
    dpiY: null,
    lodLevel: null,
  })
})

test('maps X3 extended report-rate index and rejects unknown indexes', () => {
  assert.equal(decodeX3ExtendedReportRate(Uint8Array.of(6)), 8000)
  assert.equal(decodeX3ExtendedReportRate(Uint8Array.of(7)), null)
})

test('decodes discharging Unified Battery response', () => {
  assert.deepEqual(decodeX3UnifiedBatteryStatus(Uint8Array.of(73, 50, 0)), {
    percent: 73,
    nextLevel: 50,
    statusCode: 0,
    state: 'discharging',
    charging: false,
  })
})

test('decodes charging and full states', () => {
  assert.equal(decodeX3UnifiedBatteryStatus(Uint8Array.of(41, 20, 1)).state, 'charging')
  assert.equal(decodeX3UnifiedBatteryStatus(Uint8Array.of(100, 100, 2)).state, 'full')
})

test('rejects impossible percentages and never guesses an unknown color', () => {
  assert.equal(decodeX3UnifiedBatteryStatus(Uint8Array.of(255, 0, 0)).percent, null)
  assert.equal(resolveX3Variant('C0A9'), 'unknown')
})

test('decodes HITS capabilities from a confirmed physical response (00 03 28 14 14)', () => {
  assert.deepEqual(decodeHitsCapabilities(Uint8Array.of(0x00, 0x03, 0x28, 0x14, 0x14)), {
    leftPresent: true,
    rightPresent: true,
    actuationMax: 40,
    hapticsMax: 20,
    rapidTriggerMax: 20,
  })
})

test('decodes direct HITS config ground truth 1/on/2/2', () => {
  assert.deepEqual(decodeHitsButtonConfig(Uint8Array.of(0, 0x04, 0x09, 0x08)), {
    buttonIndex: 0,
    actuationPoint: 1,
    rapidTriggerEnabled: true,
    rapidTriggerSensitivity: 2,
    hapticLevel: 2,
  })
  assert.equal(decodeHitsButtonConfig(Uint8Array.of(0, 0x05, 0x09, 0x08)), null)
})

test('maps raw quarter-step capability resolutions to the OMM UI scale', () => {
  assert.equal(hitsUiMax(40), 10)
  assert.equal(hitsUiMax(20), 5)
})

test('finds only one exact two-button HITS block', () => {
  const setting = { actuationPoint: 1, rapidTriggerEnabled: true, rapidTriggerSensitivity: 2, hapticLevel: 2 }
  const sector = new Uint8Array(32)
  sector.set([...packHitsButton(setting), ...packHitsButton(setting)], 17)
  assert.equal(findExactHitsBlock(sector, setting, setting), 17)
  sector.set([...packHitsButton(setting), ...packHitsButton(setting)], 2)
  assert.equal(findExactHitsBlock(sector, setting, setting), null)
})

test('rejects the physical 14 08 0c range match without component metadata', () => {
  const sector = new Uint8Array(255).fill(0xff)
  sector.set([0x14, 0x08, 0x0c, 0x14, 0x08, 0x0c], 0x26)
  assert.equal(findValidatedHitsBlock(sector, 10, 5, 5), null)
})

test('accepts two records only at an explicit component 0x19 descriptor', () => {
  const sector = new Uint8Array(255).fill(0xff)
  const expected = { actuationPoint: 1, rapidTriggerEnabled: false, rapidTriggerSensitivity: 2, hapticLevel: 2 }
  sector.set([...packHitsButton(expected), ...packHitsButton(expected)], 0x30)
  assert.equal(findValidatedHitsBlock(sector, 10, 5, 5, {
    componentId: 0x19,
    offset: 0x30,
    analogButtonCount: 2,
  }), 0x30)
  assert.deepEqual(unpackHitsButton(sector, 0x30), expected)
})

test('packs and round-trips a HITS button setting through the confirmed byte layout', () => {
  const setting = {
    actuationPoint: 12,
    rapidTriggerEnabled: true,
    rapidTriggerSensitivity: 9,
    hapticLevel: 5,
  }
  const packed = packHitsButton(setting)
  assert.deepEqual(packed, [12 << 2, 1 | (9 << 2), 5 << 2])
  const bytes = Uint8Array.of(0xaa, ...packed, 0xbb)
  assert.deepEqual(unpackHitsButton(bytes, 1), setting)
})

test('finds the analog_buttons byte offset only for a single, encoding-consistent diff', () => {
  const before = new Uint8Array(64)
  const after = new Uint8Array(64)
  after[40] = before[40]! + 4 * 3 // one actuation step (value << 2)
  const candidates = findAnalogButtonBlockOffset(before, after)
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0]!.offset, 40)
  assert.equal(candidates[0]!.confidence, 1)
})

test('refuses an offset when the byte delta is not a multiple of 4', () => {
  const before = new Uint8Array(64)
  const after = new Uint8Array(64)
  after[10] = 3 // inconsistent with the confirmed "value << 2" encoding
  assert.deepEqual(findAnalogButtonBlockOffset(before, after), [])
})

test('refuses an offset when more than one byte changed between dumps', () => {
  const before = new Uint8Array(64)
  const after = new Uint8Array(64)
  after[20] = 8
  after[21] = 4
  assert.deepEqual(findAnalogButtonBlockOffset(before, after), [])
})

// --- profile format 8 layout + safe sector patching (native-derived) ---

const LIMITS = { actuationMax: 40, rapidTriggerMax: 20, hapticsMax: 20 }

function makeProfileSector(size = 255): Uint8Array {
  const sector = new Uint8Array(size)
  const [a0, a1, a2] = [5 << 2, 1 | (2 << 2), 3 << 2]
  sector.set([a0, a1, a2, 10 << 2, 2 << 2, 4 << 2], X3_HITS_COMPONENT.offset)
  const crc = crc16CcittFalse(sector.subarray(0, size - 2))
  sector[size - 2] = crc >> 8
  sector[size - 1] = crc & 0xff
  return sector
}

const INFO_FORMAT_8 = decodeOnboardProfilesInfo(Uint8Array.of(1, 8, 1, 5, 0, 5, 5, 0x00, 0xff))

test('crc16CcittFalse matches the standard check value used by OMM native code', () => {
  assert.equal(crc16CcittFalse(new TextEncoder().encode('123456789')), 0x29b1)
})

test('X3 HITS component sits at 0x26 with two 3-byte records (native builder, format 8)', () => {
  assert.deepEqual(X3_HITS_COMPONENT, { componentId: 0x19, offset: 0x26, recordSize: 3, count: 2 })
  assert.deepEqual(INFO_FORMAT_8, {
    memoryModel: 1, profileFormat: 8, macroFormat: 1, profileCount: 5,
    buttonCount: 5, sectorCount: 5, sectorSize: 255,
  })
})

test('a well-formed format-8 sector passes the write gate and decodes both records', () => {
  const sector = makeProfileSector()
  assert.equal(sectorCrcIsValid(sector), true)
  assert.deepEqual(checkHitsWriteGate(INFO_FORMAT_8, sector, LIMITS), { ok: true })
  const [left, right] = readHitsRecords(sector)
  assert.deepEqual(left, { actuationPoint: 5, rapidTriggerEnabled: true, rapidTriggerSensitivity: 2, hapticLevel: 3 })
  assert.deepEqual(right, { actuationPoint: 10, rapidTriggerEnabled: false, rapidTriggerSensitivity: 2, hapticLevel: 4 })
})

test('write gate refuses other profile formats, bad CRC and malformed component bytes', () => {
  const sector = makeProfileSector()
  assert.equal(checkHitsWriteGate({ ...INFO_FORMAT_8, profileFormat: 7 }, sector, LIMITS).ok, false)
  const badCrc = new Uint8Array(sector); badCrc[100] ^= 0xff
  assert.equal(checkHitsWriteGate(INFO_FORMAT_8, badCrc, LIMITS).ok, false)
  const badBits = new Uint8Array(sector); badBits[X3_HITS_COMPONENT.offset] |= 0x01
  const crc = crc16CcittFalse(badBits.subarray(0, 253)); badBits[253] = crc >> 8; badBits[254] = crc & 0xff
  assert.equal(checkHitsWriteGate(INFO_FORMAT_8, badBits, LIMITS).ok, false)
})

test('patchHitsRecord changes only one 3-byte record and keeps a valid CRC', () => {
  const sector = makeProfileSector()
  const next = patchHitsRecord(sector, 1, {
    actuationPoint: 7, rapidTriggerEnabled: true, rapidTriggerSensitivity: 3, hapticLevel: 6,
  })
  assert.equal(sectorCrcIsValid(next), true)
  const changed: number[] = []
  for (let i = 0; i < sector.length - 2; i++) if (sector[i] !== next[i]) changed.push(i)
  assert.deepEqual(changed, [0x29, 0x2a, 0x2b])
  assert.deepEqual(readHitsRecords(next)[0], readHitsRecords(sector)[0])
  assert.deepEqual(readHitsRecords(next)[1], {
    actuationPoint: 7, rapidTriggerEnabled: true, rapidTriggerSensitivity: 3, hapticLevel: 6,
  })
  assert.throws(() => patchHitsRecord(sector, 2, readHitsRecords(sector)[0]!))
})

// --- real sectors captured from a physical X3 (dev log, 2026-09-28) ---

const hexToBytes = (hex: string) => Uint8Array.from(hex.match(/../g)!.map((h) => parseInt(h, 16)))
const ROM_PROFILE = hexToBytes('030300002003200302b004b0040240064006026009600902800c800c0200000000ff00ffffff14080c14080c3c002c018001000180010002800100048001000880010010ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0300000000001f400000000300000000001f400000000300000000001f403200000300000000001f4032000003ffff')
const G_HUB_FLASH_PROFILE = hexToBytes('030300002003200302000000000000000000000000000000000000000000000000ff00ffff000409080409083c002c018001000180010002800100048001000880010010ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0300000000001f400000000300000000001f400000000300000000001f403200000300000000001f40320000031a8a')

test('decodes every component of the factory ROM profile exactly', () => {
  assert.deepEqual(readProfileRates(ROM_PROFILE), { wireless: 1000, wired: 1000 })
  const dpi = readDpiProfile(ROM_PROFILE)
  assert.deepEqual(dpi.stages.map((s) => [s.dpiX, s.dpiY, s.lod]), [
    [800, 800, 2], [1200, 1200, 2], [1600, 1600, 2], [2400, 2400, 2], [3200, 3200, 2],
  ])
  assert.equal(dpi.defaultIndex, 0)
  assert.equal(dpi.shiftIndex, 0)
  assert.deepEqual(readBunnyHop(ROM_PROFILE), { enabled: false, timeoutMs: 100 })
  assert.deepEqual(readHitsRecords(ROM_PROFILE), [
    { actuationPoint: 5, rapidTriggerEnabled: false, rapidTriggerSensitivity: 2, hapticLevel: 3 },
    { actuationPoint: 5, rapidTriggerEnabled: false, rapidTriggerSensitivity: 2, hapticLevel: 3 },
  ])
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((i) => decodeButtonRecord(readButtonRecord(ROM_PROFILE, i))),
    ['left', 'right', 'middle', 'back', 'forward'],
  )
})

test('the flash profile G HUB wrote has a valid CRC, disabled DPI slots and HITS 1/on/2/2', () => {
  assert.equal(sectorCrcIsValid(G_HUB_FLASH_PROFILE), true)
  assert.equal(sectorCrcIsValid(ROM_PROFILE), false)
  const dpi = readDpiProfile(G_HUB_FLASH_PROFILE)
  assert.deepEqual(dpi.stages[0], { dpiX: 800, dpiY: 800, lod: 2 })
  assert.deepEqual(dpi.stages.slice(1), Array(4).fill({ dpiX: 0, dpiY: 0, lod: 0 }))
  assert.deepEqual(readHitsRecords(G_HUB_FLASH_PROFILE)[0], {
    actuationPoint: 1, rapidTriggerEnabled: true, rapidTriggerSensitivity: 2, hapticLevel: 2,
  })
  assert.deepEqual(checkHitsWriteGate(INFO_FORMAT_8, G_HUB_FLASH_PROFILE, LIMITS), { ok: true })
})

test('patches keep the CRC valid and touch only their own bytes', () => {
  const touched = (a: Uint8Array, b: Uint8Array) => {
    const out: number[] = []
    for (let i = 0; i < a.length - 2; i++) if (a[i] !== b[i]) out.push(i)
    return out
  }
  const rate = patchProfileRate(G_HUB_FLASH_PROFILE, 'wired', 8000)
  assert.equal(sectorCrcIsValid(rate), true)
  assert.deepEqual(touched(G_HUB_FLASH_PROFILE, rate), [1])
  assert.deepEqual(readProfileRates(rate), { wireless: 1000, wired: 8000 })

  const bhop = patchBunnyHop(G_HUB_FLASH_PROFILE, { enabled: true, timeoutMs: 250 })
  assert.equal(sectorCrcIsValid(bhop), true)
  assert.deepEqual(touched(G_HUB_FLASH_PROFILE, bhop), [0x25])
  assert.deepEqual(readBunnyHop(bhop), { enabled: true, timeoutMs: 250 })

  const button = patchButton(G_HUB_FLASH_PROFILE, 3, 'media_vol_up')
  assert.equal(sectorCrcIsValid(button), true)
  assert.deepEqual(touched(G_HUB_FLASH_PROFILE, button), [0x3d, 0x3f])
  assert.equal(decodeButtonRecord(readButtonRecord(button, 3)), 'media_vol_up')
  assert.equal(decodeButtonRecord(readButtonRecord(button, 4)), 'forward')

  const dpi = readDpiProfile(G_HUB_FLASH_PROFILE)
  dpi.stages[1] = { dpiX: 1600, dpiY: 1600, lod: 2 }
  dpi.shiftIndex = 1
  const withDpi = patchDpiProfile(G_HUB_FLASH_PROFILE, dpi)
  assert.equal(sectorCrcIsValid(withDpi), true)
  assert.deepEqual(readDpiProfile(withDpi).stages[1], { dpiX: 1600, dpiY: 1600, lod: 2 })
  assert.equal(readDpiProfile(withDpi).shiftIndex, 1)
  assert.deepEqual(readHitsRecords(withDpi), readHitsRecords(G_HUB_FLASH_PROFILE))
})

test('DPI and button patches refuse inputs the device format cannot hold', () => {
  const dpi = readDpiProfile(G_HUB_FLASH_PROFILE)
  assert.throws(() => patchDpiProfile(G_HUB_FLASH_PROFILE, { ...dpi, defaultIndex: 3 }), /enabled stages/)
  assert.throws(() => patchDpiProfile(G_HUB_FLASH_PROFILE, { ...dpi, stages: [{ dpiX: 800, dpiY: 800, lod: 9 }, ...dpi.stages.slice(1)] }), /LOD/)
  assert.throws(() => patchProfileRate(G_HUB_FLASH_PROFILE, 'wired', 3000), /Unsupported/)
  assert.throws(() => patchButton(G_HUB_FLASH_PROFILE, 12, 'left'), /out of range/)
})
