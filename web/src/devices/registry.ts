import { KING_ULTRA_IDENTITY } from './redragon-king-ultra/identity'
import { KingUltraDriver } from './redragon-king-ultra/driver'
import type { DeviceIdentity } from './types'

/** Public support matrix shown on the UMD home screen. */
export const DEVICE_CATALOG: DeviceIdentity[] = [
  KING_ULTRA_IDENTITY,
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

export function createDriver(deviceId: string): KingUltraDriver {
  if (deviceId === KING_ULTRA_IDENTITY.id) return new KingUltraDriver()
  throw new Error(`Unknown device: ${deviceId}`)
}
