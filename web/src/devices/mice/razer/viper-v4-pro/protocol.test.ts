import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRazerV4Report,
  decodeBatteryPercent,
  decodeButtonAssignment,
  decodeDongleLeds,
  decodeRazerV4DpiState,
  decodeRazerV4PollingCode,
  encodeAngleTune,
  encodeButtonAssignment,
  encodeDongleLeds,
  encodeDynSensMode,
  encodeDynSensState,
  encodeLiftSetting,
  encodeProximityConfiguration,
  encodeProximitySensorState,
  dynModeIdToWire,
  decodeAngleTune,
  encodeKeyboardButtonMapping,
  encodeLowPowerPercent,
  encodeMouseButtonMapping,
  encodeRazerV4DpiWriteArgs,
  encodeRazerV4PollingCode,
  isValidViperV4Dpi,
  normalizeViperV4Dpi,
  razerV4Crc,
  VIPER_V4_BUTTON_IDS,
  VIPER_V4_DPI_FN,
  VIPER_V4_MOUSE_FN,
  VIPER_V4_REPORT_LENGTH,
  VIPER_V4_STATUS_OK,
} from './protocol'

test('CRC covers bytes 2..87 and lands at offset 88', () => {
  const report = buildRazerV4Report(0x00, 0xc0, 2, Uint8Array.of(1))
  assert.equal(report.length, VIPER_V4_REPORT_LENGTH)
  assert.equal(report[1], 0x1f)
  assert.equal(report[5], 2)
  assert.equal(report[6], 0x00)
  assert.equal(report[7], 0xc0)
  assert.equal(report[8], 1)
  assert.equal(report[88], razerV4Crc(report))
})

test('polling codes round-trip for every supported rate', () => {
  for (const rate of [125, 500, 1000, 2000, 4000, 8000]) {
    const code = encodeRazerV4PollingCode(rate)
    assert.ok(code != null)
    assert.equal(decodeRazerV4PollingCode(code!), rate)
  }
  assert.equal(decodeRazerV4PollingCode(0xff), null)
  assert.equal(encodeRazerV4PollingCode(250), null)
})

test('DPI normalize snaps to 50-DPI grid and clamps', () => {
  assert.equal(normalizeViperV4Dpi(803), 800)
  assert.equal(normalizeViperV4Dpi(50), 100)
  assert.equal(normalizeViperV4Dpi(99_999), 50_000)
  assert.equal(isValidViperV4Dpi(1600), true)
  assert.equal(isValidViperV4Dpi(1601), false)
})

test('decodes multi-stage DPI payload from Synapse-shaped args', () => {
  // activeStage=2 (1-based byte=2), count=3, stages 800/800, 1600/1600, 3200/3100
  const args = new Uint8Array(3 + 3 * 7)
  args[1] = 2
  args[2] = 3
  const stages = [
    { x: 800, y: 800 },
    { x: 1600, y: 1600 },
    { x: 3200, y: 3100 },
  ]
  stages.forEach((stage, index) => {
    const offset = 3 + index * 7
    args[offset] = index
    args[offset + 1] = stage.x >> 8
    args[offset + 2] = stage.x & 0xff
    args[offset + 3] = stage.y >> 8
    args[offset + 4] = stage.y & 0xff
  })
  const decoded = decodeRazerV4DpiState(args)
  assert.equal(decoded.activeStage, 1)
  assert.deepEqual(decoded.stages, stages)

  const encoded = encodeRazerV4DpiWriteArgs(decoded)
  assert.equal(encoded[0], 1)
  assert.equal(encoded[1], 2)
  assert.equal(encoded[2], 3)
  assert.deepEqual(decodeRazerV4DpiState(encoded).stages, stages)
})

test('battery percent maps 0..255 onto 0..100', () => {
  assert.equal(decodeBatteryPercent(0), 0)
  assert.equal(decodeBatteryPercent(255), 100)
  assert.equal(decodeBatteryPercent(128), 50)
})

test('OK status constant stays 0x02 (Synapse settled response)', () => {
  assert.equal(VIPER_V4_STATUS_OK, 0x02)
})

test('low-power percent uses Synapse round-half-up bytes from pcaps', () => {
  assert.equal(encodeLowPowerPercent(5), 0x0d)
  assert.equal(encodeLowPowerPercent(25), 0x40)
  assert.equal(encodeLowPowerPercent(50), 0x80)
  assert.equal(encodeLowPowerPercent(100), 0xff)
})

test('dongle LED triple round-trips', () => {
  const leds = decodeDongleLeds(Uint8Array.of(0x02, 0x01, 0x03))
  assert.deepEqual(leds, [2, 1, 3])
  assert.deepEqual([...encodeDongleLeds(leds)], [2, 1, 3])
})

test('keyboard button mapping matches Forward→F capture shape', () => {
  const args = encodeKeyboardButtonMapping(VIPER_V4_BUTTON_IDS.forward, 0x09)
  assert.equal(args.length, 10)
  assert.deepEqual(
    [...args],
    [0x01, 0x05, 0x00, 0x02, 0x02, 0x00, 0x09, 0x00, 0x00, 0x00],
  )
  const decoded = decodeButtonAssignment(args)
  assert.equal(decoded.buttonId, VIPER_V4_BUTTON_IDS.forward)
  assert.equal(decoded.hypershift, false)
  assert.deepEqual(decoded.assignment, {
    kind: 'keyboard',
    modifiers: 0,
    usageId: 0x09,
  })
})

test('mouse ButtonCode remap matches Synapse MW codec', () => {
  const args = encodeMouseButtonMapping(
    VIPER_V4_BUTTON_IDS.back,
    VIPER_V4_MOUSE_FN.forward,
  )
  assert.deepEqual(
    [...args.slice(0, 6)],
    [0x01, 0x04, 0x00, 0x01, 0x01, VIPER_V4_MOUSE_FN.forward],
  )
  assert.equal(decodeButtonAssignment(args).assignment.kind, 'mouse')
})

test('DPI Cycle Up remap uses Synapse Vh.DPI fnData', () => {
  const args = encodeButtonAssignment(VIPER_V4_BUTTON_IDS.dpiCycle, {
    kind: 'dpi',
    dpiFn: VIPER_V4_DPI_FN.cycleUp,
  })
  assert.deepEqual([...args.slice(0, 6)], [0x01, 0x60, 0x00, 0x06, 0x01, 0x06])
})

test('Hypershift mode bit is set in payload byte 2', () => {
  const args = encodeButtonAssignment(
    VIPER_V4_BUTTON_IDS.left,
    { kind: 'off' },
    { hypershift: true },
  )
  assert.equal(args[2], 0x01)
  assert.equal(decodeButtonAssignment(args).hypershift, true)
})

test('Angle Tune matches Synapse taskRunner (profile, enabled, degrees)', () => {
  const args = encodeAngleTune({ isEnabled: true, value: -44 })
  assert.deepEqual([...args], [1, 1, 0xd4])
  assert.deepEqual(decodeAngleTune(args), { isEnabled: true, value: -44 })
  assert.deepEqual([...encodeAngleTune({ isEnabled: false, value: 0 })], [1, 0, 0])
  // Synapse disable capture is 01 00 00 — angle must be zeroed when off.
  assert.deepEqual([...encodeAngleTune({ isEnabled: false, value: 30 })], [1, 0, 0])
})

test('Smart Tracking lift setting follows orca5Plus Universal / Preset modes', () => {
  assert.deepEqual(
    [...encodeLiftSetting({
      isAsymmetric: false,
      trackingDistance: 2,
      liftOffDistance: 13,
      landingDistance: 12,
    })],
    [0, 4, 1, 1],
  )
  assert.deepEqual(
    [...encodeLiftSetting({
      isAsymmetric: true,
      trackingDistance: 2,
      liftOffDistance: 13,
      landingDistance: 12,
    })],
    [0, 4, 4, 0],
  )
  assert.deepEqual(
    [...encodeProximitySensorState(true)],
    [0, 4, 1],
  )
  const cfg = encodeProximityConfiguration({
    isAsymmetric: true,
    trackingDistance: 2,
    liftOffDistance: 13,
    landingDistance: 12,
  })
  assert.equal(cfg.length, 10)
  assert.deepEqual([...cfg.slice(0, 4)], [0, 4, 12, 11])
})

test('Dynamic Sensitivity state/mode match Synapse TK.Bh / TK.dx', () => {
  assert.deepEqual([...encodeDynSensState(0)], [1, 0])
  assert.deepEqual([...encodeDynSensMode(2)], [1, 2])
  assert.deepEqual(dynModeIdToWire('jump'), { state: 1, mode: 2 })
  assert.deepEqual(dynModeIdToWire('off'), { state: 0, mode: 0 })
})
