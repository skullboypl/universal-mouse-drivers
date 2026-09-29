import test from 'node:test'
import assert from 'node:assert/strict'
import { SUPPORTED_HID_FILTERS } from '@openmouse/protocol/drivers'
import { capabilityForFilter } from './openmouse-capabilities.mjs'

function filter(vid, pid) {
  const value = SUPPORTED_HID_FILTERS.find(
    (f) => f.vendorId === vid && f.productId === pid,
  )
  assert.ok(value, `missing upstream filter ${vid.toString(16)}:${pid.toString(16)}`)
  return value
}

test('VAXEE exposes driver methods and a static DPI grid', () => {
  const caps = capabilityForFilter(filter(0x3057, 0x1001))
  assert.equal(caps.driver, 'VaxeeHidClient')
  assert.equal(caps.controls.dpiWrite, 'driver')
  assert.equal(caps.controls.dpiRead, 'runtime')
  assert.deepEqual(caps.dpiRange, { min: 100, max: 26000, step: 50 })
  assert.deepEqual(caps.pollingRatesHz, [500, 1000])
})

test('Glorious Classic is resolved through its vendor control collection', () => {
  const caps = capabilityForFilter(filter(0x258a, 0x201a))
  assert.equal(caps.driver, 'GloriousClassicHidClient')
  assert.equal(caps.match, 'conditional')
  assert.equal(caps.controls.rgb, 'driver')
  assert.equal(caps.controls.buttons, 'unknown')
})

test('placeholder setters never count as controls', () => {
  const nape = capabilityForFilter(filter(0x3434, 0x0440))
  assert.equal(nape.driver, 'KeychronNapeHidClient')
  assert.equal(nape.controls.dpiWrite, 'driver')
  assert.equal(nape.controls.lod, 'unknown')
  assert.equal(nape.controls.motionSync, 'unknown')
  assert.equal(nape.controls.debounce, 'unknown')

  const viper = capabilityForFilter(filter(0x1532, 0x00e5))
  assert.equal(viper.driver, 'RazerViperV4ProHidClient')
  assert.equal(viper.controls.lod, 'unknown')
})

test('unknown VID:PID receives no inferred features', () => {
  const caps = capabilityForFilter({ vendorId: 0xffff, productId: 0xffff })
  assert.equal(caps.match, 'unknown')
  assert.equal(caps.driver, null)
  assert.ok(Object.values(caps.controls).every((value) => value === 'unknown'))
})
