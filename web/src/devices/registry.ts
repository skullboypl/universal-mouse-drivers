import { FenrirMaxDriver } from './gwolves-fenrir-max/driver'
import { FENRIR_MAX_IDENTITY } from './gwolves-fenrir-max/identity'
import { SuperlightDriver } from './logitech-pro-x-superlight/driver'
import { SUPERLIGHT_IDENTITY } from './logitech-pro-x-superlight/identity'
import { BlitzUltimateDriver } from './rampage-blitz-ultimate/driver'
import { BLITZ_ULTIMATE_IDENTITY } from './rampage-blitz-ultimate/identity'
import { KING_ULTRA_IDENTITY } from './redragon-king-ultra/identity'
import { KingUltraDriver } from './redragon-king-ultra/driver'
import type { DeviceDriver } from './DeviceDriver'
import type { DeviceIdentity } from './types'

/** Public support matrix shown on the UMD home screen. */
export const DEVICE_CATALOG: DeviceIdentity[] = [
  KING_ULTRA_IDENTITY,
  BLITZ_ULTIMATE_IDENTITY,
  FENRIR_MAX_IDENTITY,
  SUPERLIGHT_IDENTITY,
]

export function findCatalogDevice(
  vendorId: number,
  productId: number,
): DeviceIdentity | undefined {
  return DEVICE_CATALOG.find(
    (d) =>
      d.vendorId === vendorId && d.productIds.includes(productId),
  )
}

export function createDriver(deviceId: string): DeviceDriver {
  if (deviceId === KING_ULTRA_IDENTITY.id) return new KingUltraDriver()
  if (deviceId === BLITZ_ULTIMATE_IDENTITY.id) return new BlitzUltimateDriver()
  if (deviceId === FENRIR_MAX_IDENTITY.id) return new FenrirMaxDriver()
  if (deviceId === SUPERLIGHT_IDENTITY.id) return new SuperlightDriver()
  throw new Error(`Unknown device: ${deviceId}`)
}
